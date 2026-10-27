import React from 'react';
import { ShoppingBag, Heart, Search, Database, Package } from 'lucide-react';
import { ProductCategory } from '../types/ecommerce';

interface TopBarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenOrders: () => void;
  onOpenInspector: () => void;
  onOpenAmazon: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeCategory,
  onSelectCategory,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  onOpenInspector,
  onOpenAmazon,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark in display face */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectCategory('all')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                APEX<span className="text-blue-600 font-medium ml-1">MEGASTORE</span>
              </span>
            </button>
          </div>

          {/* Zone 2: 4-5 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <button
              onClick={() => onSelectCategory('all')}
              className={`transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === 'all'
                  ? 'text-zinc-900 dark:text-white font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                  : 'hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All Catalog
            </button>
            <button
              onClick={() => onSelectCategory('tech')}
              className={`transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === 'tech'
                  ? 'text-zinc-900 dark:text-white font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                  : 'hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Tech & Audio
            </button>
            <button
              onClick={() => onSelectCategory('apparel')}
              className={`transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === 'apparel'
                  ? 'text-zinc-900 dark:text-white font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                  : 'hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Apparel & Carry
            </button>
            <button
              onClick={() => onSelectCategory('home')}
              className={`transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === 'home'
                  ? 'text-zinc-900 dark:text-white font-semibold underline underline-offset-8 decoration-2 decoration-blue-600'
                  : 'hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Home & Living
            </button>
            <button
              onClick={onOpenOrders}
              className="transition-colors hover:text-zinc-900 dark:hover:text-white whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <Package className="w-4 h-4 text-zinc-400" />
              <span>Track Orders</span>
            </button>
          </nav>

          {/* Zone 3: Actions - Search, Wishlist, Cart & DynamoDB Inspector */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative hidden sm:block w-48 lg:w-64">
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Wishlist Trigger */}
            <button
              onClick={onOpenWishlist}
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors relative cursor-pointer"
              title="View Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-white transition-colors cursor-pointer text-xs font-semibold"
              title="View Cart"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Bag</span>
              <span className="bg-white/20 dark:bg-zinc-900/20 px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums">
                {cartCount}
              </span>
            </button>

            {/* Amazon PA-API Trigger */}
            <button
              onClick={onOpenAmazon}
              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-500/30 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
              title="Amazon Product Advertising API Explorer"
              aria-label="Amazon API"
            >
              <span className="font-black text-xs leading-none">a</span>
              <span className="hidden sm:inline text-[11px]">Amazon API</span>
            </button>

            {/* Developer DynamoDB Inspector Trigger */}
            <button
              onClick={onOpenInspector}
              className="p-2 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800"
              title="AWS DynamoDB Single-Table Inspector"
              aria-label="DynamoDB Inspector"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="sm:hidden pb-3 pt-1">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search catalog across all categories..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 pl-8 pr-3 py-2 rounded-lg focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </header>
  );
};
