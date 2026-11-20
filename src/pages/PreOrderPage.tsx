import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Layers, ShoppingBag } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { STUDIO_IMAGES } from '../data/seedData';
import { formatINR } from '../lib/format';

export const PreOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { siteSettings, addToCart } = useStore();
  const { showToast } = useToast();

  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Deep Indigo');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const update = () => {
      const target = new Date(siteSettings.preOrderEndsAt).getTime();
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [siteSettings.preOrderEndsAt]);

  const slotsLeft = siteSettings.preOrderSlotsLeft;
  const slotsTotal = siteSettings.preOrderSlotsTotal || 25;
  const filledPercent = Math.min(100, Math.round(((slotsTotal - slotsLeft) / slotsTotal) * 100));

  const handleReserve = () => {
    if (slotsLeft <= 0) {
      showToast('This batch is fully reserved! Join the newsletter for the next drop.', 'info');
      return;
    }
    addToCart({
      productId: 'preorder-winter-mountain',
      title: `${siteSettings.preOrderTitle} (Pre-Order)`,
      image: STUDIO_IMAGES.himalayanJacket,
      price: siteSettings.preOrderPrice,
      costPrice: 1550,
      size,
      color,
      quantity: 1,
      isCustom: true,
      customNote: 'Numbered Batch Pre-Order',
    });
    navigate('/checkout?preorder=1');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#E6DDD0] dark:border-[#332D27] shadow-sm">
            <SafeImage
              src={STUDIO_IMAGES.himalayanJacket}
              alt={siteSettings.preOrderTitle}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">
              Limited-Slot Batch · Hand-Numbered
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1 text-balance">
              {siteSettings.preOrderTitle}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
              {siteSettings.preOrderSubtitle}
            </p>
          </div>

          {/* Countdown */}
          <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#5C554E] dark:text-[#B5ADA4] mb-3">
              <Clock className="w-4 h-4 text-[#C65D3B]" />
              <span>Pre-Order Window Closes In</span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center tabular-nums">
              {[
                { label: 'Days', val: timeLeft.days },
                { label: 'Hours', val: timeLeft.hours },
                { label: 'Mins', val: timeLeft.mins },
                { label: 'Secs', val: timeLeft.secs },
              ].map((t) => (
                <div key={t.label} className="rounded-xl bg-[#FAF6F0] dark:bg-[#141210] py-3">
                  <span className="font-serif text-2xl font-semibold block">{String(t.val).padStart(2, '0')}</span>
                  <span className="text-[11px] text-[#5C554E] dark:text-[#B5ADA4]">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Slots left meter */}
          <div className="rounded-2xl bg-[#F3ECE2]/70 dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-5">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#C65D3B]" />
                Batch Capacity
              </span>
              <span className="tabular-nums text-[#C65D3B] font-semibold">
                {slotsLeft} of {slotsTotal} slots left
              </span>
            </div>
            <div className="mt-2.5 h-2 rounded-full bg-[#E6DDD0] dark:bg-[#2C2620] overflow-hidden">
              <div className="h-full bg-[#C65D3B]" style={{ width: `${filledPercent}%` }} />
            </div>
          </div>

          {/* Variant selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
              >
                {['XS', 'S', 'M', 'L', 'XL'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Denim Wash</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
              >
                <option>Deep Indigo</option>
                <option>Vintage Light Wash</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs text-[#5C554E] dark:text-[#B5ADA4] block">Pre-Order Price (50% Advance Eligible)</span>
              <span className="text-2xl font-semibold tabular-nums text-[#C65D3B]">
                {formatINR(siteSettings.preOrderPrice)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleReserve}
              disabled={slotsLeft <= 0}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              {slotsLeft > 0 ? 'Reserve My Slot' : 'Batch Sold Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
