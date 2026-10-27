export type ProductCategory = 'tech' | 'apparel' | 'home';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  images: string[];
  description: string;
  features: string[];
  specs: Record<string, string>;
  badge?: string;
  tags: string[];
  featured?: boolean;
  asin?: string;
  amazonComparePrice?: number;
}

export interface Category {
  id: ProductCategory;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image: string;
  itemCount: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  title: string;
  image: string;
  category: ProductCategory;
}

export interface WishlistItem {
  productId: string;
  title: string;
  unitPrice: number;
  image: string;
  category: ProductCategory;
  addedAt: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  promoCode?: string;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  paymentMethod: {
    type: 'credit_card' | 'cod' | 'apple_pay' | 'amazon_pay';
    lastFour?: string;
  };
  trackingNumber: string;
  carrier: string;
  createdAt: string;
  estimatedDelivery: string;
}

export interface DynamoDBRecord {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  entityType: 'PRODUCT' | 'CATEGORY' | 'CART_ITEM' | 'WISHLIST_ITEM' | 'ORDER' | 'USER_PROFILE';
  data: any;
  createdAt: string;
  updatedAt: string;
}

export interface DbInspectSummary {
  activeMode: 'live_aws' | 'document_client_embedded';
  tableName: string;
  region: string;
  totalItems: number;
  entityCounts: Record<string, number>;
  recentRecords: DynamoDBRecord[];
}

export interface AmazonProductItem {
  asin: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  listPrice?: number;
  savingsAmount?: number;
  primeEligible: boolean;
  rating: number;
  totalReviews: number;
  detailPageURL: string;
  imageUrl: string;
  category: ProductCategory;
  features: string[];
  importedToCatalog?: boolean;
}

export interface AmazonSearchResponse {
  success: boolean;
  searchIndex: string;
  totalResults: number;
  items: AmazonProductItem[];
  source: 'live_paapi' | 'sandbox_paapi';
}

export interface PriceComparison {
  productId: string;
  productName: string;
  asin: string;
  apexPrice: number;
  amazonPrice: number;
  difference: number;
  isApexCheaper: boolean;
  primeEligible: boolean;
}
