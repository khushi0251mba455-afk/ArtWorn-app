import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Search, SlidersHorizontal, Star } from 'lucide-react';
import { QuickViewModal } from '../components/QuickViewModal';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../lib/format';
import type { Product } from '../types';

export const ShopPage: React.FC = () => {
  const { products, dataLoading, wishlistIds, toggleWishlist } = useStore();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [colorFilter, setColorFilter] = useState('All');
  const [occasionFilter, setOccasionFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ready' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const categories = ['All', 'Denim Jackets', 'T-Shirts', 'Tote Bags', 'Denim Pieces'];
  const allColors = useMemo(
    () => ['All', ...Array.from(new Set(products.flatMap((p) => p.colors)))],
    [products]
  );
  const allOccasions = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.occasion).filter(Boolean)))],
    [products]
  );

  const filtered = useMemo(() => {
    return products
      .filter((p) => p.active)
      .filter((p) => (category === 'All' ? true : p.category === category))
      .filter((p) => p.price <= maxPrice)
      .filter((p) => (colorFilter === 'All' ? true : p.colors.includes(colorFilter)))
      .filter((p) => (occasionFilter === 'All' ? true : p.occasion === occasionFilter))
      .filter((p) => {
        if (typeFilter === 'ready') return !p.isCustom;
        if (typeFilter === 'custom') return p.isCustom;
        return true;
      })
      .filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return Number(b.featured) - Number(a.featured);
      });
  }, [products, category, maxPrice, colorFilter, occasionFilter, typeFilter, search, sortBy]);

  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setMaxPrice(5000);
    setColorFilter('All');
    setOccasionFilter('All');
    setTypeFilter('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E6DDD0] dark:border-[#2C2620]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">ArtWorn Catalog</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1">Wearable Art Shop</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#5C554E] absolute left-3.5 top-3" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jackets, totes, tees..."
              aria-label="Search products"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] text-sm focus:outline-none focus:ring-2 focus:ring-[#C65D3B]/40"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="Sort products"
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <button
            type="button"
            onClick={() => setShowFiltersMobile((v) => !v)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              category === cat
                ? 'bg-[#1F1D1B] text-[#FAF6F0] dark:bg-[#F5EFE6] dark:text-[#141210]'
                : 'bg-[#F3ECE2]/80 dark:bg-[#1E1B18] text-[#5C554E] dark:text-[#B5ADA4] hover:text-[#1F1D1B]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filter Sidebar */}
        <aside className={`lg:col-span-3 space-y-6 ${showFiltersMobile ? 'block' : 'hidden lg:block'}`}>
          <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Refine</h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-[#C65D3B] hover:underline"
              >
                Reset
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C554E] dark:text-[#B5ADA4] mb-2">
                Max Price: <span className="text-[#1F1D1B] dark:text-[#F5EFE6] tabular-nums">{formatINR(maxPrice)}</span>
              </label>
              <input
                type="range"
                min={800}
                max={5000}
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#C65D3B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C554E] dark:text-[#B5ADA4] mb-1.5">
                Piece Type
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F3ECE2] dark:bg-[#141210]">
                {(['all', 'ready', 'custom'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      typeFilter === t ? 'bg-white dark:bg-[#25211D] shadow-xs' : 'text-[#5C554E]'
                    }`}
                  >
                    {t === 'all' ? 'All' : t === 'ready' ? 'Ready' : 'Custom'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C554E] dark:text-[#B5ADA4] mb-1.5">
                Colour / Shade
              </label>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
              >
                {allColors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C554E] dark:text-[#B5ADA4] mb-1.5">
                Occasion
              </label>
              <select
                value={occasionFilter}
                onChange={(e) => setOccasionFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
              >
                {allOccasions.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          {dataLoading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-80 rounded-2xl bg-[#F3ECE2] dark:bg-[#1E1B18] animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-12 text-center">
              <p className="font-serif text-xl font-medium">No matching studio pieces found</p>
              <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4] mt-2">
                Try clearing filters or send us your idea in the Custom Studio.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl border border-[#E6DDD0] dark:border-[#3A332C] text-sm font-medium"
                >
                  Clear Filters
                </button>
                <Link
                  to="/custom-studio"
                  className="px-4 py-2 rounded-xl bg-[#C65D3B] text-white text-sm font-medium"
                >
                  Open Custom Studio
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((product) => {
                const wished = wishlistIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className="group rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col"
                  >
                    <div className="relative aspect-[4/3] bg-[#F3ECE2] dark:bg-[#25211D] overflow-hidden">
                      <Link to={`/product/${product.id}`} className="block w-full h-full">
                        <SafeImage
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      </Link>
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product.id)}
                          aria-label="Toggle wishlist"
                          className={`w-9 h-9 rounded-full flex items-center justify-center bg-white/90 dark:bg-[#141210]/85 border border-[#E6DDD0] dark:border-[#332D27] ${
                            wished ? 'text-[#C65D3B]' : 'text-[#5C554E] dark:text-[#B5ADA4]'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${wished ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickView(product)}
                          aria-label={`Quick view ${product.title}`}
                          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/90 dark:bg-[#141210]/85 border border-[#E6DDD0] dark:border-[#332D27] text-[#5C554E] dark:text-[#B5ADA4] hover:text-[#C65D3B]"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-[#5C554E] dark:text-[#B5ADA4]">
                          <span>{product.category}</span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3 h-3 fill-[#E3A72F] text-[#E3A72F]" />
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                        <Link to={`/product/${product.id}`}>
                          <h3 className="mt-1 text-base font-semibold line-clamp-1 group-hover:text-[#C65D3B] transition-colors">
                            {product.title}
                          </h3>
                        </Link>
                        <p className="mt-1 text-xs text-[#5C554E] dark:text-[#B5ADA4] line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E6DDD0]/60 dark:border-[#2C2620] flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold tabular-nums">
                            {formatINR(product.price)}
                          </span>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-xs line-through text-[#5C554E] tabular-nums">
                              {formatINR(product.compareAtPrice)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">
                          {product.isCustom ? 'Bespoke' : `${product.stock} left`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
};
