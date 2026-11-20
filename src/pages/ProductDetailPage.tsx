import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  Camera,
  ChevronLeft,
  Heart,
  Palette,
  Ruler,
  Share2,
  ShoppingBag,
  Star,
  Truck,
  X,
  ZoomIn,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { db, handleFirestoreError, OperationType, uploadImageToStorage } from '../lib/firebase';
import { formatDate, formatINR } from '../lib/format';
import { checkRateLimit } from '../lib/rateLimit';

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, profile, isVerified, setAuthModalOpen } = useAuth();
  const { products, reviews, addToCart, wishlistIds, toggleWishlist } = useStore();
  const { showToast } = useToast();

  const product = products.find((p) => p.id === productId || p.slug === productId);

  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [customNote, setCustomNote] = useState('');

  // Review form
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revPhoto, setRevPhoto] = useState<File | null>(null);
  const [submittingRev, setSubmittingRev] = useState(false);

  // Inject product structured data (Schema.org JSON-LD)
  useEffect(() => {
    if (!product) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'product-json-ld';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description,
      image: product.images,
      brand: { '@type': 'Brand', name: 'ArtWorn' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: product.price,
        availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: Math.max(1, product.reviewCount),
      },
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById('product-json-ld')?.remove();
    };
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold">Piece not found</h1>
        <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4] mt-2">
          This studio piece may have been sold out or archived.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-block px-5 py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const activeSize = selectedSize || product.sizes[0] || 'M';
  const activeColor = selectedColor || product.colors[0] || 'Studio Finish';
  const isWished = wishlistIds.includes(product.id);
  const productReviews = reviews.filter((r) => r.productId === product.id);

  const handleAddToBag = () => {
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
      customNote: customNote.trim() || undefined,
    });
    showToast(`Added "${product.title}" to your bag.`, 'success');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.title, text: 'Check out this ArtWorn piece!', url });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    showToast('Product link copied to clipboard.', 'info');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!isVerified) {
      showToast('Please verify your email before posting a review.', 'error');
      return;
    }
    const rl = checkRateLimit('review', 30000);
    if (!rl.allowed) {
      showToast(`Please wait ${rl.waitSeconds}s before submitting another review.`, 'info');
      return;
    }
    setSubmittingRev(true);
    try {
      let photoUrl: string | undefined;
      if (revPhoto) {
        photoUrl = await uploadImageToStorage(revPhoto, 'reviews', user.uid);
      }
      await addDoc(collection(db, 'reviews'), {
        productId: product.id,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'ArtWorn Patron',
        rating: revRating,
        comment: revComment.trim().slice(0, 1000),
        ...(photoUrl ? { photoUrl } : {}),
        approved: false,
        createdAt: serverTimestamp(),
      });
      setRevComment('');
      setRevPhoto(null);
      showToast('Review submitted! It will appear live once approved by our studio.', 'success');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Image upload')) {
        showToast(error.message, 'error');
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'reviews');
      }
    } finally {
      setSubmittingRev(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <Link
        to="/shop"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C554E] dark:text-[#B5ADA4] hover:text-[#C65D3B] mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Gallery */}
        <div className="lg:col-span-7 space-y-3 lg:sticky lg:top-24">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F3ECE2] dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] group">
            <SafeImage
              src={product.images[activeImage] || product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-500"
              onClick={() => setZoomOpen(true)}
            />
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Zoom artwork"
              className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-white/90 dark:bg-[#141210]/85 border border-[#E6DDD0] dark:border-[#332D27] text-xs font-medium inline-flex items-center gap-1.5"
            >
              <ZoomIn className="w-4 h-4" />
              Zoom
            </button>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                    activeImage === i ? 'border-[#C65D3B]' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <SafeImage src={img} alt={`${product.title} view ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Purchase Module */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#5C554E] dark:text-[#B5ADA4]">
              <span>{product.category}</span>
              <span aria-hidden="true">·</span>
              <span>{product.occasion}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#E3A72F] text-[#E3A72F]" />
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-semibold mt-2 text-balance">
              {product.title}
            </h1>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-semibold tabular-nums text-[#C65D3B]">
                {formatINR(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm line-through text-[#5C554E] tabular-nums">
                  {formatINR(product.compareAtPrice)}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm sm:text-base text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Size Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5C554E]">Select Size</span>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#C65D3B] hover:underline"
              >
                <Ruler className="w-3.5 h-3.5" />
                Size Guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    activeSize === sz
                      ? 'bg-[#1F1D1B] text-white border-[#1F1D1B] dark:bg-[#F5EFE6] dark:text-[#141210]'
                      : 'border-[#E6DDD0] dark:border-[#332D27] hover:border-[#C65D3B]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Color / Finish */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#5C554E] mb-2">
              Base Colour
            </span>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((cl) => (
                <button
                  key={cl}
                  type="button"
                  onClick={() => setSelectedColor(cl)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    activeColor === cl
                      ? 'bg-[#C65D3B] text-white border-[#C65D3B]'
                      : 'border-[#E6DDD0] dark:border-[#332D27] hover:border-[#C65D3B]'
                  }`}
                >
                  {cl}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Personalization Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5C554E] mb-1.5">
              Optional Name / Initials Note
            </label>
            <input
              type="text"
              maxLength={80}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Tiny initials 'K.R.' near cuff"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
            />
          </div>

          {/* Primary Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleAddToBag}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Bag
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label="Save to wishlist"
                className={`p-3.5 rounded-xl border transition-colors ${
                  isWished
                    ? 'border-[#C65D3B] text-[#C65D3B] bg-[#C65D3B]/10'
                    : 'border-[#E6DDD0] dark:border-[#332D27]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWished ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share piece"
                className="p-3.5 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] hover:bg-[#F3ECE2] dark:hover:bg-[#25211D]"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/custom-studio?refProduct=${encodeURIComponent(product.title)}`)}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-[#C65D3B]/50 text-[#C65D3B] text-sm font-medium hover:bg-[#C65D3B]/10 transition-colors"
            >
              <Palette className="w-4 h-4" />
              Customize This Design in Studio
            </button>
          </div>

          {/* Delivery estimate */}
          <div className="rounded-xl bg-[#F3ECE2]/70 dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-4 flex items-start gap-3 text-xs">
            <Truck className="w-4 h-4 text-[#C65D3B] shrink-0 mt-0.5" />
            <div className="space-y-1 text-[#5C554E] dark:text-[#B5ADA4]">
              <p className="font-medium text-[#1F1D1B] dark:text-[#F5EFE6]">
                Studio Dispatch in {product.deliveryDays} Days from Dehradun
              </p>
              <p>Free Pan-India insured shipping on orders above ₹1,999. Wash-care card included.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-16 pt-12 border-t border-[#E6DDD0] dark:border-[#2C2620] grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-5">
          <h2 className="font-serif text-2xl font-semibold">
            Patron Reviews ({productReviews.length})
          </h2>
          {productReviews.length === 0 ? (
            <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4]">
              Be the first to share a photo review of this hand-crafted piece.
            </p>
          ) : (
            <div className="space-y-4">
              {productReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{rev.userName}</span>
                    <span className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">{formatDate(rev.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[#E3A72F] mt-1">
                    {Array.from({ length: rev.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mt-2.5 text-sm text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">{rev.comment}</p>
                  {rev.photoUrl && (
                    <div className="mt-3 w-24 h-24 rounded-xl overflow-hidden border border-[#E6DDD0] dark:border-[#332D27]">
                      <SafeImage src={rev.photoUrl} alt="Customer review photo" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <form
            onSubmit={handleReviewSubmit}
            className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-4"
          >
            <h3 className="font-serif text-xl font-semibold">Write a Review</h3>
            <div>
              <label className="block text-xs font-medium mb-1">Rating</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRevRating(num)}
                    aria-label={`Rate ${num} stars`}
                    className="p-1"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        num <= revRating ? 'fill-[#E3A72F] text-[#E3A72F]' : 'text-[#E6DDD0]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Your Review</label>
              <textarea
                rows={3}
                required
                minLength={3}
                maxLength={1000}
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                placeholder="How does the fabric and hand-painted artwork feel?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Add Photo (Optional, max 5MB)</label>
              <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-[#E6DDD0] dark:border-[#332D27] text-xs cursor-pointer hover:border-[#C65D3B]">
                <Camera className="w-4 h-4 text-[#C65D3B]" />
                <span className="truncate">{revPhoto ? revPhoto.name : 'Upload JPG / PNG photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setRevPhoto(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={submittingRev}
              className="w-full py-2.5 rounded-xl bg-[#1F1D1B] dark:bg-[#F5EFE6] text-white dark:text-[#141210] text-sm font-medium disabled:opacity-60"
            >
              {submittingRev ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </section>

      {/* Zoom Modal */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Close zoom"
            className="absolute top-4 right-4 p-2 rounded-full bg-white text-[#1F1D1B]"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <SafeImage
              src={product.images[activeImage] || product.images[0]}
              alt={product.title}
              className="w-full h-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          onClick={() => setSizeGuideOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl font-semibold">Studio Size Guide (Inches)</h3>
              <button type="button" onClick={() => setSizeGuideOpen(false)} aria-label="Close size guide">
                <X className="w-4 h-4" />
              </button>
            </div>
            <table className="w-full text-xs text-left border-collapse tabular-nums">
              <thead>
                <tr className="border-b border-[#E6DDD0] dark:border-[#332D27] text-[#5C554E]">
                  <th className="py-2">Size</th>
                  <th className="py-2">Chest</th>
                  <th className="py-2">Length</th>
                  <th className="py-2">Shoulder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DDD0]/60 dark:divide-[#2C2620]">
                <tr><td className="py-2 font-medium">XS</td><td>38&quot;</td><td>25.5&quot;</td><td>17&quot;</td></tr>
                <tr><td className="py-2 font-medium">S</td><td>40&quot;</td><td>26.5&quot;</td><td>18&quot;</td></tr>
                <tr><td className="py-2 font-medium">M</td><td>42&quot;</td><td>27.5&quot;</td><td>19&quot;</td></tr>
                <tr><td className="py-2 font-medium">L</td><td>44&quot;</td><td>28.5&quot;</td><td>20&quot;</td></tr>
                <tr><td className="py-2 font-medium">XL</td><td>46&quot;</td><td>29.5&quot;</td><td>21&quot;</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
