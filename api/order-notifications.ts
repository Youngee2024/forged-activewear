import type {IncomingMessage,ServerResponse} from 'node:http';
import {Resend} from 'resend';
import {sendOrderCreatedEmails,validateOrderEmailPayload,type EmailClient,type EmailConfig,type EmailSubmissionResult,type OrderEmailDeliveryResult} from './_lib/order-email.js';

type Request=IncomingMessage&{body?:unknown};
type Response=ServerResponse&{status:(code:number)=>Response;json:(value:unknown)=>void};

const jsonBody=(body:unknown)=>{
  if(typeof body!=='string')return body;
  if(body.length>100_000)throw new Error('Request too large');
  return JSON.parse(body) as unknown;
};

const siteUrl=()=>{
  if(process.env.FORGED_SITE_URL)return process.env.FORGED_SITE_URL;
  const host=process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL;
  return host?`https://${host}`:'http://localhost:5173';
};

export const configFromEnvironment=():EmailConfig=>({
  from:process.env.FORGED_FROM_EMAIL||'',
  adminEmail:process.env.FORGED_ADMIN_EMAIL||'',
  siteUrl:siteUrl(),
  bank:{
    verified:process.env.FORGED_BANK_DETAILS_VERIFIED==='true',
    name:process.env.FORGED_BANK_NAME,
    accountName:process.env.FORGED_BANK_ACCOUNT_NAME,
    accountNumber:process.env.FORGED_BANK_ACCOUNT_NUMBER,
  },
});

type SafeProviderError={provider:'resend'|'application';code:string;statusCode:number|null};

class EmailProviderSubmissionError extends Error {
  constructor(readonly safe:SafeProviderError){super('Email provider rejected the submission')}
}

const safeError=(submission:EmailSubmissionResult):SafeProviderError|null=>{
  if(submission.submitted)return null;
  if(submission.error instanceof EmailProviderSubmissionError)return submission.error.safe;
  return {provider:'application',code:'UNEXPECTED_SUBMISSION_ERROR',statusCode:null};
};

export const deliveryHttpResult=(delivery:OrderEmailDeliveryResult)=>{
  const body={
    outcome:delivery.outcome,
    customerSubmitted:delivery.customer.submitted,
    adminSubmitted:delivery.admin.submitted,
    ...(delivery.outcome==='failed'?{code:'EMAIL_SUBMISSION_FAILED'}:{}),
  };
  return {status:delivery.outcome==='complete'?200:delivery.outcome==='partial'?207:502,body};
};

export default async function handler(request:Request,response:Response){
  if(request.method!=='POST'){response.setHeader('Allow','POST');return response.status(405).json({outcome:'failed',customerSubmitted:false,adminSubmitted:false,code:'METHOD_NOT_ALLOWED'})}
  let payload:unknown;
  try{payload=jsonBody(request.body)}catch{return response.status(400).json({outcome:'failed',customerSubmitted:false,adminSubmitted:false,code:'INVALID_REQUEST'})}
  const order=payload&&typeof payload==='object'&&'order' in payload?(payload as {order:unknown}).order:payload;
  if(!validateOrderEmailPayload(order))return response.status(400).json({outcome:'failed',customerSubmitted:false,adminSubmitted:false,code:'INVALID_ORDER'})
  const apiKey=process.env.RESEND_API_KEY;
  const config=configFromEnvironment();
  if(!apiKey||!config.from||!config.adminEmail)return response.status(503).json({outcome:'failed',customerSubmitted:false,adminSubmitted:false,code:'EMAIL_NOT_CONFIGURED'})
  const resend=new Resend(apiKey);
  const client:EmailClient={send:async(message,options)=>{
    const {data,error}=await resend.emails.send(message,options);
    if(error)throw new EmailProviderSubmissionError({provider:'resend',code:error.name||'UNKNOWN_RESEND_ERROR',statusCode:error.statusCode});
    if(!data?.id)throw new EmailProviderSubmissionError({provider:'resend',code:'INVALID_PROVIDER_RESPONSE',statusCode:null});
    return {id:data.id};
  }};
  try{
    const delivery=await sendOrderCreatedEmails(order,config,client);
    if(!delivery.customer.submitted)console.error('FORGED order email submission failed',{orderNumber:order.orderNumber,target:'customer',...safeError(delivery.customer)});
    if(!delivery.admin.submitted)console.error('FORGED order email submission failed',{orderNumber:order.orderNumber,target:'administrator',...safeError(delivery.admin)});
    const result=deliveryHttpResult(delivery);
    return response.status(result.status).json(result.body);
  }catch(error){
    console.error('FORGED order email request failed',{orderNumber:order.orderNumber,code:error instanceof Error?error.name:'UNKNOWN_APPLICATION_ERROR'});
    return response.status(502).json({outcome:'failed',customerSubmitted:false,adminSubmitted:false,code:'EMAIL_REQUEST_FAILED'});
  }
}
