import {products,storeConfig} from '../../src/data.js';

export type OrderEmailItem = {
  productId:string; name:string; size:string; colour:string; quantity:number;
  unitPrice:number; lineTotal:number;
};

export type OrderEmailPayload = {
  orderNumber:string; createdAt:string;
  customer:{fullName:string;email:string;phone:string};
  delivery:{address:string;city:string;state:string;instructions:string};
  items:OrderEmailItem[]; subtotal:number; deliveryFee:number; total:number;
  paymentMethod:'Bank Transfer'; paymentStatus:string; orderStatus:string;
};

export type EmailMessage = {from:string;to:string[];subject:string;html:string;text:string};
export type EmailClient = {send:(message:EmailMessage,options:{idempotencyKey:string})=>Promise<{id:string}>};
export type EmailConfig = {
  from:string;adminEmail:string;siteUrl:string;
  bank:{verified:boolean;name?:string;accountName?:string;accountNumber?:string};
};
export type EmailSubmissionResult =
  | {submitted:true;id:string}
  | {submitted:false;error:unknown};
export type OrderEmailDeliveryResult = {
  outcome:'complete'|'partial'|'failed';
  customer:EmailSubmissionResult;
  admin:EmailSubmissionResult;
};

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=(value:unknown,max=240)=>typeof value==='string'&&value.trim().length>0&&value.trim().length<=max;
const money=(value:unknown)=>Number.isSafeInteger(value)&&Number(value)>=0;
const escapeHtml=(value:string)=>value.replace(/[&<>'"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]!));
const naira=(value:number)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(value);

export function validateOrderEmailPayload(value:unknown):value is OrderEmailPayload {
  if(!value||typeof value!=='object')return false;
  const order=value as Partial<OrderEmailPayload>;
  if(!clean(order.orderNumber,100)||!clean(order.createdAt,80)||Number.isNaN(Date.parse(String(order.createdAt))))return false;
  if(!order.customer||!clean(order.customer.fullName,120)||!clean(order.customer.email,254)||!emailPattern.test(order.customer.email)||!clean(order.customer.phone,40))return false;
  if(!order.delivery||!clean(order.delivery.address,300)||!clean(order.delivery.city,100)||!clean(order.delivery.state,100)||typeof order.delivery.instructions!=='string'||order.delivery.instructions.length>500)return false;
  if(!Array.isArray(order.items)||order.items.length<1||order.items.length>100)return false;
  for(const item of order.items){
    if(!item||!clean(item.productId,100)||!clean(item.name,160)||!clean(item.size,80)||!clean(item.colour,80))return false;
    if(!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>100||!money(item.unitPrice)||!money(item.lineTotal)||item.lineTotal!==item.unitPrice*item.quantity)return false;
    const product=products.find(candidate=>candidate.id===item.productId);
    const variant=product?.variants.find(candidate=>candidate.size===item.size&&candidate.colour===item.colour);
    if(!product||!variant?.available||item.name!==product.name||item.unitPrice!==product.price)return false;
  }
  if(!money(order.subtotal)||!money(order.deliveryFee)||!money(order.total))return false;
  const itemTotal=order.items.reduce((sum,item)=>sum+item.lineTotal,0);
  const subtotal=Number(order.subtotal),deliveryFee=Number(order.deliveryFee),total=Number(order.total);
  if(subtotal!==itemTotal||total!==subtotal+deliveryFee)return false;
  const expectedDelivery=subtotal>=storeConfig.freeDeliveryAt?0:storeConfig.deliveryFee;
  if(deliveryFee!==expectedDelivery)return false;
  return order.paymentMethod==='Bank Transfer'&&clean(order.paymentStatus,80)&&clean(order.orderStatus,80);
}
export function validateEmailConfig(config:EmailConfig){
  const fromAddress=config.from.match(/<([^>]+)>/)?.[1]||config.from;
  if(!emailPattern.test(fromAddress)||!emailPattern.test(config.adminEmail))throw new Error('Email service is not configured');
  try{new URL(config.siteUrl)}catch{throw new Error('Email service is not configured')}
  if(config.bank.verified&&(!clean(config.bank.name)||!clean(config.bank.accountName)||!clean(config.bank.accountNumber)))throw new Error('Verified bank configuration is incomplete');
}

const emailShell=(content:string)=>`<!doctype html><html><body style="margin:0;background:#eeeeea;font-family:Arial,Helvetica,sans-serif;color:#080808"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eeeeea"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff"><tr><td style="background:#080808;color:#ffffff;padding:24px 28px;font-size:26px;font-weight:900;letter-spacing:3px">FORGED</td></tr>${content}<tr><td style="background:#080808;color:#aaaaaa;padding:20px 28px;font-size:11px;line-height:18px">FORGED ACTIVEWEAR · BUILT FOR THE GRIND</td></tr></table></td></tr></table></body></html>`;
const heading=(overline:string,title:string)=>`<tr><td style="padding:34px 28px 18px"><div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#777777">${escapeHtml(overline)}</div><h1 style="margin:12px 0 0;font-size:38px;line-height:40px;text-transform:uppercase">${escapeHtml(title)}</h1></td></tr>`;
const rows=(order:OrderEmailPayload)=>order.items.map(item=>`<tr><td style="padding:14px 0;border-bottom:1px solid #dddddd"><strong>${escapeHtml(item.name)}</strong><div style="margin-top:5px;color:#666666;font-size:12px">${escapeHtml(item.size)} · ${escapeHtml(item.colour)} · Qty ${item.quantity} · ${naira(item.unitPrice)} each</div></td><td align="right" style="padding:14px 0;border-bottom:1px solid #dddddd;font-weight:700;white-space:nowrap">${naira(item.lineTotal)}</td></tr>`).join('');
const totals=(order:OrderEmailPayload)=>`<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:7px 0;color:#666666">Subtotal</td><td align="right">${naira(order.subtotal)}</td></tr><tr><td style="padding:7px 0;color:#666666">Delivery</td><td align="right">${order.deliveryFee?naira(order.deliveryFee):'Free'}</td></tr><tr><td style="padding:15px 0 0;border-top:2px solid #080808;font-size:18px;font-weight:800">Total</td><td align="right" style="padding:15px 0 0;border-top:2px solid #080808;font-size:18px;font-weight:800">${naira(order.total)}</td></tr></table>`;

export function renderCustomerEmail(order:OrderEmailPayload,config:EmailConfig){
  const trackingUrl=new URL('/track',config.siteUrl);trackingUrl.searchParams.set('order',order.orderNumber);
  const bank=config.bank.verified
    ? `<div style="background:#f3f3ef;padding:16px;margin-top:18px"><strong>Verified bank-transfer instructions</strong><div style="margin-top:8px;line-height:20px">${escapeHtml(config.bank.name!)}<br>${escapeHtml(config.bank.accountName!)}<br>${escapeHtml(config.bank.accountNumber!)}</div></div>`
    : `<div style="background:#f3f3ef;padding:16px;margin-top:18px;line-height:20px"><strong>Bank-transfer instructions</strong><br>Verified transfer instructions are not yet available. Do not transfer money to an unverified account.</div>`;
  const body=`${heading('ORDER CONFIRMATION','Your order is recorded.')}<tr><td style="padding:0 28px 30px"><p style="font-size:16px;line-height:25px">Hi ${escapeHtml(order.customer.fullName)}, your order has been created. Email delivery does not change its payment status.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0"><tr><td><strong>ORDER REFERENCE</strong><br><span style="font-size:20px">${escapeHtml(order.orderNumber)}</span></td><td align="right"><strong>STATUS</strong><br>${escapeHtml(order.orderStatus)}</td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows(order)}</table><div style="padding-top:22px">${totals(order)}</div><p style="margin:22px 0 0;line-height:22px"><strong>Payment method:</strong> ${escapeHtml(order.paymentMethod)}<br><strong>Payment status:</strong> ${escapeHtml(order.paymentStatus)}</p>${bank}<p style="margin:26px 0 0"><a href="${trackingUrl.href}" style="display:inline-block;background:#080808;color:#ffffff;text-decoration:none;padding:14px 20px;font-size:12px;font-weight:700;letter-spacing:1px">TRACK YOUR ORDER</a></p></td></tr>`;
  return {subject:`FORGED order ${order.orderNumber} confirmed`,html:emailShell(body),text:`FORGED order confirmation\nOrder: ${order.orderNumber}\nCustomer: ${order.customer.fullName}\nItems:\n${order.items.map(item=>`${item.name} — ${item.size} / ${item.colour} × ${item.quantity} at ${naira(item.unitPrice)} each: ${naira(item.lineTotal)}`).join('\n')}\nSubtotal: ${naira(order.subtotal)}\nDelivery: ${naira(order.deliveryFee)}\nTotal: ${naira(order.total)}\nPayment: ${order.paymentMethod} — ${order.paymentStatus}\nStatus: ${order.orderStatus}\n${config.bank.verified?'Use only the verified instructions in this email.':'Verified bank-transfer instructions are not yet available. Do not transfer to an unverified account.'}\nTrack: ${trackingUrl.href}`};
}

export function renderAdminEmail(order:OrderEmailPayload,config:EmailConfig){
  const adminUrl=new URL('/admin',config.siteUrl);
  const address=`${order.delivery.address}, ${order.delivery.city}, ${order.delivery.state}`;
  const body=`${heading('NEW ORDER','Review required.')}<tr><td style="padding:0 28px 30px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:12px 0 24px"><tr><td><strong>ORDER</strong><br>${escapeHtml(order.orderNumber)}</td><td align="right"><strong>PAYMENT</strong><br>${escapeHtml(order.paymentStatus)}</td></tr></table><p style="line-height:22px"><strong>${escapeHtml(order.customer.fullName)}</strong><br>${escapeHtml(order.customer.email)}<br>${escapeHtml(order.customer.phone)}<br><br><strong>Delivery address</strong><br>${escapeHtml(address)}${order.delivery.instructions?`<br>${escapeHtml(order.delivery.instructions)}`:''}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows(order)}</table><div style="padding-top:22px">${totals(order)}</div><p style="line-height:22px"><strong>Payment method:</strong> ${escapeHtml(order.paymentMethod)}<br><strong>Order status:</strong> ${escapeHtml(order.orderStatus)}<br><strong>Tracking reference:</strong> ${escapeHtml(order.orderNumber)}</p><p style="margin:26px 0 0"><a href="${adminUrl.href}" style="display:inline-block;background:#080808;color:#ffffff;text-decoration:none;padding:14px 20px;font-size:12px;font-weight:700;letter-spacing:1px">OPEN ORDER MANAGEMENT</a></p></td></tr>`;
  return {subject:`New FORGED order ${order.orderNumber}`,html:emailShell(body),text:`New FORGED order\nOrder: ${order.orderNumber}\nCustomer: ${order.customer.fullName}\nEmail: ${order.customer.email}\nPhone: ${order.customer.phone}\nDelivery: ${address}\nItems:\n${order.items.map(item=>`${item.name} × ${item.quantity} at ${naira(item.unitPrice)} each: ${naira(item.lineTotal)}`).join('\n')}\nSubtotal: ${naira(order.subtotal)}\nDelivery: ${naira(order.deliveryFee)}\nTotal: ${naira(order.total)}\nPayment: ${order.paymentMethod} — ${order.paymentStatus}\nStatus: ${order.orderStatus}\nAdmin: ${adminUrl.href}`};
}

export async function sendOrderCreatedEmails(order:OrderEmailPayload,config:EmailConfig,client:EmailClient){
  if(!validateOrderEmailPayload(order))throw new Error('Invalid order email payload');
  validateEmailConfig(config);
  const customer=renderCustomerEmail(order,config);const admin=renderAdminEmail(order,config);
  const [customerResult,adminResult]=await Promise.allSettled([
    client.send({from:config.from,to:[order.customer.email],...customer},{idempotencyKey:`order-created/customer/${order.orderNumber}`}),
    client.send({from:config.from,to:[config.adminEmail],...admin},{idempotencyKey:`order-created/admin/${order.orderNumber}`}),
  ]);
  const customerSubmission:EmailSubmissionResult=customerResult.status==='fulfilled'
    ? {submitted:true,id:customerResult.value.id}
    : {submitted:false,error:customerResult.reason};
  const adminSubmission:EmailSubmissionResult=adminResult.status==='fulfilled'
    ? {submitted:true,id:adminResult.value.id}
    : {submitted:false,error:adminResult.reason};
  const submittedCount=Number(customerSubmission.submitted)+Number(adminSubmission.submitted);
  return {
    outcome:submittedCount===2?'complete':submittedCount===1?'partial':'failed',
    customer:customerSubmission,
    admin:adminSubmission,
  } satisfies OrderEmailDeliveryResult;
}
