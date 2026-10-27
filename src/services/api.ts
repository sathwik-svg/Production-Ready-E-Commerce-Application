import {
  Category,
  Product,
  CartItem,
  WishlistItem,
  Order,
  ShippingAddress,
  DbInspectSummary,
  AmazonProductItem,
  AmazonSearchResponse,
  PriceComparison,
} from '../types/ecommerce';

const DEMO_USER_ID = 'demo-user-101';

const headers = {
  'Content-Type': 'application/json',
  'x-user-id': DEMO_USER_ID,
};

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating';
  inStock?: boolean;
}

export interface CartResponse {
  success: boolean;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  freeShippingThreshold: number;
  freeShippingProgress: number;
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters?.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);
  if (filters?.inStock) params.set('inStock', 'true');

  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  return data.products;
}

export async function getProduct(id: string): Promise<{ product: Product; related: Product[] }> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  const data = await res.json();
  return { product: data.product, related: data.related };
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('Failed to fetch categories');
  const data = await res.json();
  return data.categories;
}

export async function getCart(): Promise<CartResponse> {
  const res = await fetch('/api/cart', { headers });
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

export async function addToCart(productId: string, quantity = 1): Promise<CartResponse> {
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add item to cart');
  }
  return getCart();
}

export async function updateCartQuantity(productId: string, quantity: number): Promise<CartResponse> {
  const res = await fetch(`/api/cart/${productId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart quantity');
  return getCart();
}

export async function removeFromCart(productId: string): Promise<CartResponse> {
  const res = await fetch(`/api/cart/${productId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to remove item from cart');
  return getCart();
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const res = await fetch('/api/wishlist', { headers });
  if (!res.ok) throw new Error('Failed to fetch wishlist');
  const data = await res.json();
  return data.items;
}

export async function toggleWishlist(productId: string): Promise<{ action: 'added' | 'removed'; items: WishlistItem[] }> {
  const res = await fetch('/api/wishlist', {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) throw new Error('Failed to update wishlist');
  return res.json();
}

export async function checkout(payload: {
  shippingAddress: ShippingAddress;
  paymentMethod: { type: 'credit_card' | 'cod' | 'apple_pay' | 'amazon_pay'; lastFour?: string };
  promoCode?: string;
}): Promise<Order> {
  const res = await fetch('/api/orders/checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Checkout failed');
  }
  const data = await res.json();
  return data.order;
}

export async function getOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders', { headers });
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return data.orders;
}

export async function getDbInspect(): Promise<DbInspectSummary> {
  const res = await fetch('/api/db-inspect');
  if (!res.ok) throw new Error('Failed to inspect database');
  const data = await res.json();
  return data.inspector;
}

export async function resetDatabase(): Promise<DbInspectSummary> {
  const res = await fetch('/api/db-reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset database');
  const data = await res.json();
  return data.inspector;
}

// ----------------------------------------------------
// Amazon PA-API & Price Match Services
// ----------------------------------------------------
export async function searchAmazon(keywords = '', category = 'all'): Promise<AmazonSearchResponse> {
  const params = new URLSearchParams();
  if (keywords) params.set('keywords', keywords);
  if (category) params.set('category', category);

  const res = await fetch(`/api/amazon/search?${params.toString()}`);
  if (!res.ok) throw new Error('Amazon search failed');
  return res.json();
}

export async function getAmazonItem(asin: string): Promise<AmazonProductItem> {
  const res = await fetch(`/api/amazon/item/${asin}`);
  if (!res.ok) throw new Error('Failed to fetch Amazon item');
  const data = await res.json();
  return data.item;
}

export async function getPriceMatch(productId: string): Promise<PriceComparison | null> {
  const res = await fetch(`/api/amazon/price-match/${productId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.comparison;
}

export async function importAmazonProduct(asin: string, category?: string): Promise<Product> {
  const res = await fetch('/api/amazon/import', {
    method: 'POST',
    headers,
    body: JSON.stringify({ asin, category }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to import Amazon product');
  }
  const data = await res.json();
  return data.product;
}

export async function buyWithPrime(asin: string, shippingAddress?: ShippingAddress): Promise<Order> {
  const res = await fetch('/api/amazon/buy-with-prime', {
    method: 'POST',
    headers,
    body: JSON.stringify({ asin, shippingAddress }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Buy with Prime failed');
  }
  const data = await res.json();
  return data.order;
}

