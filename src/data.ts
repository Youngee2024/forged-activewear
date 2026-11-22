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
const detail = image('/images/fabric-detail-v2.png', 'Close-up visual of dark fabric construction and stitching.', 'Detail');

const productSources: ProductSource[] = [
  {
    id:'m-core-compression', name:'Core Compression Tee', price:18500, category:'Men', productType:'apparel', sku:'FG-MCT-001',
    description:'A close-fitting short-sleeve silhouette with a clean, pared-back training look.',
    imageDetails:[image('/images/catalogue-men-front-v2.png','Front visual of a black compression-style training tee.','Front'),image('/images/catalogue-men-back-v2.png','Back visual of a black compression-style training tee.','Back'),detail],
    variants:variants('m-core-compression',['S','M','L','XL'],['Black','Graphite']), inventoryStatus:'unconfirmed', featured:true, isNew:true, material:pendingMaterial, fit:pendingFit, sizeGuide:'men', visualStatus:'temporary',
  },
  {
    id:'m-relentless-shorts', name:'Relentless Training Shorts', price:16000, category:'Men', productType:'apparel', sku:'FG-MSH-002',
    description:'A minimal mid-thigh short silhouette for a focused training wardrobe.',
    imageDetails:[image('/images/product-relentless-shorts.png','Front three-quarter visual of black training shorts.','Front'),detail],
    variants:variants('m-relentless-shorts',['S','M','L','XL'],['Black','Steel']), inventoryStatus:'unconfirmed', featured:true, isNew:false, material:pendingMaterial, fit:pendingFit, sizeGuide:'men', visualStatus:'temporary',
  },
  {
    id:'m-forge-joggers', name:'Forge Tapered Joggers', price:24500, category:'Men', productType:'apparel', sku:'FG-MJG-003',
    description:'A tapered jogger silhouette in a restrained, dark palette.',
    imageDetails:[image('/images/product-forge-joggers.png','Front visual of dark tapered training joggers.','Front'),detail],
    variants:variants('m-forge-joggers',['M','L','XL'],['Black']), inventoryStatus:'unconfirmed', featured:false, isNew:true, material:pendingMaterial, fit:pendingFit, sizeGuide:'men', visualStatus:'temporary',
  },
  {
    id:'w-sculpt-leggings', name:'Sculpt Seamless Leggings', price:22500, category:'Women', productType:'apparel', sku:'FG-WLG-004',
    description:'A full-length legging silhouette with a high-rise look and minimal detailing.',
    imageDetails:[image('/images/product-sculpt-leggings.png','Front three-quarter visual of black training leggings.','Front'),detail],
    variants:variants('w-sculpt-leggings',['XS','S','M','L'],['Black','Graphite']), inventoryStatus:'unconfirmed', featured:true, isNew:true, material:pendingMaterial, fit:pendingFit, sizeGuide:'women', visualStatus:'temporary',
  },
  {
    id:'w-impact-bra', name:'Impact Support Bra', price:15500, category:'Women', productType:'apparel', sku:'FG-WBR-005',
    description:'A racerback training-bra silhouette with a simple, streamlined finish.',
    imageDetails:[image('/images/product-impact-bra.png','Front three-quarter visual of a black racerback training bra.','Front'),detail],
    variants:variants('w-impact-bra',['XS','S','M','L'],['Black','Steel']), inventoryStatus:'unconfirmed', featured:true, isNew:false, material:pendingMaterial, fit:pendingFit, sizeGuide:'women', visualStatus:'temporary',
  },
  {
    id:'w-power-set', name:'PowerForm Training Set', price:36500, category:'Women', productType:'apparel', sku:'FG-WST-006',
    description:'A coordinated bra-and-legging look built around a clean monochrome palette.',
    imageDetails:[image('/images/catalogue-women-front-v2.png','Front visual of a black coordinated training set.','Front'),detail],
    variants:variants('w-power-set',['S','M','L'],['Black']), inventoryStatus:'unconfirmed', featured:true, isNew:true, material:pendingMaterial, fit:pendingFit, sizeGuide:'women', visualStatus:'temporary',
  },
  {
    id:'a-utility-duffle', name:'Utility Gym Duffle', price:28500, category:'Accessories', productType:'accessory', sku:'FG-AGB-007',
    description:'A structured gym-duffle silhouette with an understated finish.',
    imageDetails:[image('/images/product-utility-duffle.png','Three-quarter visual of a black gym duffle.')], variants:variants('a-utility-duffle',['One size'],['Black']), inventoryStatus:'unconfirmed', featured:true, isNew:false, material:pendingMaterial, fit:'Product dimensions have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
  },
  {
    id:'a-steel-bottle', name:'Forged Steel Bottle', price:9500, category:'Accessories', productType:'accessory', sku:'FG-AWB-008',
    description:'A dark training-bottle concept that pairs with the rest of your kit.',
    imageDetails:[image('/images/product-steel-bottle.png','Visual of a matte-black training bottle.')], variants:variants('a-steel-bottle',['One size'],['Black','Steel']), inventoryStatus:'unconfirmed', featured:false, isNew:true, material:pendingMaterial, fit:'Product capacity and dimensions have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
  },
  {
    id:'a-lift-straps', name:'Heavy Lift Straps', price:6500, category:'Accessories', productType:'accessory', sku:'FG-ALS-009',
    description:'A pair of lifting straps with a low-key black finish.',
    imageDetails:[image('/images/product-lift-straps.png','Visual of one pair of black lifting straps.')], variants:variants('a-lift-straps',['One size'],['Black']), inventoryStatus:'unconfirmed', featured:false, isNew:false, material:pendingMaterial, fit:'Strap dimensions have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
  },
  {
    id:'e-kettlebell', name:'Cast Kettlebell — 12KG', price:32000, category:'Equipment', productType:'equipment', sku:'FG-EKB-010',
    description:'A cast-style kettlebell concept in a dark, compact form.',
    imageDetails:[image('/images/product-kettlebell.png','Visual of a black cast-style kettlebell.')], variants:variants('e-kettlebell',['12KG'],['Black']), inventoryStatus:'unconfirmed', featured:true, isNew:false, material:pendingMaterial, fit:'Handle and bell dimensions have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
  },
  {
    id:'e-resistance-kit', name:'Resistance Band Kit', price:14500, category:'Equipment', productType:'equipment', sku:'FG-ERB-011',
    description:'A resistance-training kit concept shown with handles and accessories.',
    imageDetails:[image('/images/product-resistance-kit.png','Flat-lay visual of a resistance kit and accessories.')], variants:variants('e-resistance-kit',['Kit'],['Black']), inventoryStatus:'unconfirmed', featured:false, isNew:true, material:pendingMaterial, fit:'Resistance levels and component dimensions have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
  },
  {
    id:'e-training-mat', name:'Performance Training Mat', price:19000, category:'Equipment', productType:'equipment', sku:'FG-EMT-012',
    description:'A dark training-mat concept with a pared-back look.',
    imageDetails:[image('/images/product-training-mat.png','Visual of a partially rolled black training mat.')], variants:variants('e-training-mat',['Standard'],['Black']), inventoryStatus:'unconfirmed', featured:true, isNew:true, material:pendingMaterial, fit:'Mat dimensions and thickness have not yet been supplied.', sizeGuide:null, visualStatus:'temporary',
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
  promotion:{enabled:false,message:''},
  delivery:{summary:'Service areas and rates will be published before purchases open.'},
  returns:{summary:'The returns policy will be published before purchases open.'},
  bank:{verified:false,name:'',accountName:'',accountNumber:''},
};
