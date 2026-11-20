import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Palette, ShoppingBag, Star, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../lib/format';
import type { Product } from '../types';
import { SafeImage } from './SafeImage';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const navigate = useNavigate();
  const { addToCart, wishlistIds, toggleWishlist } = useStore();
  const { showToast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  if (!product) return null;

  const activeSize = selectedSize || product.sizes[0] || 'M';
  const activeColor = selectedColor || product.colors[0] || 'Default';
  const isWishlisted = wishlistIds.includes(product.id);

  const handleAdd = () => {
    addToCart({
      productId: product.id,
      title: product.title,
      image: product.images[0] || '',
      price: product.price,
      costPrice: product.costPrice ?? Math.round(product.price * 0.45),
      size: activeSize,
      color: activeColor,
      quantity: 1,
      isCustom: product.isCustom,
    });
    showToast(`Added "${product.title}" to your bag.`, 'success');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view ${product.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-[#FAF6F0] dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-[#25211D]/90 flex items-center justify-center border border-[#E6DDD0] dark:border-[#332D27] hover:scale-105 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="aspect-[4/3] md:aspect-auto md:h-full bg-[#F3ECE2] dark:bg-[#25211D]">
          <SafeImage
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#5C554E] dark:text-[#B5ADA4]">
              <span>{product.category}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#E3A72F] text-[#E3A72F]" />
                {product.rating.toFixed(1)} ({product.reviewCount})
              </span>
            </div>
            <h2 className="font-serif text-xl font-semibold mt-1.5 text-[#1F1D1B] dark:text-[#F5EFE6]">
              {product.title}
            </h2>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="text-lg font-semibold tabular-nums text-[#C65D3B]">
                {formatINR(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xs line-through text-[#5C554E] dark:text-[#B5ADA4] tabular-nums">
                  {formatINR(product.compareAtPrice)}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-[#5C554E] dark:text-[#B5ADA4] line-clamp-3 leading-relaxed">
              {product.description}
            </p>

            {/* Size selector */}
            <div className="mt-4">
              <p className="text-xs font-medium text-[#5C554E] dark:text-[#B5ADA4] mb-1.5">Size</p>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      activeSize === sz
                        ? 'bg-[#1F1D1B] text-white border-[#1F1D1B] dark:bg-[#F5EFE6] dark:text-[#141210]'
                        : 'border-[#E6DDD0] dark:border-[#3A332C] hover:border-[#C65D3B]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selector */}
            <div className="mt-3">
              <p className="text-xs font-medium text-[#5C554E] dark:text-[#B5ADA4] mb-1.5">Finish / Shade</p>
              <div className="flex flex-wrap gap-1.5">
                {product.colors.map((cl) => (
                  <button
                    key={cl}
                    type="button"
                    onClick={() => setSelectedColor(cl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      activeColor === cl
                        ? 'bg-[#C65D3B] text-white border-[#C65D3B]'
                        : 'border-[#E6DDD0] dark:border-[#3A332C] hover:border-[#C65D3B]'
                    }`}
                  >
                    {cl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Bag
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label="Toggle wishlist"
                className={`p-2.5 rounded-xl border transition-colors ${
                  isWishlisted
                    ? 'border-[#C65D3B] text-[#C65D3B] bg-[#C65D3B]/10'
                    : 'border-[#E6DDD0] dark:border-[#3A332C] hover:border-[#C65D3B]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/product/${product.id}`);
                }}
                className="flex-1 py-2 rounded-xl border border-[#E6DDD0] dark:border-[#3A332C] text-xs font-medium hover:bg-[#F3ECE2] dark:hover:bg-[#25211D] transition-colors"
              >
                View Full Details
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/custom-studio?refProduct=${encodeURIComponent(product.title)}`);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#C65D3B]/40 text-[#C65D3B] text-xs font-medium hover:bg-[#C65D3B]/10 transition-colors"
              >
                <Palette className="w-3.5 h-3.5" />
                Customize This
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
