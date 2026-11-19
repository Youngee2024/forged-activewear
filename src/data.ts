export type Category = 'Men' | 'Women' | 'Accessories' | 'Equipment';
export type SizeGuideGroup = 'men' | 'women' | null;
export type InventoryStatus = 'unconfirmed' | 'available' | 'unavailable';

export type ProductImage = { src: string; alt: string; label: 'Front' | 'Back' | 'Detail' | 'Product' };
export type ProductVariant = { id: string; size: string; colour: string; available: boolean; availabilitySource: 'sample' | 'confirmed' };

export type Product = {
  id: string; name: string; description: string; price: number; category: Category;
  productType: 'apparel' | 'accessory' | 'equipment'; images: string[]; imageDetails: ProductImage[];
  variants: ProductVariant[]; sku: string; inventoryStatus: InventoryStatus;
  featured: boolean; isNew: boolean; material: string; fit: string;
  sizeGuide: SizeGuideGroup; visualStatus: 'temporary'; sizes: string[]; colours: string[];
};

type ProductSource = Omit<Product, 'images' | 'sizes' | 'colours'>;

const image = (src: string, alt: string, label: ProductImage['label'] = 'Product'): ProductImage => ({ src, alt, label });
const variants = (productId: string, sizes: string[], colours: string[]): ProductVariant[] => sizes.flatMap(size => colours.map(colour => ({ id: `${productId}-${size}-${colour}`.toLowerCase().replace(/\s+/g, '-'), size, colour, available: true, availabilitySource: 'sample' as const })));
const pendingMaterial = 'Material composition has not yet been supplied by FORGED.';
const pendingFit = 'Fit specification and model measurements have not yet been supplied.';
const visual = 'Temporary generated catalogue visual; not a verified photograph of current inventory.';
const detail = image('/images/fabric-detail-v2.png', `${visual} Generic black technical-fabric construction detail.`, 'Detail');

const productSources: ProductSource[] = [
  {
    id:'m-core-compression', name:'Core Compression Tee', price:18500, category:'Men', productType:'apparel', sku:'FG-MCT-001',
    description:'Temporary catalogue entry for a short-sleeve compression-style training top. Final performance specifications are pending business confirmation.',
    imageDetails:[image('/images/catalogue-men-front-v2.png',`${visual} Front view of a black compression-style training tee.`,'Front'),image('/images/catalogue-men-back-v2.png',`${visual} Back view of a black compression-style training tee.`,'Back'),detail],
    variants:variants('m-core-compression',['S','M','L','XL'],['Black','Graphite']), inventoryStatus:'unconfirmed', featured:true, isNew:true, material:pendingMaterial, fit:pendingFit, sizeGuide:'men', visualStatus:'temporary',
  },
  {
    id:'m-relentless-shorts', name:'Relentless Training Shorts', price:16000, category:'Men', productType:'apparel', sku:'FG-MSH-002',
    description:'Temporary catalogue entry for mid-thigh men’s training shorts. Final construction and pocket specifications are pending confirmation.',
    imageDetails:[image('/images/product-relentless-shorts.png',`${visual} Front three-quarter view of black men’s training shorts.`,'Front'),detail],
    variants:variants('m-relentless-shorts',['S','M','L','XL'],['Black','Steel']), inventoryStatus:'unconfirmed', featured:true, isNew:false, material:pendingMaterial, fit:pendingFit, sizeGuide:'men', visualStatus:'temporary',
  },
  {
    id:'m-forge-joggers', name:'Forge Tapered Joggers', price:24500, category:'Men', productType:'apparel', sku:'FG-MJG-003',
    description:'Temporary catalogue entry for tapered men’s training joggers. Final fabric, cuff and pocket specifications are pending confirmation.',
    imageDetails:[image('/images/product-forge-joggers.png',`${visual} Front view of graphite-black tapered training joggers.`,'Front'),detail],
    variants:variants('m-forge-joggers',['M','L','XL'],['Black']), inventoryStatus:'unconfirmed', featured:false, isNew:true, material:pendingMaterial, fit:pendingFit, sizeGuide:'men', visualStatus:'temporary',
  },
  {
    id:'w-sculpt-leggings', name:'Sculpt Seamless Leggings', price:22500, category:'Women', productType:'apparel', sku:'FG-WLG-004',
    description:'Temporary catalogue entry for high-rise full-length training leggings. Final fabric and construction specifications are pending confirmation.',
    imageDetails:[image('/images/product-sculpt-leggings.png',`${visual} Front three-quarter view of black high-rise training leggings.`,'Front'),detail],
    variants:variants('w-sculpt-leggings',['XS','S','M','L'],['Black','Graphite']), inventoryStatus:'unconfirmed', featured:true, isNew:true, material:pendingMaterial, fit:pendingFit, sizeGuide:'women', visualStatus:'temporary',
  },
  {
    id:'w-impact-bra', name:'Impact Support Bra', price:15500, category:'Women', productType:'apparel', sku:'FG-WBR-005',
    description:'Temporary catalogue entry for a racerback training sports bra. Final support level, fabric and construction specifications are pending confirmation.',
    imageDetails:[image('/images/product-impact-bra.png',`${visual} Front three-quarter view of a black racerback sports bra.`,'Front'),detail],
    variants:variants('w-impact-bra',['XS','S','M','L'],['Black','Steel']), inventoryStatus:'unconfirmed', featured:true, isNew:false, material:pendingMaterial, fit:pendingFit, sizeGuide:'women', visualStatus:'temporary',
  },
  {
    id:'w-power-set', name:'PowerForm Training Set', price:36500, category:'Women', productType:'apparel', sku:'FG-WST-006',
    description:'Temporary catalogue entry for a matching sports-bra and full-length-legging set. Final product specifications are pending confirmation.',
    imageDetails:[image('/images/catalogue-women-front-v2.png',`${visual} Front view of a black matching training set.`,'Front'),detail],
    variants:variants('w-power-set',['S','M','L'],['Black']), inventoryStatus:'unconfirmed', featured:true, isNew:true, material:pendingMaterial, fit:pendingFit, sizeGuide:'women', visualStatus:'temporary',
  },
  {
    id:'a-utility-duffle', name:'Utility Gym Duffle', price:28500, category:'Accessories', productType:'accessory', sku:'FG-AGB-007',
    description:'Temporary catalogue entry for a structured black gym duffle. Final capacity, dimensions and compartment specifications are pending confirmation.',
    imageDetails:[image('/images/product-utility-duffle.png',`${visual} Three-quarter product view of a black gym duffle.`)], variants:variants('a-utility-duffle',['One size'],['Black']), inventoryStatus:'unconfirmed', featured:true, isNew:false, material:pendingMaterial, fit:'Product dimensions have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
  },
  {
    id:'a-steel-bottle', name:'Forged Steel Bottle', price:9500, category:'Accessories', productType:'accessory', sku:'FG-AWB-008',
    description:'Temporary catalogue entry for a black steel training bottle. Final volume, insulation and care specifications are pending confirmation.',
    imageDetails:[image('/images/product-steel-bottle.png',`${visual} Product view of a matte-black steel bottle.`)], variants:variants('a-steel-bottle',['One size'],['Black','Steel']), inventoryStatus:'unconfirmed', featured:false, isNew:true, material:pendingMaterial, fit:'Product capacity and dimensions have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
  },
  {
    id:'a-lift-straps', name:'Heavy Lift Straps', price:6500, category:'Accessories', productType:'accessory', sku:'FG-ALS-009',
    description:'Temporary catalogue entry for a pair of padded lifting straps. Final length, material and care specifications are pending confirmation.',
    imageDetails:[image('/images/product-lift-straps.png',`${visual} Product view of one pair of black lifting straps.`)], variants:variants('a-lift-straps',['One size'],['Black']), inventoryStatus:'unconfirmed', featured:false, isNew:false, material:pendingMaterial, fit:'Strap dimensions have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
  },
  {
    id:'e-kettlebell', name:'Cast Kettlebell — 12KG', price:32000, category:'Equipment', productType:'equipment', sku:'FG-EKB-010',
    description:'Temporary catalogue entry for a 12 kg cast-style kettlebell. Final coating and handle dimensions are pending confirmation.',
    imageDetails:[image('/images/product-kettlebell.png',`${visual} Product view of one black cast-style kettlebell.`)], variants:variants('e-kettlebell',['12KG'],['Black']), inventoryStatus:'unconfirmed', featured:true, isNew:false, material:pendingMaterial, fit:'Handle and bell dimensions have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
  },
  {
    id:'e-resistance-kit', name:'Resistance Band Kit', price:14500, category:'Equipment', productType:'equipment', sku:'FG-ERB-011',
    description:'Temporary catalogue entry for a resistance-tube kit with handles and anchors. Final resistance levels and kit contents are pending confirmation.',
    imageDetails:[image('/images/product-resistance-kit.png',`${visual} Flat-lay product view of a resistance-tube kit and accessories.`)], variants:variants('e-resistance-kit',['Kit'],['Black']), inventoryStatus:'unconfirmed', featured:false, isNew:true, material:pendingMaterial, fit:'Resistance levels and component dimensions have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
  },
  {
    id:'e-training-mat', name:'Performance Training Mat', price:19000, category:'Equipment', productType:'equipment', sku:'FG-EMT-012',
    description:'Temporary catalogue entry for a thick black fitness mat. Final length, width, thickness and care specifications are pending confirmation.',
    imageDetails:[image('/images/product-training-mat.png',`${visual} Product view of one partially rolled black training mat.`)], variants:variants('e-training-mat',['Standard'],['Black']), inventoryStatus:'unconfirmed', featured:true, isNew:true, material:pendingMaterial, fit:'Mat dimensions and thickness have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
  },
];

export const products: Product[] = productSources.map(product => ({
  ...product,
  images: product.imageDetails.map(item => item.src),
  sizes: [...new Set(product.variants.map(variant => variant.size))],
  colours: [...new Set(product.variants.map(variant => variant.colour))],
}));

export const getProductSizes = (product: Product) => [...new Set(product.variants.map(variant => variant.size))];
export const getProductColours = (product: Product) => [...new Set(product.variants.map(variant => variant.colour))];
export const getProductVariant = (product: Product, size: string, colour: string) => product.variants.find(variant => variant.size === size && variant.colour === colour);
export const isProductAvailable = (product: Product) => product.variants.some(variant => variant.available);

export const sizeGuideConfig = {
  men:{title:"Men's size guide",measurementsProvided:false,units:null as null|'cm'|'in'},
  women:{title:"Women's size guide",measurementsProvided:false,units:null as null|'cm'|'in'},
};

export const formatNaira = (amount:number) => new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(amount);

export const storeConfig = {
  deliveryFee:3500,
  freeDeliveryAt:100000,
  announcement:{enabled:true,message:'FORGED ACTIVEWEAR — BUILT FOR THE GRIND'},
  promotion:{enabled:false,message:'FREE DELIVERY IN LAGOS ON ORDERS OVER ₦100,000'},
  delivery:{summary:'Delivery availability, fee and timing are confirmed with each order.'},
  returns:{summary:'Final shipping and returns terms are pending business approval.'},
  bank:{verified:false,name:'',accountName:'',accountNumber:''},
};
