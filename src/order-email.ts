import {products} from './data';
import type {Order} from './types';

export type NotificationResult={
  outcome:'complete'|'partial'|'failed'|'not-requested';
  customerSubmitted:boolean;
  adminSubmitted:boolean;
  code?:string;
};

const failedNotification=(code:string):NotificationResult=>({
  outcome:'failed',customerSubmitted:false,adminSubmitted:false,code,
});

export function toOrderEmailPayload(order:Order){
  return {...order,items:order.items.map(item=>{
    const product=products.find(candidate=>candidate.id===item.productId);
    if(!product)throw new Error('Order contains an unknown product');
    return {...item,name:product.name,unitPrice:product.price,lineTotal:product.price*item.quantity};
  })};
}

export async function notifyPersistedOrder(order:Order,fetcher:typeof fetch=fetch):Promise<NotificationResult>{
  const response=await fetcher('/api/order-notifications',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({order:toOrderEmailPayload(order)}),keepalive:true,
  });
  const body=await response.json().catch(()=>null) as NotificationResult|null;
  if(!body||!['complete','partial','failed'].includes(body.outcome))return failedNotification('INVALID_RESPONSE');
  return {
    outcome:body.outcome,
    customerSubmitted:body.customerSubmitted===true,
    adminSubmitted:body.adminSubmitted===true,
    code:body.code,
  };
}

type StorageLike={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void};
type PersistenceDependencies={storage:StorageLike;notify:(order:Order)=>Promise<NotificationResult>};

export function persistOrderAndNotify(order:Order,{storage,notify}:PersistenceDependencies){
  try{
    const existing=JSON.parse(storage.getItem('forged-orders')||'[]') as Order[];
    const duplicate=existing.some(item=>item.orderNumber===order.orderNumber);
    const orders=duplicate?existing:[order,...existing];
    if(!duplicate)storage.setItem('forged-orders',JSON.stringify(orders));
    const notification=duplicate
      ? Promise.resolve<NotificationResult>({outcome:'not-requested',customerSubmitted:false,adminSubmitted:false,code:'DUPLICATE_ORDER'})
      : notify(order).catch(()=>failedNotification('REQUEST_FAILED'));
    return {persisted:true,duplicate,orders,notification};
  }catch{
    return {persisted:false,duplicate:false,orders:[] as Order[],notification:Promise.resolve<NotificationResult>({outcome:'not-requested',customerSubmitted:false,adminSubmitted:false,code:'ORDER_NOT_PERSISTED'})};
  }
}
