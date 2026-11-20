import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Instagram,
  Palette,
  Star,
} from 'lucide-react';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { QuickViewModal } from '../components/QuickViewModal';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { STUDIO_IMAGES } from '../data/seedData';
import { db } from '../lib/firebase';
import { formatINR } from '../lib/format';
import { checkRateLimit } from '../lib/rateLimit';
import type { Product } from '../types';

export const HomePage: React.FC = () => {
  const { products, reviews, siteSettings, wishlistIds, toggleWishlist } = useStore();
  const { showToast } = useToast();

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const featuredProducts = products.filter((p) => p.active && p.featured).slice(0, 4);
  const showcaseProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    const rl = checkRateLimit('newsletter', 20000);
    if (!rl.allowed) {
      showToast(`Please wait ${rl.waitSeconds}s before submitting again.`, 'info');
      return;
    }
    setSubscribing(true);
    try {
      await addDoc(collection(db, 'leads'), {
        name: 'Newsletter Subscriber',
        contact: newsletterEmail.trim().slice(0, 150),
        source: 'Website',
        notes: 'Joined Dehradun Studio Drop mailing list',
        status: 'New',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewsletterEmail('');
      showToast('You are on the list for our next Dehradun studio drop!', 'success');
    } catch {
      showToast('Subscribed locally! Watch your inbox for our next drop.', 'success');
      setNewsletterEmail('');
    } finally {
      setSubscribing(false);
    }
  };

  const steps = [
    {
      num: '01',
      title: 'Choose product',
      desc: 'Pick heavyweight organic tees, vintage-wash denim jackets, jeans, or 14oz canvas totes.',
    },
    {
      num: '02',
      title: 'Share your idea',
      desc: 'Upload inspiration photos, song lyrics, pet portraits, or color moods in our Custom Studio.',
    },
    {
      num: '03',
      title: 'We hand-paint it',
      desc: 'Our Dehradun artists sketch, hand-paint or embroider, and heat-cure every piece by hand.',
    },
    {
      num: '04',
      title: 'Delivered to you',
      desc: 'Wrapped in plastic-free kraft packaging with wash-care notes and shipped pan-India.',
    },
  ];

  const igFeed = [
    { src: STUDIO_IMAGES.heroStudio, caption: 'Morning brush prep in Rajpur Road studio' },
    { src: STUDIO_IMAGES.sunMoonJacket, caption: 'Solstice Sun & Moon cropped denim reveal' },
    { src: STUDIO_IMAGES.wildflowerTote, caption: '9 hours of French knots & botanicals' },
    { src: STUDIO_IMAGES.charcoalPortraitTee, caption: 'Minimalist continuous-line portrait on 240GSM tee' },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* 1. Editorial Split Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 md:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center py-4">
            <p className="text-xs font-medium tracking-wider uppercase text-[#C65D3B]">
              Dehradun Wearable-Art Studio · Handcrafted One-of-One
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#1F1D1B] dark:text-[#F5EFE6] mt-3 leading-[1.1] text-balance">
              Turn your style into art.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#5C554E] dark:text-[#B5ADA4] max-w-xl leading-relaxed">
              Slow-crafted denim jackets, organic cotton tees, and canvas totes hand-painted and embroidered in Dehradun. Wear a story no one else owns.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                to="/custom-studio"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors shadow-sm"
              >
                <Palette className="w-4 h-4" />
                Send us your idea
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[#E6DDD0] dark:border-[#3A332C] text-sm font-medium hover:bg-[#F3ECE2] dark:hover:bg-[#25211D] transition-colors"
              >
                Explore Shop
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E6DDD0] dark:border-[#2C2620] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#5C554E] dark:text-[#B5ADA4]">
              <span>Wash-proof archival pigments</span>
              <span aria-hidden="true">·</span>
              <span>50% advance on custom orders</span>
              <span aria-hidden="true">·</span>
              <span>Pan-India shipping</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[300px] lg:min-h-[460px] rounded-2xl overflow-hidden border border-[#E6DDD0] dark:border-[#332D27] shadow-sm">
              <SafeImage
                src={STUDIO_IMAGES.heroStudio}
                alt="ArtWorn Dehradun studio table with hand-painted Himalayan denim jacket and brushes"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">Curated Studio Drops</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">Featured Wearable Art</h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C65D3B] hover:underline whitespace-nowrap"
          >
            View all pieces
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {showcaseProducts.map((product) => {
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
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center bg-white/90 dark:bg-[#141210]/85 border border-[#E6DDD0] dark:border-[#332D27] transition-colors ${
                      wished ? 'text-[#C65D3B]' : 'text-[#5C554E] dark:text-[#B5ADA4]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${wished ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">
                      {product.category} <span aria-hidden="true">·</span> {product.deliveryDays}d dispatch
                    </p>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="mt-1 text-base font-semibold text-[#1F1D1B] dark:text-[#F5EFE6] group-hover:text-[#C65D3B] transition-colors line-clamp-1">
                        {product.title}
                      </h3>
                    </Link>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold tabular-nums text-[#1F1D1B] dark:text-[#F5EFE6]">
                        {formatINR(product.price)}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-xs line-through text-[#5C554E] dark:text-[#B5ADA4] tabular-nums">
                          {formatINR(product.compareAtPrice)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuickViewProduct(product)}
                      className="text-xs font-medium text-[#C65D3B] hover:underline whitespace-nowrap"
                    >
                      Quick View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. How It Works (4 Editorial Steps) */}
      <section className="bg-[#F3ECE2]/70 dark:bg-[#1A1714] border-y border-[#E6DDD0] dark:border-[#2C2620] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">Bespoke Process</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">
              From blank cotton or denim to your personal masterpiece
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6"
              >
                <span className="font-serif text-2xl font-semibold text-[#C65D3B] tabular-nums">
                  {step.num}
                </span>
                <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Before / After Transformation Slider */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">
              Studio Transformation
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mt-1 text-balance">
              Slide to see raw indigo become Garhwal art
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
              Whether you pick a fresh garment from our studio or mail in a beloved jacket sitting in your hostel wardrobe, we transform it layer by layer with wash-proof textile acrylics and hand embroidery.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/custom-studio"
                className="px-5 py-2.5 rounded-xl bg-[#1F1D1B] dark:bg-[#F5EFE6] text-[#FAF6F0] dark:text-[#141210] text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Start Custom Request
              </Link>
              <Link
                to="/pre-order"
                className="px-5 py-2.5 rounded-xl border border-[#E6DDD0] dark:border-[#3A332C] text-sm font-medium hover:bg-[#F3ECE2] dark:hover:bg-[#25211D] transition-colors"
              >
                View Limited Pre-Order
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <BeforeAfterSlider
              beforeSrc={STUDIO_IMAGES.plainDenimBefore}
              afterSrc={STUDIO_IMAGES.himalayanJacket}
            />
          </div>
        </div>
      </section>

      {/* 5. Testimonials & Customer Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">Worn Across Campuses</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mt-1">Stories from ArtWorn Patrons</h2>
          </div>
          <Link to="/gallery" className="text-sm font-medium text-[#C65D3B] hover:underline">
            Explore full gallery →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 3).map((rev) => (
            <article
              key={rev.id}
              className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-[#E3A72F]" aria-label={`${rev.rating} out of 5 stars`}>
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm text-[#1F1D1B] dark:text-[#F5EFE6] leading-relaxed">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#E6DDD0] dark:border-[#2C2620] flex items-center justify-between text-xs text-[#5C554E] dark:text-[#B5ADA4]">
                <span className="font-medium text-[#1F1D1B] dark:text-[#F5EFE6]">{rev.userName}</span>
                <span>Verified Patron</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 6. Instagram Feed Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">Studio Diary</p>
            <h2 className="font-serif text-2xl font-semibold mt-0.5">@artworn.dehradun</h2>
          </div>
          <a
            href="https://instagram.com/artworn.dehradun"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#C65D3B] hover:underline"
          >
            <Instagram className="w-4 h-4" />
            Follow on Instagram
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {igFeed.map((post, i) => (
            <a
              key={i}
              href="https://instagram.com/artworn.dehradun"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-2xl overflow-hidden border border-[#E6DDD0] dark:border-[#2C2620] bg-[#F3ECE2]"
            >
              <SafeImage
                src={post.src}
                alt={post.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-xs text-white leading-snug">{post.caption}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 7. FAQ & Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7">
          <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">Studio Questions</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mt-1 mb-6">Frequently Asked</h2>
          <div className="divide-y divide-[#E6DDD0] dark:divide-[#2C2620] border-y border-[#E6DDD0] dark:border-[#2C2620]">
            {siteSettings.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 text-left font-medium text-sm sm:text-base"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-[#C65D3B] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 text-sm text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl bg-[#F3ECE2] dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">Dehradun Studio Letter</p>
            <h3 className="font-serif text-2xl font-semibold mt-1">First dibs on small-batch drops</h3>
            <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
              Get early access to numbered denim drops, campus pop-up dates in Dehradun &amp; Delhi, and seasonal custom slot openings.
            </p>
            <form onSubmit={handleNewsletter} className="mt-5 space-y-3">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                aria-label="Email address for studio newsletter"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#3A332C] text-sm focus:outline-none focus:ring-2 focus:ring-[#C65D3B]/40"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="w-full py-3 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors disabled:opacity-60"
              >
                {subscribing ? 'Joining...' : 'Join Studio List'}
              </button>
            </form>
            <div className="mt-6 pt-5 border-t border-[#E6DDD0] dark:border-[#2C2620]">
              <Link to="/survey" className="text-xs font-medium text-[#C65D3B] hover:underline">
                Take our 60-second Style Survey &amp; help shape the next drop →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
};
