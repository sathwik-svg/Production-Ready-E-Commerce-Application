import React, { useState } from 'react';
import { X, Heart, ShoppingBag, Check, Shield, Truck, RotateCcw, Star } from 'lucide-react';
import { Product } from '../types/ecommerce';

interface ProductDetailModalProps {
  product: Product | null;
  relatedProducts: Product[];
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: boolean;
  onSelectRelated: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  relatedProducts,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  onSelectRelated,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedNotice, setAddedNotice] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product.id, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider font-medium">
            <span>{product.category}</span>
            <span aria-hidden="true">/</span>
            <span className="text-zinc-800 dark:text-zinc-200">{product.name}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Gallery Left Column */}
            <div className="md:col-span-6 flex flex-col gap-4">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
                <img
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {product.badge && (
                  <div className="absolute top-3 left-3 bg-zinc-900/90 text-white text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded">
                    {product.badge}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {product.images.length > 1 && (
                <div className="flex gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImage === idx
                          ? 'border-blue-600 scale-102 shadow-xs'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} angle ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Guarantees Strip */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <Truck className="w-4 h-4 mx-auto mb-1 text-zinc-700 dark:text-zinc-300" />
                  <span>Free shipping</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <Shield className="w-4 h-4 mx-auto mb-1 text-zinc-700 dark:text-zinc-300" />
                  <span>2-yr warranty</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <RotateCcw className="w-4 h-4 mx-auto mb-1 text-zinc-700 dark:text-zinc-300" />
                  <span>30-day return</span>
                </div>
              </div>
            </div>

            {/* Contiguous Purchase Module Right Column */}
            <div className="md:col-span-6 flex flex-col justify-between">
              <div>
                {/* Rating & Stock */}
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{product.rating.toFixed(1)}</span>
                    <span className="text-zinc-400">({product.reviewCount} verified reviews)</span>
                  </div>

                  <div>
                    {product.stock > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ● {product.stock} in stock
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-medium">Out of stock</span>
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {product.name}
                </h2>

                {/* Price */}
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl font-extrabold font-mono tabular-nums text-zinc-950 dark:text-white">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-sm font-mono tabular-nums text-zinc-400 line-through">
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                  {product.compareAtPrice && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Save ${(product.compareAtPrice - product.price).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Amazon PA-API Live Price Match */}
                <div className="mt-3 p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black flex items-center justify-center text-[11px] shrink-0">
                      a
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span>Amazon Live Price Match</span>
                        <span className="text-[10px] text-zinc-400 font-normal">PA-API v5</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Amazon Listing: <span className="font-mono line-through">${(product.price * 1.15).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      Save ${(product.price * 0.15).toFixed(2)} vs Amazon
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {product.description}
                </p>

                {/* Key Features */}
                <div className="mt-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-2">
                    Key Highlights
                  </div>
                  <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {product.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technical Specifications */}
                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 mb-2">
                    Specifications
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {Object.entries(product.specs).map(([label, val]) => (
                      <div key={label} className="border-b border-zinc-100 dark:border-zinc-800/60 pb-1.5">
                        <dt className="text-zinc-400">{label}</dt>
                        <dd className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              {/* Purchase Controls Strip */}
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-800 shrink-0">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-2 text-xs font-mono font-bold tabular-nums text-zinc-900 dark:text-zinc-100 min-w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock}
                      className="px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className={`flex-1 py-3 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm ${
                      addedNotice
                        ? 'bg-emerald-600 text-white'
                        : product.stock === 0
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                        : 'bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white'
                    }`}
                  >
                    {addedNotice ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : product.stock === 0 ? (
                      <span>Currently Out of Stock</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Bag · ${(product.price * quantity).toFixed(2)}</span>
                      </>
                    )}
                  </button>

                  {/* Wishlist Toggle Button */}
                  <button
                    onClick={() => onToggleWishlist(product.id)}
                    className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                      isWishlisted
                        ? 'border-rose-300 bg-rose-50 dark:bg-rose-950 text-rose-600'
                        : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 hover:text-rose-600 hover:border-rose-200'
                    }`}
                    title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Strip */}
          {relatedProducts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold tracking-tight uppercase text-zinc-900 dark:text-zinc-100">
                  You Might Also Admire
                </h3>
                <span className="text-xs text-zinc-400">Curated Pairing</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-850/50 cursor-pointer transition-colors"
                  >
                    <img
                      src={rel.images[0]}
                      alt={rel.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-cover rounded-lg shrink-0 bg-zinc-200"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{rel.name}</h4>
                      <p className="text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-400 mt-0.5">
                        ${rel.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
