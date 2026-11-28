import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronDown, ChevronRight, Copy, Heart, Maximize2, Menu, Minus, PackageCheck, Plus, Ruler, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Truck, X, Zap } from 'lucide-react';
import { formatNaira, getProductVariant, isProductAvailable, products, sizeGuideConfig, storeConfig, type Category, type Product, type SizeGuideGroup } from './data';
import type { CartItem, Order, OrderStatus } from './types';
import {persistOrderAndNotify} from './order-email';
import {nextPreviewOrderReference} from './preview-order-reference';
import {calculateDeliveryFee,hasUnavailableCartItem} from './checkout-rules';

const read = <T,>(key:string, fallback:T):T => { try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; } };
const path = () => `${window.location.pathname}${window.location.search}`;
const navigate = (to:string) => { history.pushState({},'',to); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({top:0,behavior:'smooth'}); };
const keyFor = (i:CartItem) => `${i.productId}-${i.size}-${i.colour}`;
const nigerianStates=['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','Abuja FCT'];

function App() {
  const [route,setRoute] = useState(path());
  const pathname = route.split('?')[0];
  const [cart,setCart] = useState<CartItem[]>(()=>read('forged-cart',[]));
  const [wishlist,setWishlist] = useState<string[]>(()=>read('forged-wishlist',[]));
  const [orders,setOrders] = useState<Order[]>(()=>read('forged-orders',[]));
  const [cartOpen,setCartOpen] = useState(false);
  const [menuOpen,setMenuOpen] = useState(false);
  const [toast,setToast] = useState('');
  useEffect(()=>{ const f=()=>setRoute(path()); addEventListener('popstate',f); return()=>removeEventListener('popstate',f); },[]);
  useEffect(()=>localStorage.setItem('forged-cart',JSON.stringify(cart)),[cart]);
  useEffect(()=>localStorage.setItem('forged-wishlist',JSON.stringify(wishlist)),[wishlist]);
  useEffect(()=>localStorage.setItem('forged-orders',JSON.stringify(orders)),[orders]);
  const notify=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),2400)};
  const addCart=(item:CartItem)=>{setCart(c=>{const k=keyFor(item), found=c.find(x=>keyFor(x)===k);return found?c.map(x=>keyFor(x)===k?{...x,quantity:x.quantity+item.quantity}:x):[...c,item]});setCartOpen(true);notify('Added to your kit')};
  const updateOrder=(number:string, patch:Partial<Order>)=>setOrders(o=>o.map(x=>x.orderNumber===number?{...x,...patch}:x));
  const ctx={cart,setCart,wishlist,setWishlist,orders,setOrders,addCart,notify,updateOrder};
  let page=<Home ctx={ctx}/>;
  if(pathname==='/shop') page=<Shop ctx={ctx}/>;
  else if(pathname.startsWith('/product/')) page=<CatalogueProductPage id={pathname.split('/')[2]} ctx={ctx}/>;
  else if(pathname==='/cart') page=<CartPage ctx={ctx}/>;
  else if(pathname==='/checkout') page=<Checkout ctx={ctx}/>;
  else if(pathname.startsWith('/payment/')) page=<Payment orderNumber={pathname.split('/')[2]} ctx={ctx}/>;
  else if(pathname.startsWith('/confirmation/')) page=<Confirmation orderNumber={pathname.split('/')[2]} ctx={ctx}/>;
  else if(pathname==='/track') page=<Tracking ctx={ctx}/>;
  else if(pathname==='/admin') page=<Admin ctx={ctx}/>;
  else if(pathname!=='/') page=info[pathname]?<InfoPage route={pathname}/>:<NotFound/>;
  return <>
    <Header count={cart.reduce((a,b)=>a+b.quantity,0)} onCart={()=>setCartOpen(true)} menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>
    <main>{page}</main><SupportContact/><Footer/>
    <CartDrawer open={cartOpen} close={()=>setCartOpen(false)} ctx={ctx}/>
    {toast&&<div className="toast"><Check size={16}/>{toast}</div>}
  </>;
}

type Ctx={cart:CartItem[];setCart:React.Dispatch<React.SetStateAction<CartItem[]>>;wishlist:string[];setWishlist:React.Dispatch<React.SetStateAction<string[]>>;orders:Order[];setOrders:React.Dispatch<React.SetStateAction<Order[]>>;addCart:(i:CartItem)=>void;notify:(m:string)=>void;updateOrder:(n:string,p:Partial<Order>)=>void};

function Header({count,onCart,menuOpen,setMenuOpen}:{count:number;onCart:()=>void;menuOpen:boolean;setMenuOpen:(v:boolean)=>void}) {
  const links=[['Shop','/shop'],['Men','/shop?category=Men'],['Women','/shop?category=Women'],['Accessories','/shop?category=Accessories'],['Equipment','/shop?category=Equipment']];
  const announcement=storeConfig.promotion.enabled?storeConfig.promotion.message:storeConfig.announcement.message;
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setMenuOpen(false)};addEventListener('keydown',close);return()=>removeEventListener('keydown',close)},[setMenuOpen]);
  return <>{storeConfig.announcement.enabled&&<div className="announcement">{announcement}</div>}<header>
    <button className="icon mobile" onClick={()=>setMenuOpen(!menuOpen)} aria-label={menuOpen?'Close menu':'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation">{menuOpen?<X/>:<Menu/>}</button>
    <button className="brand" onClick={()=>{setMenuOpen(false);navigate('/')}} aria-label="FORGED home"><img className="brand-shield" src="/brand/forged-shield-white.png" alt=""/><img className="brand-wordmark" src="/brand/forged-wordmark-white.png" alt=""/></button>
    <nav>{links.map(([l,u])=><button key={l} onClick={()=>navigate(u)}>{l}</button>)}</nav>
    <div className="header-actions"><button className="icon" onClick={()=>{setMenuOpen(false);navigate('/shop?focus=search')}} aria-label="Search products"><Search/></button><button className="icon desktop" onClick={()=>navigate('/track')} aria-label="View saved checkout details"><PackageCheck/></button><button className="bag" onClick={onCart} aria-label={`Open cart, ${count} items`}><ShoppingBag/><span aria-hidden="true">{count}</span></button></div>
  </header>{menuOpen&&<div className="mobile-menu" id="mobile-navigation">{links.map(([l,u])=><button key={l} onClick={()=>{navigate(u);setMenuOpen(false)}}>{l}<ArrowRight/></button>)}<button onClick={()=>{navigate('/track');setMenuOpen(false)}}>Saved details<PackageCheck/></button></div>}</>;
}

function Home({ctx}:{ctx:Ctx}) { return <>
  <section className="hero"><div className="hero-copy"><p className="eyebrow">FORGED / TRAINING SYSTEM</p><h1>BUILT FOR<br/>THE GRIND.</h1><p>Training-inspired apparel and essentials for the work you return to.</p><div className="actions"><button className="btn light" onClick={()=>navigate('/shop')}>SHOP COLLECTION <ArrowRight/></button><button className="btn ghost" onClick={()=>navigate('/about')}>EXPLORE FORGED</button></div></div></section>
  <section className="ticker"><span>DISCIPLINE IN MOTION</span><Zap/><span>MADE FOR THE RELENTLESS</span><Zap/><span>OSOGBO / NIGERIA</span></section>
  <section className="section"><SectionHead over="SHOP BY DISCIPLINE" title="YOUR WORK. YOUR KIT." link="VIEW ALL" to="/shop"/><div className="category-grid">
    <CategoryCard title="MEN'S TRAINING" category="Men" image={products[0].images[0]} n="01"/><CategoryCard title="WOMEN'S TRAINING" category="Women" image={products[3].images[0]} n="02"/><CategoryCard title="ACCESSORIES" category="Accessories" image={products[6].images[0]} n="03"/><CategoryCard title="EQUIPMENT" category="Equipment" image={products[9].images[0]} n="04"/>
  </div></section>
  <section className="section off"><SectionHead over="THE CORE KIT" title="THE ESSENTIALS." link="BROWSE ALL PRODUCTS" to="/shop"/><div className="product-grid">{products.filter(p=>p.featured&&!p.isNew).slice(0,4).map(p=><ProductCard key={p.id} product={p} ctx={ctx}/>)}</div></section>
  <section className="section new-arrivals"><SectionHead over="MORE TO EXPLORE" title="THE TRAINING EDIT." link="SHOP THE COLLECTION" to="/shop"/><div className="product-grid">{products.filter(p=>p.isNew).slice(0,4).map(p=><ProductCard key={p.id} product={p} ctx={ctx}/>)}</div></section>
  <section className="manifesto"><div><p className="eyebrow">THE FORGED MINDSET</p><h2>DISCIPLINE IS<br/>THE DIFFERENCE.</h2></div><div><p>Progress is built in the sessions no one applauds. FORGED is designed for the people who return, repeat and raise the standard—performance essentials that support consistent movement, confident training and the work it takes to get better.</p><button className="text-link" onClick={()=>navigate('/about')}>THE FORGED MINDSET <ArrowRight/></button></div></section>
  <section className="craft"><div className="craft-image"><img src="/images/fabric-detail-v2.png" alt="Close-up visual of dark performance fabric and stitching" loading="lazy"/></div><div className="craft-copy"><p className="eyebrow dark">FORM / FUNCTION / FOCUS</p><h2>DETAILS THAT<br/>KEEP UP.</h2><p>The right training kit should feel considered from first wear to final rep. Explore the collection by silhouette, colour and fit, with full garment details to follow as each product is confirmed.</p><button className="text-link" onClick={()=>navigate('/shop')}>EXPLORE THE COLLECTION <ArrowRight/></button></div></section>
  <section className="community" style={{backgroundImage:"linear-gradient(90deg,rgba(0,0,0,.82),rgba(0,0,0,.1)),url('/images/sample-equipment.jpg')"}}><div><p className="eyebrow">FORGED / OSOGBO, OSUN STATE</p><h2>ROOTED HERE.<br/>BUILT TO MOVE.</h2><p>Rooted in Osogbo. Driven by the people who return to the work, day after day.</p></div></section>
  <section className="trust-row"><div><Truck/><b>DELIVERY</b><span>Service areas and rates will be confirmed at launch</span></div><div><ShieldCheck/><b>BANK TRANSFER</b><span>Only verified payment instructions will be shown</span></div><div><PackageCheck/><b>ORDER UPDATES</b><span>Track your saved checkout details on this device</span></div></section>
  </> }

function SectionHead({over,title,link,to}:{over:string;title:string;link:string;to:string}){return <div className="section-head"><div><p className="eyebrow dark">{over}</p><h2>{title}</h2></div><button className="text-link" onClick={()=>navigate(to)}>{link}<ArrowRight/></button></div>}
function CategoryCard({title,category,image,n}:{title:string;category:Category;image:string;n:string}){return <button className="category-card" onClick={()=>navigate(`/shop?category=${category}`)}><img src={image} alt={`${title} collection visual`} loading="lazy"/><span className="shade"/><small>{n}</small><div><h3>{title}</h3><span>EXPLORE <ArrowRight/></span></div></button>}

function ProductCard({product,ctx}:{product:Product;ctx:Ctx}){const wished=ctx.wishlist.includes(product.id);const available=isProductAvailable(product);const quickAdd=()=>{if(product.productType==='apparel'){navigate(`/product/${product.id}`);return}const variant=product.variants.find(item=>item.available);if(!variant){ctx.notify('This option is unavailable');return}ctx.addCart({productId:product.id,size:variant.size,colour:variant.colour,quantity:1})};return <article className="product-card"><button aria-label={`${wished?'Remove':'Add'} ${product.name} ${wished?'from':'to'} wishlist`} className={`wish ${wished?'active':''}`} onClick={()=>ctx.setWishlist(w=>w.includes(product.id)?w.filter(x=>x!==product.id):[...w,product.id])}><Heart fill={wished?'currentColor':'none'}/></button><div className="product-visual"><button className="product-img" onClick={()=>navigate(`/product/${product.id}`)}><img src={product.images[0]} alt={product.imageDetails[0].alt} loading="lazy"/></button><button className="quick-add" disabled={!available} onClick={quickAdd}>{product.productType==='apparel'?'SELECT OPTIONS':'ADD TO KIT'} <Plus/></button></div><div className="product-meta"><div><p>{product.category}</p><button onClick={()=>navigate(`/product/${product.id}`)}>{product.name}</button><div className="colour-dots" aria-label={`Available colours: ${product.colours.join(', ')}`}>{product.colours.map(c=><i key={c} title={c} className={c.toLowerCase().replace(' ','-')}/>)}</div></div><b>{formatNaira(product.price)}</b></div></article>}

function Shop({ctx}:{ctx:Ctx}){
  const query=location.search;const params=new URLSearchParams(query); const initial=params.get('category')||'All';
  const [category,setCategory]=useState(initial);const [search,setSearch]=useState('');const [sort,setSort]=useState('featured');const [filters,setFilters]=useState(false);const [size,setSize]=useState('All');const [max,setMax]=useState(50000);
  useEffect(()=>{setCategory(new URLSearchParams(query).get('category')||'All');if(new URLSearchParams(query).get('focus'))setTimeout(()=>document.getElementById('search')?.focus(),100)},[query]);
  const list=useMemo(()=>products.filter(p=>(category==='All'||p.category===category)&&(size==='All'||p.sizes.length===0||p.sizes.includes(size))&&p.price<=max&&(`${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:sort==='name'?a.name.localeCompare(b.name):Number(b.featured)-Number(a.featured)),[category,search,sort,size,max]);
  return <><div className="shop-hero"><p className="eyebrow">THE COLLECTION / {list.length} PIECES</p><h1>{category==='All'?'SHOP THE SYSTEM':category.toUpperCase()}</h1><p>Training apparel and essentials with a clear point of view.</p></div><p className="catalogue-note">Collection imagery and product details are being finalised. Prices and options shown here are for reference until confirmed by FORGED.</p><div className="shop-tools"><div className="search"><Search/><input id="search" placeholder="Search the collection" value={search} onChange={e=>setSearch(e.target.value)}/></div><button onClick={()=>setFilters(!filters)}><SlidersHorizontal/> FILTERS</button><label>SORT <select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="name">Name: A–Z</option><option value="low">Price: Low</option><option value="high">Price: High</option></select><ChevronDown/></label></div>
  {filters&&<div className="filters"><div><b>CATEGORY</b><div>{['All','Men','Women','Accessories','Equipment'].map(x=><button className={category===x?'active':''} onClick={()=>setCategory(x)}>{x}</button>)}</div></div><div><b>SIZE</b><div>{['All','XS','S','M','L','XL'].map(x=><button className={size===x?'active':''} onClick={()=>setSize(x)}>{x}</button>)}</div></div><div><b>MAX PRICE — {formatNaira(max)}</b><input type="range" min="10000" max="50000" step="5000" value={max} onChange={e=>setMax(+e.target.value)}/></div></div>}
  <section className="shop-layout"><aside><b>COLLECTION</b>{['All','Men','Women','Accessories','Equipment'].map(x=><button className={category===x?'active':''} onClick={()=>setCategory(x)}>{x}<span>{x==='All'?products.length:products.filter(p=>p.category===x).length}</span></button>)}</aside><div>{list.length?<div className="product-grid">{list.map(p=><ProductCard key={p.id} product={p} ctx={ctx}/>)}</div>:<div className="empty"><Search/><h3>Nothing matched.</h3><p>Try clearing a filter or widening your price range.</p></div>}</div></section></>;
}

function CatalogueProductPage({id,ctx}:{id:string;ctx:Ctx}) {
  const p=products.find(product=>product.id===id);
  const [imageIndex,setImageIndex]=useState(0);
  const [size,setSize]=useState('');
  const [colour,setColour]=useState(p?.colours[0]||'');
  const [quantity,setQuantity]=useState(1);
  const [guideOpen,setGuideOpen]=useState(false);
  const [viewerOpen,setViewerOpen]=useState(false);
  useEffect(()=>{setImageIndex(0);setSize('');setColour(p?.colours[0]||'');setQuantity(1)},[id,p]);
  if(!p)return <NotFound/>;
  const effectiveSize=p.productType==='apparel'?size:p.sizes[0];
  const selectedVariant=getProductVariant(p,effectiveSize,colour);
  const canAdd=Boolean(selectedVariant?.available);
  const add=()=>{
    if(p.productType==='apparel'&&!size){ctx.notify('Select a size first');return}
    if(!selectedVariant?.available){ctx.notify('That option is not available');return}
    ctx.addCart({productId:p.id,size:effectiveSize,colour,quantity});
  };
  const related=[...products.filter(item=>item.id!==p.id&&item.category===p.category),...products.filter(item=>item.id!==p.id&&item.category!==p.category)].slice(0,4);
  return <>
    <section className="pdp catalogue-pdp">
      <div className="gallery catalogue-gallery">
        <div className="thumbs catalogue-thumbs" aria-label="Product image gallery">
          {p.imageDetails.map((item,index)=><button key={`${item.src}-${index}`} className={imageIndex===index?'active':''} onClick={()=>setImageIndex(index)} aria-label={`View ${item.label.toLowerCase()} image`} aria-pressed={imageIndex===index}><img src={item.src} alt=""/><span>{item.label}</span></button>)}
        </div>
        <div className="main-image catalogue-main">
          <button className="pdp-image-button" onClick={()=>setViewerOpen(true)} aria-label={`Enlarge image: ${p.imageDetails[imageIndex].alt}`}><img src={p.imageDetails[imageIndex].src} alt={p.imageDetails[imageIndex].alt}/></button>
          {p.imageDetails.length>1&&<button className="gallery-next" onClick={()=>setImageIndex((imageIndex+1)%p.imageDetails.length)} aria-label="Next product image"><ChevronRight/></button>}
          <button className="zoom-control" onClick={()=>setViewerOpen(true)} aria-label="Open enlarged image"><Maximize2/> ENLARGE</button>
        </div>
      </div>
      <div className="pdp-info catalogue-info">
        <p className="eyebrow dark">{p.category} / {p.sku}</p>
        <h1>{p.name}</h1><h3>{formatNaira(p.price)}</h3><p>{p.description}</p>
        <p className="pdp-disclosure">Product imagery, options and pricing are subject to final confirmation.</p>
        {p.productType==='apparel'&&<fieldset><legend>SELECT SIZE <button onClick={()=>setGuideOpen(true)}><Ruler/> SIZE GUIDE</button></legend><div className="options">{p.sizes.map(option=>{const variant=getProductVariant(p,option,colour);return <button key={option} disabled={!variant?.available} className={size===option?'active':''} onClick={()=>setSize(option)} aria-pressed={size===option}>{option}</button>})}</div></fieldset>}
        <fieldset><legend>COLOUR — {colour}</legend><div className="options">{p.colours.map(option=>{const optionSize=effectiveSize||p.sizes[0];const variant=getProductVariant(p,optionSize,option);return <button key={option} disabled={!variant?.available} className={colour===option?'active':''} onClick={()=>setColour(option)} aria-pressed={colour===option}>{option}</button>})}</div></fieldset>
        <div className="buy"><div className="quantity" aria-label="Quantity"><button onClick={()=>setQuantity(Math.max(1,quantity-1))} aria-label="Decrease quantity"><Minus/></button><span>{quantity}</span><button onClick={()=>setQuantity(Math.min(10,quantity+1))} aria-label="Increase quantity"><Plus/></button></div><button className="btn dark" disabled={!canAdd} onClick={add}>{p.productType==='apparel'&&!size?'SELECT A SIZE':'ADD TO KIT'} <ShoppingBag/></button></div>
        <p className="pdp-disclosure">Final stock availability and garment specifications will be published before orders open.</p>
        <div className="pdp-service"><div><Truck/><span><b>DELIVERY</b>{storeConfig.delivery.summary}</span></div><div><ShieldCheck/><span><b>RETURNS</b>{storeConfig.returns.summary}</span></div></div>
      </div>
    </section>
    <section className="section off"><SectionHead over="COMPLETE YOUR KIT" title="TRAIN TOGETHER." link="SHOP ALL" to="/shop"/><div className="product-grid">{related.map(item=><ProductCard key={item.id} product={item} ctx={ctx}/>)}</div></section>
    {guideOpen&&p.sizeGuide&&<SizeGuideModal group={p.sizeGuide} onClose={()=>setGuideOpen(false)}/>} 
    {viewerOpen&&<ImageViewer product={p} index={imageIndex} setIndex={setImageIndex} onClose={()=>setViewerOpen(false)}/>} 
  </>;
}

function SizeGuideModal({group,onClose}:{group:Exclude<SizeGuideGroup,null>;onClose:()=>void}) {
  const guide=sizeGuideConfig[group];
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};addEventListener('keydown',key);document.body.style.overflow='hidden';return()=>{removeEventListener('keydown',key);document.body.style.overflow=''}},[onClose]);
  return <div className="modal-shell" role="dialog" aria-modal="true" aria-labelledby="size-guide-title"><button className="modal-backdrop" onClick={onClose} aria-label="Close size guide"/><div className="size-guide-modal"><button className="modal-close" onClick={onClose} aria-label="Close size guide" autoFocus><X/></button><p className="eyebrow dark">FIT REFERENCE</p><h2 id="size-guide-title">{guide.title.toUpperCase()}</h2><div className="pending-panel"><Ruler/><div><b>GARMENT MEASUREMENTS TO FOLLOW</b><p>Use these body-measurement points as a guide. Product-specific size dimensions will be added once confirmed.</p></div></div><h3>HOW TO MEASURE</h3><ol><li><b>Chest</b><span>Measure around the fullest part, keeping the tape level.</span></li><li><b>Waist</b><span>Measure around your natural waist without pulling the tape tight.</span></li><li><b>Hips</b><span>Measure around the fullest part of your hips.</span></li><li><b>Inseam</b><span>Measure from the upper inner leg to the ankle.</span></li></ol></div></div>;
}

function ImageViewer({product,index,setIndex,onClose}:{product:Product;index:number;setIndex:(index:number)=>void;onClose:()=>void}) {
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose();if(event.key==='ArrowRight')setIndex((index+1)%product.imageDetails.length);if(event.key==='ArrowLeft')setIndex((index-1+product.imageDetails.length)%product.imageDetails.length)};addEventListener('keydown',key);document.body.style.overflow='hidden';return()=>{removeEventListener('keydown',key);document.body.style.overflow=''}},[index,onClose,product.imageDetails.length,setIndex]);
  return <div className="image-viewer" role="dialog" aria-modal="true" aria-label={`${product.name} enlarged image`}><button className="viewer-close" onClick={onClose} aria-label="Close enlarged image" autoFocus><X/></button><button className="viewer-prev" onClick={()=>setIndex((index-1+product.imageDetails.length)%product.imageDetails.length)} aria-label="Previous product image"><ChevronRight/></button><figure><img src={product.imageDetails[index].src} alt={product.imageDetails[index].alt}/><figcaption>{product.imageDetails[index].label}</figcaption></figure><button className="viewer-next" onClick={()=>setIndex((index+1)%product.imageDetails.length)} aria-label="Next product image"><ChevronRight/></button></div>;
}

function CartDrawer({open,close,ctx}:{open:boolean;close:()=>void;ctx:Ctx}){const total=ctx.cart.reduce((a,i)=>a+(products.find(p=>p.id===i.productId)?.price||0)*i.quantity,0);useEffect(()=>{if(!open)return;const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')close()};addEventListener('keydown',onKey);return()=>removeEventListener('keydown',onKey)},[open,close]);return <><button className={`scrim ${open?'open':''}`} onClick={close} aria-label="Close cart overlay" tabIndex={open?0:-1}/><aside className={`drawer ${open?'open':''}`} role="dialog" aria-modal={open} aria-label="Shopping cart" aria-hidden={!open} inert={!open}><div className="drawer-head"><div><p className="eyebrow dark">YOUR TRAINING KIT</p><h2>{ctx.cart.length?`${ctx.cart.length} ITEM${ctx.cart.length>1?'S':''}`:'EMPTY'}</h2></div><button className="icon" onClick={close} aria-label="Close cart"><X/></button></div><CartItems ctx={ctx}/>{ctx.cart.length>0&&<div className="drawer-bottom"><div><span>SUBTOTAL</span><b>{formatNaira(total)}</b></div><p>Delivery calculated at checkout.</p><button className="btn dark full" onClick={()=>{close();navigate('/checkout')}}>CHECKOUT <ArrowRight/></button><button className="text-link" onClick={()=>{close();navigate('/cart')}}>VIEW FULL CART</button></div>}</aside></>}
function CartItems({ctx}:{ctx:Ctx}){return <div className="cart-items">{ctx.cart.map(i=>{const p=products.find(x=>x.id===i.productId)!;return <div className="cart-line" key={keyFor(i)}><img src={p.images[0]} alt={p.name}/><div><b>{p.name}</b><span>{i.size} / {i.colour}</span><strong>{formatNaira(p.price)}</strong><div className="mini-qty"><button aria-label={`Decrease ${p.name} quantity`} onClick={()=>ctx.setCart(c=>c.map(x=>keyFor(x)===keyFor(i)?{...x,quantity:Math.max(1,x.quantity-1)}:x))}>−</button><span aria-label={`Quantity ${i.quantity}`}>{i.quantity}</span><button aria-label={`Increase ${p.name} quantity`} onClick={()=>ctx.setCart(c=>c.map(x=>keyFor(x)===keyFor(i)?{...x,quantity:x.quantity+1}:x))}>+</button></div></div><button aria-label={`Remove ${p.name} from cart`} onClick={()=>ctx.setCart(c=>c.filter(x=>keyFor(x)!==keyFor(i)))}><X/></button></div>})}{!ctx.cart.length&&<div className="empty"><ShoppingBag/><h3>Your kit is empty.</h3><button className="btn dark" onClick={()=>navigate('/shop')}>START SHOPPING</button></div>}</div>}

function CartPage({ctx}:{ctx:Ctx}){const sub=ctx.cart.reduce((a,i)=>a+products.find(p=>p.id===i.productId)!.price*i.quantity,0);return <PageWrap title="YOUR KIT" over="CART"><div className="cart-page"><CartItems ctx={ctx}/><OrderSummary subtotal={sub} action={()=>navigate('/checkout')} label="PROCEED TO CHECKOUT"/></div></PageWrap>}
function OrderSummary({subtotal,action,label}:{subtotal:number;action:()=>void;label:string}){const delivery=calculateDeliveryFee(subtotal,{configured:storeConfig.delivery.configured,freeDeliveryAt:storeConfig.freeDeliveryAt,deliveryFee:storeConfig.deliveryFee});return <aside className="summary"><h3>YOUR SUMMARY</h3><div><span>Items subtotal</span><b>{formatNaira(subtotal)}</b></div><div><span>Delivery</span><b>{delivery===null?'To be confirmed':delivery?formatNaira(delivery):'Free'}</b></div><div className="total"><span>{delivery===null?'ESTIMATED TOTAL':'TOTAL'}</span><b>{delivery===null?'To be confirmed':formatNaira(subtotal+delivery)}</b></div><small>Delivery rates depend on destination and packed weight. Checkout will open when the correct rate can be calculated.</small><button disabled={!subtotal||delivery===null} className="btn dark full" onClick={action}>{delivery===null?'CHECKOUT UNAVAILABLE':label}<ArrowRight/></button></aside>}

function Checkout({ctx}:{ctx:Ctx}) {
  const [errors,setErrors]=useState<Record<string,string>>({});
  const sub=ctx.cart.reduce((sum,item)=>sum+products.find(product=>product.id===item.productId)!.price*item.quantity,0);
  const delivery=calculateDeliveryFee(sub,{configured:storeConfig.delivery.configured,freeDeliveryAt:storeConfig.freeDeliveryAt,deliveryFee:storeConfig.deliveryFee});
  const submit=(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const data=Object.fromEntries(new FormData(event.currentTarget));
    const required=['fullName','email','phone','address','city','state','instructions'];const nextErrors:Record<string,string>={};
    required.forEach(key=>{if(!String(data[key]||'').trim())nextErrors[key]='This field is required'});
    if(data.email&&!/\S+@\S+\.\S+/.test(String(data.email)))nextErrors.email='Enter a valid email';
    setErrors(nextErrors);if(Object.keys(nextErrors).length)return;
    if(!ctx.cart.length){ctx.notify('Your cart is empty');return}
    if(!storeConfig.delivery.configured){ctx.notify('Checkout is unavailable until delivery rates are configured.');return}
    const unavailable=hasUnavailableCartItem(ctx.cart,products);
    if(unavailable){ctx.notify('One or more items are unavailable. Remove them before checkout.');return}
    const confirmedDelivery=delivery as number;
    const savedOrders=read<Order[]>('forged-orders',[]);
    const number=nextPreviewOrderReference([...savedOrders,...ctx.orders].map(item=>item.orderNumber));
    const order:Order={orderNumber:number,createdAt:new Date().toISOString(),customer:{fullName:String(data.fullName),email:String(data.email),phone:String(data.phone)},delivery:{address:String(data.address),city:String(data.city),state:String(data.state),instructions:String(data.instructions||'')},items:ctx.cart,subtotal:sub,deliveryFee:confirmedDelivery,total:sub+confirmedDelivery,paymentMethod:'Bank Transfer',paymentStatus:'Awaiting Payment',orderStatus:'Pending Payment'};
    // A browser-saved checkout is not a received order. Keep the email integration dormant
    // until checkout is backed by a real order-creation service.
    const result=persistOrderAndNotify(order,{storage:localStorage,notify:async()=>({outcome:'not-requested',customerSubmitted:false,adminSubmitted:false,code:'CHECKOUT_NOT_OPEN'})});
    if(!result.persisted){ctx.notify('We could not save your order. Please try again.');return}
    void result.notification.then(notification=>{
      if(notification.outcome==='partial'||notification.outcome==='failed'){
        if(!notification.customerSubmitted)ctx.notify('Your order was saved, but confirmation email could not be submitted. Keep your order reference.');
        console.error('FORGED order notification incomplete',{
          orderNumber:number,
          outcome:notification.outcome,
          customerSubmitted:notification.customerSubmitted,
          adminSubmitted:notification.adminSubmitted,
          code:notification.code,
        });
      }
    });
    ctx.setOrders(result.orders);ctx.setCart([]);navigate(`/payment/${number}`);
  };
  return <PageWrap title="CHECKOUT" over="YOUR DETAILS"><form className="checkout" onSubmit={submit}>
    <div>
      <p className="checkout-disclosure">Checkout is not open for purchases yet. Details saved here stay on this device and do not place an order with FORGED.</p>
      <FormSection n="01" title="CUSTOMER INFORMATION"><Field name="fullName" label="Full name" error={errors.fullName}/><div className="form-row"><Field name="email" type="email" label="Email address" error={errors.email}/><Field name="phone" type="tel" label="Phone number" error={errors.phone}/></div></FormSection>
      <FormSection n="02" title="DELIVERY INFORMATION"><Field name="address" label="Street address" error={errors.address}/><div className="form-row"><Field name="city" label="City / LGA" error={errors.city}/><label className="field">STATE<select name="state" defaultValue=""><option value="" disabled>Select state</option>{nigerianStates.map(state=><option key={state}>{state}</option>)}</select>{errors.state&&<em>{errors.state}</em>}</label></div><Field name="instructions" label="Nearby landmark" error={errors.instructions}/></FormSection>
      <FormSection n="03" title="PAYMENT METHOD"><label className="payment-choice"><input type="radio" checked readOnly/><span><b>BANK TRANSFER</b><small>Payment will be confirmed manually once verified instructions are available.</small></span><ShieldCheck/></label><p className="payment-pending">Checkout is not open yet. Verified payment instructions and delivery rates are not available.</p></FormSection>
      <button className="btn dark full" type="submit" disabled={!storeConfig.delivery.configured}>CHECKOUT UNAVAILABLE <ArrowRight/></button><p className="legal">Read our current <button type="button" onClick={()=>navigate('/terms')}>Terms</button> and <button type="button" onClick={()=>navigate('/privacy')}>Privacy notice</button> before continuing.</p>
    </div>
    <aside className="checkout-review"><h3>YOUR SELECTION</h3>{ctx.cart.map(item=>{const product=products.find(candidate=>candidate.id===item.productId)!;return <div className="review-line" key={keyFor(item)}><img src={product.images[0]} alt={product.name}/><div><b>{product.name}</b><span>{item.size} / {item.colour} × {item.quantity}</span></div><strong>{formatNaira(product.price*item.quantity)}</strong></div>})}<div className="summary compact"><div><span>Items subtotal</span><b>{formatNaira(sub)}</b></div><div><span>Delivery</span><b>{delivery===null?'To be confirmed':delivery?formatNaira(delivery):'Free'}</b></div><div className="total"><span>{delivery===null?'ESTIMATED TOTAL':'TOTAL'}</span><b>{delivery===null?'To be confirmed':formatNaira(sub+delivery)}</b></div></div></aside>
  </form></PageWrap>;
}
function FormSection({n,title,children}:{n:string;title:string;children:React.ReactNode}){return <section className="form-section"><div><span>{n}</span><h3>{title}</h3></div>{children}</section>}
function Field({name,label,type='text',error,defaultValue}:{name:string;label:string;type?:string;error?:string;defaultValue?:string}){return <label className="field">{label.toUpperCase()}<input name={name} type={type} defaultValue={defaultValue}/>{error&&<em>{error}</em>}</label>}

function Payment({orderNumber,ctx}:{orderNumber:string;ctx:Ctx}) {
  const order=ctx.orders.find(item=>item.orderNumber===orderNumber);
  const [copied,setCopied]=useState('');
  if(!order)return <NotFound/>;
  const copy=(value:string,key:string)=>navigator.clipboard.writeText(value).then(()=>{setCopied(key);setTimeout(()=>setCopied(''),1600)});
  const submit=(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!storeConfig.bank.verified){ctx.notify('Verified transfer instructions are not configured');return}
    const reference=String(new FormData(event.currentTarget).get('reference')||'').trim();
    if(!reference){ctx.notify('Enter your transfer reference');return}
    ctx.updateOrder(orderNumber,{transferReference:reference,paymentStatus:'Payment Under Review',orderStatus:'Awaiting Payment Verification'});
    navigate(`/confirmation/${orderNumber}`);
  };
  return <PageWrap title={storeConfig.bank.verified?'PAYMENT DETAILS':'CHECKOUT SAVED'} over={`REFERENCE ${order.orderNumber}`}><div className="payment-page">
    <div className="amount-card"><span>ESTIMATED TOTAL</span><strong>{formatNaira(order.total)}</strong><small>Saved on this device. No payment has been recorded.</small></div>
    {storeConfig.bank.verified?<>
      <div className="bank-card"><InfoRow label="BANK" value={storeConfig.bank.name}/><InfoRow label="ACCOUNT NAME" value={storeConfig.bank.accountName}/><InfoRow label="ACCOUNT NUMBER" value={storeConfig.bank.accountNumber} action={<button onClick={()=>copy(storeConfig.bank.accountNumber,'account')}><Copy/>{copied==='account'?'COPIED':'COPY'}</button>}/><InfoRow label="PAYMENT REFERENCE" value={order.orderNumber} action={<button onClick={()=>copy(order.orderNumber,'ref')}><Copy/>{copied==='ref'?'COPIED':'COPY'}</button>}/></div>
      <div className="steps"><h3>HOW TO COMPLETE PAYMENT</h3><ol><li><span>01</span><p>Transfer the exact order total to the verified account above.</p></li><li><span>02</span><p>Use your order number as the payment narration or reference.</p></li><li><span>03</span><p>Submit your bank transaction reference for manual review.</p></li></ol></div>
      <form className="confirm-form" onSubmit={submit}><p className="eyebrow dark">ALREADY TRANSFERRED?</p><h3>SUBMIT PAYMENT CONFIRMATION</h3><label className="field">TRANSACTION ID / TRANSFER REFERENCE<input name="reference" placeholder="Enter your transfer reference"/></label><p className="notice"><ShieldCheck/> Submission does not mark your order as paid. An authorised FORGED administrator must verify the transfer.</p><button className="btn dark full">SUBMIT FOR REVIEW <ArrowRight/></button></form>
    </>:<div className="bank-unavailable"><ShieldCheck/><p className="eyebrow dark">BANK TRANSFER</p><h2>PAYMENT DETAILS ARE COMING.</h2><p>Verified bank details are not available yet. Please do not make a transfer. Your checkout details are saved only on this device and have not been placed as an order with FORGED.</p><p className="payment-reference">Your saved reference: <strong>{order.orderNumber}</strong></p><button className="btn dark" onClick={()=>navigate(`/track?order=${encodeURIComponent(orderNumber)}`)}>VIEW SAVED DETAILS</button></div>}
  </div></PageWrap>;
}
function InfoRow({label,value,action}:{label:string;value:string;action?:React.ReactNode}){return <div className="info-row"><span>{label}</span><strong>{value}</strong>{action}</div>}

// Retained only for the design-preview stylesheet; it is not reachable from production checkout.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LocalPaymentPreview({order,bank}:{order:Order;bank:{name:string;accountName:string;accountNumber:string}}){
  const [copied,setCopied]=useState<'account'|'reference'|null>(null);
  const [copyError,setCopyError]=useState('');
  const copy=async(value:string,key:'account'|'reference')=>{
    try{
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      setCopied(key);setCopyError('');
      window.setTimeout(()=>setCopied(current=>current===key?null:current),2200);
    }catch{setCopyError('Copy was unavailable. Please select and copy the details manually.')}
  };
  return <PageWrap title="COMPLETE YOUR PAYMENT" over="DEMO PAYMENT PREVIEW"><div className="payment-preview">
    <div className="payment-preview-warning" role="note">
  <ShieldCheck/>
  <p>
    <strong>DEMO ONLY — DO NOT TRANSFER MONEY.</strong>
    <br/>
    These are temporary demonstration bank details for FORGED website review.
    They are not verified operational payment details. Do not send money to this account.
    This checkout has not been submitted as an order to FORGED.
  </p>
</div>
    <div className="payment-preview-grid">
      <div className="payment-preview-main">
        <section className="payment-preview-reference" aria-labelledby="preview-reference-title"><div><p className="payment-preview-kicker" id="preview-reference-title">YOUR PREVIEW ORDER REFERENCE</p><strong>{order.orderNumber}</strong><p>In a live checkout, use this reference as your bank-transfer narration or description.</p><div className="payment-preview-reference-total"><span>TOTAL PAYABLE · PREVIEW ONLY</span><b>{formatNaira(order.total)}</b></div></div><button type="button" onClick={()=>copy(order.orderNumber,'reference')} aria-label="Copy order reference"><Copy/>{copied==='reference'?'COPIED':'COPY REFERENCE'}</button></section>
        <section className="payment-preview-bank" aria-labelledby="preview-bank-title"><div className="payment-preview-section-heading"><p className="payment-preview-kicker">BANK TRANSFER / DESIGN PREVIEW</p><h2 id="preview-bank-title">ACCOUNT DETAILS.</h2></div><div className="payment-preview-bank-row"><span>BANK NAME</span><strong>{bank.name}</strong></div><div className="payment-preview-bank-row"><span>ACCOUNT NAME</span><strong>{bank.accountName}</strong></div><div className="payment-preview-bank-row account-number"><span>ACCOUNT NUMBER</span><strong>{bank.accountNumber}</strong><button type="button" onClick={()=>copy(bank.accountNumber,'account')} aria-label="Copy account number"><Copy/>{copied==='account'?'COPIED':'COPY NUMBER'}</button></div><p className="payment-preview-bank-note">Placeholder account for layout review only. Do not make a transfer.</p></section>
        <section className="payment-preview-steps"><div className="payment-preview-section-heading"><p className="payment-preview-kicker">THE PROCESS</p><h2>HOW BANK TRANSFER WILL WORK.</h2></div><p>When verified business details are available and checkout opens:</p><ol><li>Open your mobile banking app or visit your bank.</li><li>Transfer the exact confirmed total to the verified FORGED account shown at that time.</li><li>Enter your order reference as the transfer narration or description.</li><li>Keep your transfer receipt until payment is confirmed.</li></ol></section>
        <section className="payment-preview-confirmation"><h3>PAYMENT CONFIRMATION</h3><p>An order can only be marked as paid after FORGED confirms receipt of funds. A transfer screenshot alone does not confirm payment. No payment or transfer has been recorded for this preview.</p></section>
      </div>
      <aside className="payment-preview-summary" id="payment-order-summary"><p className="payment-preview-kicker">YOUR SAVED SELECTION</p><h2>ORDER SUMMARY.</h2><div className="payment-preview-items">{order.items.map(item=>{const product=products.find(candidate=>candidate.id===item.productId);return <div key={keyFor(item)}><span>{product?.name||item.productId}<small>{item.size} / {item.colour} · Qty {item.quantity}</small></span></div>})}</div><div className="payment-preview-totals"><div><span>Product subtotal</span><strong>{formatNaira(order.subtotal)}</strong></div><div><span>Indicative delivery</span><strong>{formatNaira(order.deliveryFee)}</strong></div><div className="payment-preview-total"><span>TOTAL PAYABLE <small>PREVIEW ONLY</small></span><strong>{formatNaira(order.total)}</strong></div></div><p>Delivery is calculated using the current illustrative checkout rate, not a confirmed business price. No extra charges have been added.</p><button className="payment-preview-secondary" onClick={()=>navigate(`/track?order=${encodeURIComponent(order.orderNumber)}`)}>VIEW SAVED DETAILS</button><button className="payment-preview-secondary" onClick={()=>navigate('/shop')}>CONTINUE BROWSING</button></aside>
    </div><p className="payment-preview-feedback" role="status" aria-live="polite">{copyError|| (copied?`${copied==='account'?'Account number':'Order reference'} copied to clipboard.`:'')}</p>
  </div></PageWrap>;
}

function Confirmation({orderNumber,ctx}:{orderNumber:string;ctx:Ctx}){const o=ctx.orders.find(x=>x.orderNumber===orderNumber);if(!o)return <NotFound/>;return <PageWrap title="REFERENCE SAVED" over="PAYMENT NOT VERIFIED"><div className="success"><div className="success-icon"><Check/></div><h2>KEEP THIS REFERENCE.</h2><p>Your transfer reference is stored in this browser only. It has not been sent to FORGED for review, and payment has not been verified.</p><div><InfoRow label="REFERENCE" value={o.orderNumber}/><InfoRow label="PAYMENT STATUS" value={o.paymentStatus}/><InfoRow label="SAVED STATUS" value={o.orderStatus}/><InfoRow label="ESTIMATED TOTAL" value={formatNaira(o.total)}/></div><button className="btn dark" onClick={()=>navigate(`/track?order=${encodeURIComponent(orderNumber)}`)}>VIEW SAVED DETAILS <ArrowRight/></button></div></PageWrap>}

function Tracking({ctx}:{ctx:Ctx}){const [result,setResult]=useState<Order|null>(null);const [error,setError]=useState('');const reference=new URLSearchParams(location.search).get('order')||'';const submit=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));const found=ctx.orders.find(o=>o.orderNumber.toLowerCase()===String(d.order).toLowerCase()&&o.customer.email.toLowerCase()===String(d.email).toLowerCase());setResult(found||null);setError(found?'':'We could not match that reference and email on this device.')};return <PageWrap title="YOUR SAVED DETAILS" over="CHECKOUT LOOKUP"><div className="track-wrap"><form onSubmit={submit}><p>Enter your saved reference and checkout email to view details stored on this device. Live order tracking will be available when purchases open.</p><Field name="order" label="Reference" defaultValue={reference}/><Field name="email" type="email" label="Email address"/>{error&&<p className="form-error">{error}</p>}<button className="btn dark full">VIEW DETAILS <ArrowRight/></button></form>{result&&<OrderStatusCard order={result}/>} {!result&&<div className="track-art"><PackageCheck/><h3>BUILT FOR<br/>WHAT'S NEXT.</h3></div>}</div></PageWrap>}
function OrderStatusCard({order}:{order:Order}){const statuses:OrderStatus[]=['Pending Payment','Awaiting Payment Verification','Processing','Ready for Dispatch','Shipped','Delivered'];const at=Math.max(0,statuses.indexOf(order.orderStatus));return <div className="status-card"><p className="eyebrow dark">{order.orderNumber}</p><h3>{order.orderStatus.toUpperCase()}</h3><p>Payment: <b>{order.paymentStatus}</b></p><p>This status reflects details saved on this device, not a live fulfilment update.</p><div className="timeline">{statuses.map((s,i)=><div key={s} className={i<=at?'done':''}><span>{i<at?<Check/>:i+1}</span><p>{s}</p></div>)}</div></div>}

function Admin({ctx}:{ctx:Ctx}){void ctx;const [unlocked]=useState(false);if(!unlocked)return <PageWrap title="ADMINISTRATION" over="NOT AVAILABLE"><div className="admin-lock"><ShieldCheck/><h2>STAFF ACCESS IS NOT READY.</h2><p>This customer-facing build has no secure staff authentication or database. Order operations will be enabled after a server-side staff account, permissions and audit trail are implemented.</p><small>Do not use a client-side password to protect production order data.</small></div></PageWrap>;return null}

const info:Record<string,{over:string;title:string;body:React.ReactNode}>={
  '/about':{over:'OUR STORY',title:'THE WORK SHAPES YOU.',body:<><h2>FOR THE RELENTLESS.</h2><p>Based in Osogbo, Osun State, FORGED Activewear is shaped by a simple belief: discipline changes what you can do.</p><p>The collection brings a focused, monochrome point of view to training apparel and everyday movement. Show up, put in the work and keep going.</p><blockquote>DISCIPLINE IS THE DIFFERENCE.<br/>BUILT FOR THE GRIND.</blockquote></>},
  '/contact':{over:'SUPPORT',title:'LET’S TALK.',body:<><h2>CONTACT FORGED.</h2><p>FORGED Activewear Collections is based in Osogbo, Osun State, Nigeria.</p><div className="contact-list"><p><b>EMAIL</b><br/><a href="mailto:afeezyekeen01@gmail.com">afeezyekeen01@gmail.com</a></p><p><b>PHONE</b><br/><a href="tel:+2349165885015">+234 916 588 5015</a></p><p><b>WHATSAPP</b><br/><a href="https://wa.me/2348037235979">+234 803 723 5979</a></p><p><b>SUPPORT HOURS</b><br/>24/7</p></div><p>For order support, include your order number where available. Automated WhatsApp and email updates are not active yet.</p></>},
  '/faq':{over:'ANSWERS',title:'FREQUENTLY ASKED.',body:<><FAQ q="How can I pay?">The intended payment options are bank transfer and Flutterwave. Bank transfers must be manually confirmed before an order is prepared. Flutterwave methods will depend on the options enabled for FORGED's account. Checkout is currently unavailable.</FAQ><FAQ q="Where are you based?">FORGED Activewear Collections is based in Osogbo, Osun State, Nigeria. Orders dispatch from Osogbo by the next business day.</FAQ><FAQ q="How long does delivery take?">Estimated delivery is 1-2 days within Osun State and 1-3 days outside Osun State. Delivery charges vary by destination and packed weight, and rates are not yet configured in checkout.</FAQ><FAQ q="Can I request a return or exchange?">You may request a refund or exchange within 3 days of delivery. Items must be unworn, unwashed and have tags attached. Wrong-size exchanges require the customer to pay redelivery; FORGED pays redelivery for damaged-item exchanges.</FAQ><FAQ q="Can I cancel an order?">Customers may request cancellation before dispatch. A paid cancellation before dispatch follows the applicable refund process.</FAQ><FAQ q="Do I need an account?">Guest checkout and optional customer accounts are intended, but customer accounts are not available in this current build.</FAQ><FAQ q="Can I track my order?">Live order tracking is not available yet. The current page only shows checkout details saved in the same browser.</FAQ></>},
  '/shipping':{over:'DELIVERY',title:'SHIPPING & DELIVERY.',body:<><h2>DELIVERY INFORMATION.</h2><p>Orders dispatch from Osogbo, Osun State by the next business day. There is no separate order cut-off time.</p><p>Estimated delivery is 1-2 days within Osun State and 1-3 days outside Osun State. These are estimates, not guarantees.</p><p>Delivery charges vary by destination and packed weight. FORGED currently uses the GIG Logistics calculator manually to establish rates. Rates will be maintained by broader zones, with Osun town and LGA rates varying by destination and distance.</p><p>GIG rates and zone details have not yet been configured in this website. Checkout remains blocked until an accurate delivery charge can be determined. Free delivery applies nationwide when the product subtotal is ₦100,000 or more, before delivery charges.</p></>},
  '/returns':{over:'AFTER YOUR ORDER',title:'RETURNS & EXCHANGES.',body:<><h2>RETURNS & EXCHANGES.</h2><p>Refund or exchange requests may be made within 3 days of delivery.</p><p>Returned items must be unworn, unwashed and have tags attached. For a wrong-size exchange, the customer pays redelivery. For a damaged-item exchange, FORGED pays redelivery.</p><p>Approved refunds are sent to the original payment method within 1-3 business days. Customers may request cancellation before dispatch; a paid cancellation before dispatch follows the same refund rule.</p><p>Contact FORGED before sending anything back so the request can be reviewed.</p></>},
  '/privacy':{over:'LEGAL',title:'PRIVACY POLICY.',body:<><h2>YOUR INFORMATION.</h2><p>This current preview stores cart, wishlist and checkout details in your browser using local storage. It does not provide customer accounts or a central order database.</p><p>Do not enter information you are not comfortable storing in this browser preview. No live order is placed from the current checkout, and automated notifications are not active.</p><p>Before purchases open, FORGED will publish a complete privacy notice covering the production order system, payment providers, notification providers, data retention, access requests and the responsible contact for privacy questions.</p><p>For current support, contact <a href="mailto:afeezyekeen01@gmail.com">afeezyekeen01@gmail.com</a>.</p></>},
  '/terms':{over:'LEGAL',title:'TERMS & CONDITIONS.',body:<><h2>TERMS OF SALE.</h2><p>Purchases are not open in this current build. Checkout details are saved locally for design review only and do not create a live order.</p><p>When sales open, intended payment options are bank transfer and Flutterwave. Bank-transfer payments must be manually confirmed before preparation. Delivery charges will be calculated from destination and packed weight; rates are not currently configured.</p><p>The confirmed returns, exchange and cancellation rules are set out on the Returns & Exchanges page. Delivery dates are estimates and dispatch is planned for the next business day from Osogbo.</p><p>Before launch, FORGED will publish the final legal terms covering order acceptance, pricing, payment processing, delivery, liability, disputes and applicable law.</p></>}
};
function InfoPage({route}:{route:string}){const p=info[route];return <PageWrap over={p.over} title={p.title}><div className="prose">{p.body}</div></PageWrap>}
function FAQ({q,children}:{q:string;children:React.ReactNode}){return <details><summary>{q}<Plus/></summary><p>{children}</p></details>}
function PageWrap({over,title,children}:{over:string;title:string;children:React.ReactNode}){return <><div className="page-title"><p className="eyebrow">{over}</p><h1>{title}</h1></div><section className="page-body">{children}</section></>}
function NotFound(){return <PageWrap over="404" title="NOT FOUND"><div className="empty"><h3>This route has left the gym.</h3><button className="btn dark" onClick={()=>navigate('/')}>BACK HOME</button></div></PageWrap>}
function SupportContact(){return <section className="support-strip"><div><p className="eyebrow">FORGED ACTIVEWEAR COLLECTIONS</p><p>Osogbo, Osun State, Nigeria · Support available 24/7</p></div><div><a href="mailto:afeezyekeen01@gmail.com">afeezyekeen01@gmail.com</a><a href="tel:+2349165885015">+234 916 588 5015</a><a href="https://wa.me/2348037235979">WhatsApp: +234 803 723 5979</a></div></section>}
function Footer(){return <footer><div className="footer-top"><div className="footer-brand"><img className="footer-shield" src="/brand/forged-shield-white.png" alt="" loading="lazy"/><img className="footer-wordmark" src="/brand/forged-wordmark-white.png" alt="FORGED Activewear" loading="lazy"/><p>BUILT FOR THE GRIND.</p></div><div><b>SHOP</b><button onClick={()=>navigate('/shop?category=Men')}>Men</button><button onClick={()=>navigate('/shop?category=Women')}>Women</button><button onClick={()=>navigate('/shop?category=Accessories')}>Accessories</button><button onClick={()=>navigate('/shop?category=Equipment')}>Equipment</button></div><div><b>HELP</b><button onClick={()=>navigate('/track')}>Saved details</button><button onClick={()=>navigate('/shipping')}>Shipping & delivery</button><button onClick={()=>navigate('/returns')}>Returns & exchanges</button><button onClick={()=>navigate('/faq')}>FAQ</button><button onClick={()=>navigate('/contact')}>Contact</button></div><div><b>FORGED</b><button onClick={()=>navigate('/about')}>About</button><button onClick={()=>navigate('/privacy')}>Privacy</button><button onClick={()=>navigate('/terms')}>Terms</button></div></div><div className="footer-bottom"><span>© 2026 FORGED ACTIVEWEAR COLLECTIONS</span><span>OSOGBO, OSUN STATE, NIGERIA</span></div></footer>}

export default App;
