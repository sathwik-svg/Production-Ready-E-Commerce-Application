/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  getProducts,
  getCategories,
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  getWishlist,
  toggleWishlist,
  getOrders,
  getProduct,
  CartResponse,
} from './services/api';
import { Product, Category, WishlistItem, Order, ProductCategory } from './types/ecommerce';
import { TopBar } from './components/TopBar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { DynamoDbInspector } from './components/DynamoDbInspector';
import { AmazonExplorerModal } from './components/AmazonExplorerModal';
import { SlidersHorizontal, ArrowUpDown, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);

  // User Commerce State
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isAmazonOpen, setIsAmazonOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [checkoutPromo, setCheckoutPromo] = useState<string | undefined>();
  const [currentView, setCurrentView] = useState<'catalog' | 'orders'>('catalog');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Initial Data Fetch
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, cats, cartData, wishData, orderData] = await Promise.all([
        getProducts(),
        getCategories(),
        getCart().catch(() => null),
        getWishlist().catch(() => []),
        getOrders().catch(() => []),
      ]);

      setProducts(prods);
      setCategories(cats);
      if (cartData) setCart(cartData);
      setWishlist(wishData);
      setOrders(orderData);
    } catch (err: any) {
      console.error('Failed to load initial store data:', err);
      setError(err.message || 'Failed to connect to the backend server. Please verify Express API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (activeCategory !== 'all' && p.category !== activeCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesTag = p.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTag) return false;
      }
      // Stock filter
      if (inStockOnly && p.stock <= 0) {
        return false;
      }
      // Price range
      if (p.price < priceRange[0] || p.price > priceRange[1]) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, activeCategory, searchQuery, inStockOnly, priceRange, sortBy]);

  // Wishlist set for fast lookup
  const wishlistedIds = useMemo(() => {
    return new Set(wishlist.map((w) => w.productId));
  }, [wishlist]);

  // Handlers
  const handleProductSelect = async (product: Product) => {
    setSelectedProduct(product);
    try {
      const { related } = await getProduct(product.id);
      setRelatedProducts(related);
    } catch {
      setRelatedProducts([]);
    }
  };

  const handleAddToCart = async (productId: string, quantity = 1) => {
    try {
      const updatedCart = await addToCart(productId, quantity);
      setCart(updatedCart);
      showToast('Item added to your shopping bag');
    } catch (err: any) {
      showToast(err.message || 'Failed to update bag');
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    try {
      const res = await toggleWishlist(productId);
      setWishlist(res.items);
      showToast(res.action === 'added' ? 'Added to your wishlist' : 'Removed from your wishlist');
    } catch (err: any) {
      showToast(err.message || 'Failed to update wishlist');
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      const updatedCart = await updateCartQuantity(productId, quantity);
      setCart(updatedCart);
    } catch (err: any) {
      showToast(err.message || 'Failed to update item quantity');
    }
  };

  const handleRemoveFromCart = async (productId: string) => {
    try {
      const updatedCart = await removeFromCart(productId);
      setCart(updatedCart);
      showToast('Item removed from bag');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove item');
    }
  };

  const handleMoveToCart = async (productId: string) => {
    await handleAddToCart(productId, 1);
    await handleToggleWishlist(productId);
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  const handleProceedToCheckout = (promo?: string) => {
    setCheckoutPromo(promo);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    setIsCheckoutOpen(false);
    setActiveOrder(order);
    setOrders((prev) => [order, ...prev]);
    // Refresh cart (which is now empty)
    getCart().then(setCart).catch(() => null);
    setCurrentView('orders');
    showToast('Order confirmed and recorded in DynamoDB!');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 3-Zone Navigation TopBar */}
      <TopBar
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setCurrentView('catalog');
        }}
        cartCount={cart?.itemCount || 0}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenOrders={() => setCurrentView('orders')}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenAmazon={() => setIsAmazonOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Body */}
      <main className="flex-1">
        {currentView === 'orders' ? (
          <OrderTrackingView
            orders={orders}
            activeOrder={activeOrder}
            onBackToStore={() => setCurrentView('catalog')}
          />
        ) : (
          <>
            {/* Storefront Hero with verified 16:9 visual showcase */}
            <Hero
              onExploreCategory={(cat) => {
                setActiveCategory(cat);
                const catalogEl = document.getElementById('catalog-grid');
                if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Catalog & Filter Section */}
            <div id="catalog-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
              {/* Filter and Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                {/* Category tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-x-auto">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeCategory === 'all'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    All Items ({products.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.slug)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        activeCategory === cat.slug
                          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      {cat.name} ({cat.itemCount})
                    </button>
                  ))}
                </div>

                {/* Right controls: In-stock toggle & Sort dropdown */}
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>In-Stock Only</span>
                  </label>

                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs py-1.5 px-3 rounded-lg focus:outline-none cursor-pointer pr-8 font-medium appearance-none"
                    >
                      <option value="featured">Featured First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="rating">Top Rated</option>
                    </select>
                    <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Active Search and Results Notice */}
              {searchQuery && (
                <div className="py-3 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    Showing search results for &ldquo;<strong className="text-zinc-900 dark:text-white">{searchQuery}</strong>&rdquo;
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-blue-600 hover:underline cursor-pointer"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="my-8 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={loadInitialData}
                    className="px-3 py-1 bg-rose-600 text-white font-semibold rounded-md hover:bg-rose-700 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Loading Skeleton */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-xl aspect-4/5 border border-zinc-200 dark:border-zinc-800"
                    />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                /* Empty Catalog State */
                <div className="py-20 text-center">
                  <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-400 mb-3">
                    <SlidersHorizontal className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No products match your criteria</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Try clearing search queries, expanding your price bounds, or enabling out-of-stock items.
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory('all');
                      setSearchQuery('');
                      setInStockOnly(false);
                      setSortBy('featured');
                    }}
                    className="mt-5 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                /* 3-4 Column Product Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={handleProductSelect}
                      onAddToCart={(id) => handleAddToCart(id, 1)}
                      onToggleWishlist={handleToggleWishlist}
                      isWishlisted={wishlistedIds.has(product.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer conforming to anti-slop rules */}
      <footer className="bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 py-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-3">
            <div className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              APEX<span className="text-blue-600 font-medium ml-1">MEGASTORE</span>
            </div>
            <p className="text-zinc-500 max-w-sm leading-relaxed">
              Production-style full-stack e-commerce architecture engineered with AWS DynamoDB DocumentClient, Express API routing, and high-fidelity UI.
            </p>
            <div className="text-[11px] text-zinc-400 font-mono">
              Architecture: Next.js/React · Node.js/Express · AWS DynamoDB Single-Table Design
            </div>
          </div>

          <div className="md:col-span-3 space-y-2">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
              Catalog Collections
            </div>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => {
                    setActiveCategory('tech');
                    setCurrentView('catalog');
                  }}
                  className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Tech & Audio
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveCategory('apparel');
                    setCurrentView('catalog');
                  }}
                  className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Apparel & Carry
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveCategory('home');
                    setCurrentView('catalog');
                  }}
                  className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Home & Living
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('orders')}
                  className="hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Order Tracking
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
              Internship Evaluation Links
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Open the live DynamoDB Inspector to examine partition keys (PK/SK), query metrics, and sample document payloads in real-time.
            </p>
            <button
              onClick={() => setIsInspectorOpen(true)}
              className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Open DynamoDB Inspector
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>&copy; {new Date().getFullYear()} Apex Megastore. All rights reserved.</div>
          <div className="flex gap-4">
            <span className="text-zinc-400">Software Engineer Intern Task Submission</span>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal (PDP) */}
      <ProductDetailModal
        product={selectedProduct}
        relatedProducts={relatedProducts}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={selectedProduct ? wishlistedIds.has(selectedProduct.id) : false}
        onSelectRelated={handleProductSelect}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlist}
        onRemove={handleToggleWishlist}
        onMoveToCart={handleMoveToCart}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        appliedPromo={checkoutPromo}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* DynamoDB Live Inspector Drawer */}
      <DynamoDbInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {/* Amazon Product Advertising API (PA-API) Explorer Modal */}
      <AmazonExplorerModal
        isOpen={isAmazonOpen}
        onClose={() => setIsAmazonOpen(false)}
        onProductImported={(newProduct) => {
          setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
          showToast(`ASIN ${newProduct.asin} imported into DynamoDB!`);
        }}
        onPrimeOrderSuccess={(primeOrder) => {
          setActiveOrder(primeOrder);
          setOrders((prev) => [primeOrder, ...prev]);
          setCurrentView('orders');
          showToast('Buy with Prime order confirmed via Amazon Logistics!');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
