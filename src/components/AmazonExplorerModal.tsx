import React, { useState, useEffect } from 'react';
import { X, Search, Check, DownloadCloud, Zap, ExternalLink, Star, ShieldCheck, Loader2 } from 'lucide-react';
import { AmazonProductItem } from '../types/ecommerce.js';
import { searchAmazon, importAmazonProduct, buyWithPrime } from '../services/api.js';
import { Order, Product } from '../types/ecommerce.js';

interface AmazonExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductImported: (product: Product) => void;
  onPrimeOrderSuccess: (order: Order) => void;
}

export const AmazonExplorerModal: React.FC<AmazonExplorerModalProps> = ({
  isOpen,
  onClose,
  onProductImported,
  onPrimeOrderSuccess,
}) => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState<AmazonProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingAsin, setImportingAsin] = useState<string | null>(null);
  const [orderingAsin, setOrderingAsin] = useState<string | null>(null);
  const [apiSource, setApiSource] = useState<string>('sandbox_paapi');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const performSearch = async (kw = keyword, cat = category) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await searchAmazon(kw, cat);
      setItems(res.items);
      setApiSource(res.source);
    } catch (err: any) {
      console.error('Amazon search failed:', err);
      setStatusMessage('Failed to query Amazon Product Advertising API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      performSearch();
    }
  }, [isOpen]);

  const handleImport = async (item: AmazonProductItem) => {
    setImportingAsin(item.asin);
    try {
      const newProduct = await importAmazonProduct(item.asin, item.category);
      // Mark item as imported
      setItems((prev) =>
        prev.map((i) => (i.asin === item.asin ? { ...i, importedToCatalog: true } : i))
      );
      onProductImported(newProduct);
      setStatusMessage(`ASIN ${item.asin} ("${item.brand}") imported into DynamoDB table!`);
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to import product.');
    } finally {
      setImportingAsin(null);
    }
  };

  const handleBuyWithPrime = async (item: AmazonProductItem) => {
    setOrderingAsin(item.asin);
    try {
      const order = await buyWithPrime(item.asin);
      onPrimeOrderSuccess(order);
      onClose();
    } catch (err: any) {
      setStatusMessage(err.message || 'Buy with Prime order failed.');
    } finally {
      setOrderingAsin(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-850/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-black text-sm">
              a
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Amazon Product Advertising API (PA-API v5)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold">
                  {apiSource === 'live_paapi' ? 'Live PA-API' : 'PA-API Sandbox'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Live marketplace ASIN search, price comparison & 1-click DynamoDB import
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performSearch(keyword, category);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search Amazon items by keyword or ASIN (e.g. Sony, B08H75RTZ8, Stanley)..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs pl-8 pr-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                performSearch(keyword, e.target.value);
              }}
              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs px-3 py-2 text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="all">All Departments</option>
              <option value="tech">Electronics & Audio</option>
              <option value="apparel">Clothing & Luggage</option>
              <option value="home">Home & Kitchen</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search PA-API</span>
            </button>
          </form>

          {statusMessage && (
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-zinc-100 dark:divide-zinc-800">
          {loading ? (
            <div className="py-16 text-center text-zinc-500 text-xs space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
              <p>Querying Amazon Product Advertising API endpoint...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">No Amazon items matched your search query</p>
              <p className="mt-1">Try searching for keywords like "Sony", "Kindle", "Tote", or "Hario".</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.asin} className="py-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-4 items-start">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-cover rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                        ASIN: {item.asin}
                      </span>
                      {item.primeEligible && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-blue-600" /> Prime
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400 uppercase tracking-wider">{item.brand}</span>
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 max-w-lg line-clamp-2">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{item.rating.toFixed(1)}</span>
                        <span className="text-zinc-400 font-normal">({item.totalReviews.toLocaleString()})</span>
                      </div>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.listPrice && (
                          <span className="text-zinc-400 line-through text-[11px] font-mono">
                            ${item.listPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions: Import to DynamoDB & Buy with Prime */}
                <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleImport(item)}
                    disabled={item.importedToCatalog || importingAsin === item.asin}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      item.importedToCatalog
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 cursor-default'
                        : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800'
                    }`}
                  >
                    {importingAsin === item.asin ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Writing to DB...</span>
                      </>
                    ) : item.importedToCatalog ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>In Catalog</span>
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="w-3 h-3" />
                        <span>Import to Store</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleBuyWithPrime(item)}
                    disabled={orderingAsin === item.asin}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {orderingAsin === item.asin ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 fill-white" />
                        <span>Buy with Prime</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-850/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>PA-API v5 Signature Version 4 protocol</span>
          </div>
          <span className="font-mono text-zinc-400">Endpoint: webservices.amazon.com/paapi5/searchitems</span>
        </div>
      </div>
    </div>
  );
};
