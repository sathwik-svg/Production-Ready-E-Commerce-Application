import React from 'react';
import { ArrowRight, ShieldCheck, Zap, RotateCcw } from 'lucide-react';
import { ProductCategory } from '../types/ecommerce';

interface HeroProps {
  onExploreCategory: (category: ProductCategory | 'all') => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreCategory }) => {
  return (
    <section className="relative overflow-hidden bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">
              <span>Engineered Living</span>
              <span aria-hidden="true">·</span>
              <span>Autumn/Winter Collection</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.15] text-balance">
              Precision design for everyday rituals.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Curated audio peripherals, heavy Japanese denim, and architectural stoneware. Built on AWS DynamoDB DocumentClient architecture with real-time stock sync.
            </p>

            {/* Category Quick Jump Segmented Buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => onExploreCategory('all')}
                className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold rounded-lg hover:bg-zinc-800 dark:hover:bg-white transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onExploreCategory('tech')}
                className="px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
              >
                Tech & Audio
              </button>
              <button
                onClick={() => onExploreCategory('apparel')}
                className="px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
              >
                Apparel
              </button>
              <button
                onClick={() => onExploreCategory('home')}
                className="px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
              >
                Home Living
              </button>
            </div>

            {/* Trust Signals */}
            <div className="mt-10 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 grid grid-cols-3 gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">Instant Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">2-Yr Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">30-Day Returns</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative h-72 sm:h-96 lg:h-full w-full rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800">
              <img
                src="/src/assets/images/hero_megastore_curated_1793108896135.jpg"
                alt="Curated tech, apparel and home goods"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/20 to-transparent flex flex-col justify-end p-6 text-white">
                <div className="text-xs uppercase tracking-wider text-zinc-300 font-medium">Curated Essentials</div>
                <div className="text-lg font-bold tracking-tight">The Autumn Trilogy</div>
                <div className="text-xs text-zinc-300 mt-1">Available in limited batch production</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
