export type CartItem = { productId:string; size:string; colour:string; quantity:number };
export type PaymentStatus = 'Awaiting Payment' | 'Payment Under Review' | 'Paid' | 'Rejected';
export type OrderStatus = 'Pending Payment' | 'Awaiting Payment Verification' | 'Processing' | 'Ready for Dispatch' | 'Shipped' | 'Delivered' | 'Cancelled';
export type Order = {
  orderNumber:string; createdAt:string; customer:{fullName:string; email:string; phone:string};
  delivery:{address:string; city:string; state:string; instructions:string}; items:CartItem[];
  subtotal:number; deliveryFee:number; total:number; paymentMethod:'Bank Transfer';
  paymentStatus:PaymentStatus; orderStatus:OrderStatus; transferReference?:string; internalNote?:string;
};
