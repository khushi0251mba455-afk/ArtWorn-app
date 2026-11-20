import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, X } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import type { GalleryItem } from '../types';

export const GalleryPage: React.FC = () => {
  const { galleryItems } = useStore();
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const categories = ['All', 'Denim Jackets', 'T-Shirts', 'Tote Bags', 'Denim Pieces'];
  const items = filter === 'All' ? galleryItems : galleryItems.filter((g) => g.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E6DDD0] dark:border-[#2C2620]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">Studio Archive</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1">Commission Portfolio</h1>
          <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4] max-w-xl">
            Every custom piece begins as a conversation. Browse past hand-painted and embroidered commissions from our Dehradun studio.
          </p>
        </div>
        <Link
          to="/custom-studio"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors self-start"
        >
          <Palette className="w-4 h-4" />
          Commission Yours
        </Link>
      </div>

      {/* Category Filter Tabs */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              filter === cat
                ? 'bg-[#1F1D1B] text-[#FAF6F0] dark:bg-[#F5EFE6] dark:text-[#141210]'
                : 'bg-[#F3ECE2] dark:bg-[#1E1B18] text-[#5C554E] dark:text-[#B5ADA4]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Masonry Columns */}
      <div className="mt-8 columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            className="break-inside-avoid block w-full text-left rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] overflow-hidden hover:shadow-md transition-shadow"
          >
            <SafeImage src={item.imageUrl} alt={item.title} className="w-full h-auto object-cover" />
            <div className="p-4">
              <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">
                {item.category} <span aria-hidden="true">·</span> {item.technique}
              </p>
              <h2 className="font-serif text-lg font-semibold mt-1">{item.title}</h2>
              {item.story && (
                <p className="mt-1.5 text-xs text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
                  {item.story}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-w-2xl w-full rounded-2xl bg-[#FAF6F0] dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <SafeImage src={selected.imageUrl} alt={selected.title} className="w-full max-h-[60vh] object-cover" />
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close gallery preview"
                className="absolute top-3 right-3 p-2 rounded-full bg-white text-[#1F1D1B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs text-[#C65D3B] font-medium">
                {selected.category} · {selected.technique}
              </p>
              <h3 className="font-serif text-2xl font-semibold mt-1">{selected.title}</h3>
              {selected.story && (
                <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
                  {selected.story}
                </p>
              )}
              <Link
                to={`/custom-studio?refProduct=${encodeURIComponent(selected.title)}`}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium"
              >
                <Palette className="w-4 h-4" />
                Request a Similar Piece
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
