import {describe,expect,it} from 'vitest';
import {calculateDeliveryFee,hasUnavailableCartItem} from './checkout-rules';
import {products} from './data';

const config={configured:true,freeDeliveryAt:100000,deliveryFee:3500};

describe('checkout business rules',()=>{
  it('keeps delivery charged below the free-delivery threshold',()=>{
    expect(calculateDeliveryFee(99999,config)).toBe(3500);
  });

  it('makes delivery free at or above the product subtotal threshold',()=>{
    expect(calculateDeliveryFee(100000,config)).toBe(0);
    expect(calculateDeliveryFee(125000,config)).toBe(0);
  });

  it('does not return a fake zero fee when rates are unconfigured',()=>{
    expect(calculateDeliveryFee(35000,{...config,configured:false})).toBeNull();
  });

  it('blocks unavailable or invalid cart variants',()=>{
    const product=products[0];
    const unavailable={...product.variants[0],available:false};
    const catalog=products.map(item=>item.id===product.id?{...item,variants:[unavailable]}:item);
    expect(hasUnavailableCartItem([{productId:product.id,size:product.variants[0].size,colour:product.variants[0].colour,quantity:1}],catalog)).toBe(true);
    expect(hasUnavailableCartItem([{productId:'missing',size:'M',colour:'Black',quantity:1}],products)).toBe(true);
  });
});
