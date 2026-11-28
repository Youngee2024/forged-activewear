import type {CartItem} from './types';
import type {Product} from './data';

export type DeliveryRuleConfig = {configured:boolean;freeDeliveryAt:number;deliveryFee:number};

export function calculateDeliveryFee(subtotal:number,config:DeliveryRuleConfig):number|null{
  if(!config.configured)return null;
  return subtotal>=config.freeDeliveryAt?0:config.deliveryFee;
}

export function hasUnavailableCartItem(cart:readonly CartItem[],catalog:readonly Product[]):boolean{
  return cart.some(item=>{
    const product=catalog.find(candidate=>candidate.id===item.productId);
    const variant=product?.variants.find(candidate=>candidate.size===item.size&&candidate.colour===item.colour);
    return !product||product.inventoryStatus==='unavailable'||!variant?.available;
  });
}
