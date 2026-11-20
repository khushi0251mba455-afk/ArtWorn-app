import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../lib/firebase';
import { checkRateLimit } from '../lib/rateLimit';

const PRODUCT_OPTIONS = [
  'Hand-Painted Denim Jackets',
  'Oversized Graphic / Floral Tees',
  'Embroidered Canvas Tote Bags',
  'Customized Denim Jeans',
  'Gift Sets & Bookmarks',
];

export const SurveyPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [favorites, setFavorites] = useState<string[]>(['Hand-Painted Denim Jackets']);
  const [priceRange, setPriceRange] = useState('₹1,200 – ₹2,500');
  const [interest, setInterest] = useState('Yes, definitely for a gift or fest');
  const [discovery, setDiscovery] = useState('Instagram');
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleFav = (item: string) => {
    setFavorites((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (favorites.length === 0) {
      showToast('Please select at least one favourite product category.', 'error');
      return;
    }
    const rl = checkRateLimit('survey', 30000);
    if (!rl.allowed) {
      showToast(`Please wait ${rl.waitSeconds}s before submitting again.`, 'info');
      return;
    }
    setBusy(true);
    try {
      await addDoc(collection(db, 'surveyResponses'), {
        ...(user?.uid ? { userId: user.uid } : {}),
        favoriteProducts: favorites,
        preferredPriceRange: priceRange,
        customizationInterest: interest,
        discoverySource: discovery,
        ...(feedback.trim() ? { feedback: feedback.trim().slice(0, 1000) } : {}),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      showToast('Thank you for helping shape ArtWorn Dehradun!', 'success');
    } catch {
      showToast('Unable to save survey response right now.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-8">
          <CheckCircle2 className="w-12 h-12 text-[#9CAF88] mx-auto" />
          <h1 className="font-serif text-3xl font-semibold mt-4">Thank You!</h1>
          <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4]">
            Your feedback goes straight to our studio planning board in Dehradun. Use code <strong>ART10</strong> at checkout for 10% off your first piece.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 pb-24">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">
          60-Second Studio Validation
        </p>
        <h1 className="font-serif text-3xl font-semibold mt-1">Help Shape Our Next Collection</h1>
        <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4]">
          Tell us what wearable-art pieces and price points you love most. Responses help our studio prioritize upcoming drops.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 sm:p-8 space-y-6"
      >
        <div>
          <label className="block text-sm font-semibold mb-2.5">
            1. Which ArtWorn pieces would you love to wear or gift? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRODUCT_OPTIONS.map((item) => {
              const checked = favorites.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleFav(item)}
                  className={`p-3 rounded-xl border text-left text-xs font-medium transition-colors ${
                    checked
                      ? 'border-[#C65D3B] bg-[#C65D3B]/10 text-[#C65D3B]'
                      : 'border-[#E6DDD0] dark:border-[#332D27]'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            2. Comfortable price range for a customized piece
          </label>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
          >
            <option>Under ₹1,000 (Totes / Tees)</option>
            <option>₹1,200 – ₹2,500</option>
            <option>₹2,500 – ₹4,000 (Denim Jackets)</option>
            <option>₹4,000+ (Heirloom Mixed-Media)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            3. How interested are you in designing a 1-of-1 custom piece?
          </label>
          <select
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
          >
            <option>Yes, definitely for a gift or fest</option>
            <option>Yes, for my everyday wardrobe</option>
            <option>Maybe, if I see past examples first</option>
            <option>I prefer buying ready-made drops</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            4. How did you discover ArtWorn?
          </label>
          <select
            value={discovery}
            onChange={(e) => setDiscovery(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
          >
            <option>Instagram</option>
            <option>WhatsApp</option>
            <option>College Event / Campus Pop-Up</option>
            <option>Friend Referral</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            5. Any theme or garment you wish we offered? (Optional)
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Painted corduroy overshirts, anime motifs, or Uttarakhand folk art..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors disabled:opacity-60"
        >
          <ClipboardCheck className="w-4 h-4" />
          {busy ? 'Submitting...' : 'Submit Survey Response'}
        </button>
      </form>
    </div>
  );
};
