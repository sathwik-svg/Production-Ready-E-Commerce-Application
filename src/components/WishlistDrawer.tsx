import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { WishlistItem } from '../types/ecommerce';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: WishlistItem[];
  onRemove: (productId: string) => void;
  onMoveToCart: (productId: string) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemove,
  onMoveToCart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/60 backdrop-blur-xs flex justify-end">
      <div
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Wishlist</h2>
            <span className="text-xs font-mono text-zinc-400">({items.length} items)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close wishlist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Your wishlist is empty</h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-xs">
                Save pieces you love to track availability or buy later.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="py-4 flex gap-4">
                <img
                  src={item.image}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 object-cover rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-800"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {item.title}
                      </h4>
                      <button
                        onClick={() => onRemove(item.productId)}
                        className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">
                      {item.category}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                      ${item.unitPrice.toFixed(2)}
                    </span>

                    <button
                      onClick={() => onMoveToCart(item.productId)}
                      className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Move to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
