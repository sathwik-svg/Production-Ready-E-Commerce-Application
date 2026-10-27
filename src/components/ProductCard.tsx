import React, { useState } from 'react';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../types/ecommerce';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (productId: string, e: React.MouseEvent) => void;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
  isWishlisted: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
}) => {
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setJustAdded(true);
    onAddToCart(product.id, e);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(product.id, e);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Product Image Stage (65-75% height ratio) */}
      <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-850 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Top Badges / Tags */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          {product.badge && (
            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-900 dark:text-zinc-100 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-2 py-0.5 rounded shadow-xs">
              {product.badge}
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Wishlist Action */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-150 z-10 cursor-pointer ${
            isWishlisted
              ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 shadow-xs'
              : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:text-rose-600 hover:scale-110'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
        </button>

        {/* Quick Add Overlay on Hover */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : product.stock === 0
                ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added to Bag</span>
              </>
            ) : product.stock === 0 ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Card Body & Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Unboxed Metadata Line with typographic separators */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="capitalize">{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>★ {product.rating.toFixed(1)}</span>
            <span aria-hidden="true">·</span>
            <span>({product.reviewCount})</span>
          </div>

          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing Row with Tabular Figures */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-zinc-400 line-through font-mono tabular-nums">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Mobile direct add button */}
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="sm:hidden p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-xs cursor-pointer"
            aria-label="Add to cart"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
