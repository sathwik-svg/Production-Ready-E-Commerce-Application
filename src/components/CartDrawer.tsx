import React, { useState } from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, Tag, Check, AlertCircle } from 'lucide-react';
import { CartResponse } from '../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartResponse | null;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: (appliedPromo?: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validPromos: Record<string, number> = {
    SAVE10: 0.1,
    APEX20: 0.2,
    INTERN100: 0.25,
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    if (validPromos[code]) {
      setAppliedPromo(code);
      setPromoInput('');
    } else {
      setPromoError('Invalid code. Try SAVE10, APEX20, or INTERN100.');
    }
  };

  const subtotal = cart?.subtotal || 0;
  const discountRate = appliedPromo ? validPromos[appliedPromo] || 0 : 0;
  const discountAmount = Math.round(subtotal * discountRate * 100) / 100;
  const shippingFee = cart?.shippingFee || 0;
  const total = Math.max(0, subtotal + shippingFee - discountAmount);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/60 backdrop-blur-xs flex justify-end">
      <div
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Your Bag</h2>
            <span className="text-xs font-mono text-zinc-400">({cart?.itemCount || 0})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart && (
          <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-850/50 border-b border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300 font-medium mb-1.5">
              <span>
                {cart.subtotal >= cart.freeShippingThreshold ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Free Insured Delivery Unlocked
                  </span>
                ) : (
                  <span>
                    Add ${(cart.freeShippingThreshold - cart.subtotal).toFixed(2)} more for Free Delivery
                  </span>
                )}
              </span>
              <span className="font-mono">{Math.round(cart.freeShippingProgress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${cart.freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {!cart || cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Your bag is empty</h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-xs">
                Explore our curated catalog across Tech, Apparel, and Home Goods.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                Start Exploring
              </button>
            </div>
          ) : (
            cart.items.map((item) => (
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
                        onClick={() => onRemoveItem(item.productId)}
                        className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove item"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">
                      {item.category}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden bg-white dark:bg-zinc-800">
                      <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100 min-w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0 space-y-4">
            <form onSubmit={handleApplyPromo} className="space-y-1.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Promo code (SAVE10, APEX20)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs px-3 py-2 pl-8 rounded-lg uppercase font-mono tracking-wider focus:outline-none"
                  />
                  <Tag className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-lg hover:bg-zinc-300 cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {appliedPromo && (
                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Code '{appliedPromo}' applied ({validPromos[appliedPromo] * 100}% off)</span>
                  <button
                    type="button"
                    onClick={() => setAppliedPromo(null)}
                    className="text-zinc-400 hover:text-rose-600 cursor-pointer text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              )}

              {promoError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{promoError}</span>
                </div>
              )}
            </form>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-500">
                <span>Estimated Shipping</span>
                <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                  {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-sm font-bold text-zinc-950 dark:text-white">
                <span>Total</span>
                <span className="font-mono tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => onProceedToCheckout(appliedPromo || undefined)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
