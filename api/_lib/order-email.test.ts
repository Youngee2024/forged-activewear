import {afterEach,describe,expect,it,vi} from 'vitest';
import handler,{deliveryHttpResult} from '../order-notifications';
import {notifyPersistedOrder,persistOrderAndNotify} from '../../src/order-email';
import {
  renderAdminEmail,
  renderCustomerEmail,
  sendOrderCreatedEmails,
  validateOrderEmailPayload,
  type EmailClient,
  type EmailConfig,
  type OrderEmailPayload,
} from './order-email';
import type {Order} from '../../src/types';

const order:OrderEmailPayload={
  orderNumber:'FORGED-TEST-0001',createdAt:'2026-11-19T12:00:00.000Z',
  customer:{fullName:'Ada Okafor',email:'ada@example.com',phone:'+2348012345678'},
  delivery:{address:'12 Training Road',city:'Lagos',state:'Lagos',instructions:'Call on arrival'},
  items:[{productId:'m-core-compression',name:'Core Compression Tee',size:'M',colour:'Black',quantity:2,unitPrice:18500,lineTotal:37000}],
  subtotal:37000,deliveryFee:3500,total:40500,paymentMethod:'Bank Transfer',paymentStatus:'Awaiting Payment',orderStatus:'Pending Payment',
};
const config:EmailConfig={from:'FORGED <orders@forged.example>',adminEmail:'admin@forged.example',siteUrl:'https://forged.example',bank:{verified:false}};
const localOrder:Order={...order,paymentStatus:'Awaiting Payment',orderStatus:'Pending Payment',items:[{productId:'m-core-compression',size:'M',colour:'Black',quantity:2}]};

const client=(fail:'customer'|'admin'|'both'|null=null)=>{
  const send=vi.fn(async(message:Parameters<EmailClient['send']>[0],options:Parameters<EmailClient['send']>[1])=>{
    const target=message.to[0]===order.customer.email?'customer':'admin';
    if(fail==='both'||fail===target)throw new Error(`${target} rejected`);
    return {id:`${target}-${options.idempotencyKey}`};
  });
  return {send,service:{send} as EmailClient};
};

const apiResponse=()=>{
  const state:{status:number;body:unknown;headers:Record<string,string>}={status:200,body:null,headers:{}};
  const response={
    setHeader:(name:string,value:string)=>{state.headers[name]=value},
    status:(code:number)=>{state.status=code;return response},
    json:(value:unknown)=>{state.body=value},
  };
  return {state,response};
};

afterEach(()=>vi.unstubAllEnvs());

describe('FORGED order email submissions',()=>{
  it('reports complete success when both emails are submitted',async()=>{
    const mock=client();
    const result=await sendOrderCreatedEmails(order,config,mock.service);
    expect(result.outcome).toBe('complete');
    expect(result.customer.submitted).toBe(true);
    expect(result.admin.submitted).toBe(true);
    expect(deliveryHttpResult(result)).toMatchObject({status:200,body:{outcome:'complete',customerSubmitted:true,adminSubmitted:true}});
  });

  it('reports partial success when the customer submission fails',async()=>{
    const result=await sendOrderCreatedEmails(order,config,client('customer').service);
    expect(result).toMatchObject({outcome:'partial',customer:{submitted:false},admin:{submitted:true}});
    expect(deliveryHttpResult(result)).toMatchObject({status:207,body:{outcome:'partial',customerSubmitted:false,adminSubmitted:true}});
  });

  it('reports partial success when the administrator submission fails',async()=>{
    const result=await sendOrderCreatedEmails(order,config,client('admin').service);
    expect(result).toMatchObject({outcome:'partial',customer:{submitted:true},admin:{submitted:false}});
    expect(deliveryHttpResult(result)).toMatchObject({status:207,body:{outcome:'partial',customerSubmitted:true,adminSubmitted:false}});
  });

  it('reports total failure when both submissions fail',async()=>{
    const result=await sendOrderCreatedEmails(order,config,client('both').service);
    expect(result).toMatchObject({outcome:'failed',customer:{submitted:false},admin:{submitted:false}});
    expect(deliveryHttpResult(result)).toMatchObject({status:502,body:{outcome:'failed',customerSubmitted:false,adminSubmitted:false,code:'EMAIL_SUBMISSION_FAILED'}});
  });

  it('uses the configured recipients and stable distinct idempotency keys',async()=>{
    const mock=client();
    await sendOrderCreatedEmails(order,config,mock.service);
    await sendOrderCreatedEmails(order,config,mock.service);
    expect(mock.send).toHaveBeenCalledWith(expect.objectContaining({to:['ada@example.com']}),{idempotencyKey:`order-created/customer/${order.orderNumber}`});
    expect(mock.send).toHaveBeenCalledWith(expect.objectContaining({to:['admin@forged.example']}),{idempotencyKey:`order-created/admin/${order.orderNumber}`});
    expect(new Set(mock.send.mock.calls.map(call=>call[1].idempotencyKey))).toEqual(new Set([
      `order-created/customer/${order.orderNumber}`,
      `order-created/admin/${order.orderNumber}`,
    ]));
  });

  it('accepts awaiting-payment orders for notification',()=>{
    expect(order.paymentStatus).toBe('Awaiting Payment');
    expect(validateOrderEmailPayload(order)).toBe(true);
  });

  it('rejects an invalid payload before any email submission',async()=>{
    const invalid={...order,customer:{...order.customer,email:'not-an-email'}};
    const mock=client();
    expect(validateOrderEmailPayload(invalid)).toBe(false);
    await expect(sendOrderCreatedEmails(invalid,config,mock.service)).rejects.toThrow('Invalid order');
    expect(mock.send).not.toHaveBeenCalled();
    const recorder=apiResponse();
    await handler({method:'POST',body:{order:invalid}} as never,recorder.response as never);
    expect(recorder.state).toMatchObject({status:400,body:{outcome:'failed',code:'INVALID_ORDER'}});
  });

  it('returns a configuration failure when required environment variables are missing',async()=>{
    vi.stubEnv('RESEND_API_KEY','');
    vi.stubEnv('FORGED_FROM_EMAIL','');
    vi.stubEnv('FORGED_ADMIN_EMAIL','');
    const recorder=apiResponse();
    await handler({method:'POST',body:{order}} as never,recorder.response as never);
    expect(recorder.state).toMatchObject({status:503,body:{outcome:'failed',customerSubmitted:false,adminSubmitted:false,code:'EMAIL_NOT_CONFIGURED'}});
  });
});

describe('FORGED checkout notification boundary',()=>{
  it('does not notify when local order persistence fails',async()=>{
    const notify=vi.fn();
    const storage={getItem:()=>null,setItem:()=>{throw new Error('quota')}};
    const result=persistOrderAndNotify(localOrder,{storage,notify});
    expect(result.persisted).toBe(false);
    expect(notify).not.toHaveBeenCalled();
    await expect(result.notification).resolves.toMatchObject({outcome:'not-requested',code:'ORDER_NOT_PERSISTED'});
  });

  it('keeps a persisted order when notification fails',async()=>{
    const records=new Map<string,string>();
    const notify=vi.fn(async()=>{throw new Error('Resend unavailable')});
    const storage={getItem:(key:string)=>records.get(key)||null,setItem:(key:string,value:string)=>{records.set(key,value)}};
    const result=persistOrderAndNotify(localOrder,{storage,notify});
    await expect(result.notification).resolves.toMatchObject({outcome:'failed',code:'REQUEST_FAILED'});
    expect(result.persisted).toBe(true);
    expect(JSON.parse(records.get('forged-orders')||'[]')).toHaveLength(1);
  });

  it('skips duplicate local orders without claiming notification success',async()=>{
    const records=new Map<string,string>();
    const notify=vi.fn(async()=>({outcome:'complete' as const,customerSubmitted:true,adminSubmitted:true}));
    const storage={getItem:(key:string)=>records.get(key)||null,setItem:(key:string,value:string)=>{records.set(key,value)}};
    const first=persistOrderAndNotify(localOrder,{storage,notify});
    await first.notification;
    const second=persistOrderAndNotify(localOrder,{storage,notify});
    expect(second.duplicate).toBe(true);
    await expect(second.notification).resolves.toMatchObject({outcome:'not-requested',code:'DUPLICATE_ORDER'});
    expect(notify).toHaveBeenCalledTimes(1);
    expect(JSON.parse(records.get('forged-orders')||'[]')).toHaveLength(1);
  });

  it('preserves an accurate partial API result in the frontend client',async()=>{
    const fetcher=vi.fn(async()=>new Response(JSON.stringify({outcome:'partial',customerSubmitted:true,adminSubmitted:false}),{status:207,headers:{'Content-Type':'application/json'}})) as typeof fetch;
    await expect(notifyPersistedOrder(localOrder,fetcher)).resolves.toEqual({outcome:'partial',customerSubmitted:true,adminSubmitted:false,code:undefined});
    expect(fetcher).toHaveBeenCalledWith('/api/order-notifications',expect.objectContaining({method:'POST',keepalive:true}));
  });
});

describe('FORGED email content safety',()=>{
  it('never invents bank details when verified configuration is absent',()=>{
    const email=renderCustomerEmail(order,config);
    expect(email.html).toContain('Verified transfer instructions are not yet available');
    expect(email.html).not.toMatch(/account number/i);
  });

  it('does not expose a Resend credential in rendered content',()=>{
    const secret='server-secret-placeholder';
    const output=JSON.stringify([renderCustomerEmail(order,config),renderAdminEmail(order,config)]);
    expect(output).not.toContain(secret);
    expect(output).not.toContain('RESEND_API_KEY');
  });

  it('renders totals from the validated order values',()=>{
    const customer=renderCustomerEmail(order,config);
    const admin=renderAdminEmail(order,config);
    expect(customer.text).toContain('₦40,500');
    expect(admin.text).toContain('₦40,500');
    expect(customer.text).toContain('₦37,000');
  });
});
