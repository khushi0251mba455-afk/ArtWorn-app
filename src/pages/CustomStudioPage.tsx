import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Gift,
  ImagePlus,
  Loader2,
  Palette,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { db, handleFirestoreError, OperationType, uploadImageToStorage, validateImageFile } from '../lib/firebase';
import { estimateCustomPrice, formatINR } from '../lib/format';
import { checkRateLimit } from '../lib/rateLimit';
import type { CustomProductType, CustomStyle } from '../types';

const PRODUCT_TYPES: { label: CustomProductType; note: string }[] = [
  { label: 'Denim Jacket', note: 'Heavyweight indigo or vintage wash' },
  { label: 'T-Shirt', note: '240 GSM oversized organic cotton' },
  { label: 'Tote Bag', note: '14oz unbleached natural canvas' },
  { label: 'Denim Jeans', note: 'Pockets, side panels, or cuff art' },
  { label: 'Other', note: 'Send your own clean garment or fabric piece' },
];

const STYLES: { label: CustomStyle; desc: string }[] = [
  { label: 'Hand-Painted', desc: 'Heat-cured archival textile acrylics with crisp detail' },
  { label: 'Embroidery', desc: 'Tactile hand-stitched threads, French knots & florals' },
  { label: 'Mixed Media', desc: 'Layered fabric painting combined with thread highlights' },
  { label: 'Patches & Embellishments', desc: 'Appliqué textile patches, mirror work & trim' },
];

export const CustomStudioPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, isVerified, setAuthModalOpen } = useAuth();
  const { saveCustomDesign } = useStore();
  const { showToast } = useToast();

  const refProduct = searchParams.get('refProduct') || '';

  const [step, setStep] = useState(1);
  const [productType, setProductType] = useState<CustomProductType>('Denim Jacket');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Classic Indigo');
  const [style, setStyle] = useState<CustomStyle>('Hand-Painted');
  const [theme, setTheme] = useState(refProduct ? `Inspired by ${refProduct}` : '');
  const [customText, setCustomText] = useState('');
  const [preferredColors, setPreferredColors] = useState('');
  const [occasion, setOccasion] = useState('Personal Wardrobe');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState('₹2,500 – ₹4,000');
  const [neededByDate, setNeededByDate] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [leadSource, setLeadSource] = useState('Instagram');
  const [submitting, setSubmitting] = useState(false);

  const estimate = useMemo(
    () => estimateCustomPrice(productType, style, Boolean(customText.trim()), isGift),
    [productType, style, customText, isGift]
  );

  const sizeOptions =
    productType === 'Tote Bag'
      ? ['One Size (15x16 in)']
      : productType === 'Denim Jeans'
      ? ['26', '28', '30', '32', '34', '36']
      : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const colorOptions =
    productType === 'T-Shirt'
      ? ['Warm Cream', 'Charcoal Black', 'Sage Olive', 'Terracotta']
      : productType === 'Tote Bag'
      ? ['Natural Canvas', 'Warm Sand', 'Charcoal Canvas']
      : ['Classic Indigo', 'Vintage Light Wash', 'Washed Black', 'My Own Garment'];

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (files.length + picked.length > 5) {
      showToast('You can upload up to 5 reference images.', 'error');
      return;
    }
    const valid: File[] = [];
    for (const f of picked) {
      const err = validateImageFile(f);
      if (err) {
        showToast(err, 'error');
      } else {
        valid.push(f);
      }
    }
    setFiles((prev) => [...prev, ...valid]);
    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPreviews((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await saveCustomDesign({
        id: `design-${Date.now()}`,
        title: theme.trim() || `${style} ${productType}`,
        productType,
        style,
        color,
        notes: description.trim() || 'Saved custom studio idea',
        savedAt: new Date().toISOString(),
      });
      showToast('Design draft saved to your Wishlist!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save draft.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!isVerified) {
      showToast('Please verify your email address before submitting a custom request.', 'error');
      return;
    }
    if (theme.trim().length < 2 || description.trim().length < 5) {
      showToast('Please add a brief theme title and description of your idea in Step 4.', 'error');
      setStep(4);
      return;
    }
    const rl = checkRateLimit('custom_request', 20000);
    if (!rl.allowed) {
      showToast(`Please wait ${rl.waitSeconds}s before submitting again.`, 'info');
      return;
    }

    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const f of files) {
        const url = await uploadImageToStorage(f, 'custom-requests', user.uid);
        uploadedUrls.push(url);
      }

      const reqRef = doc(collection(db, 'customRequests'));
      await setDoc(reqRef, {
        userId: user.uid,
        customerName: (profile?.displayName || user.displayName || 'ArtWorn Patron').slice(0, 100),
        ...(user.email ? { customerEmail: user.email } : {}),
        ...(profile?.phone || user.phoneNumber ? { customerPhone: profile?.phone || user.phoneNumber } : {}),
        productType,
        size,
        color,
        style,
        theme: theme.trim().slice(0, 120),
        ...(customText.trim() ? { customText: customText.trim().slice(0, 200) } : {}),
        ...(preferredColors.trim() ? { preferredColors: preferredColors.trim().slice(0, 150) } : {}),
        occasion,
        description: description.trim().slice(0, 2000),
        referenceImages: uploadedUrls,
        budgetRange,
        ...(neededByDate ? { neededByDate } : {}),
        isGift,
        ...(isGift && giftMessage.trim() ? { giftMessage: giftMessage.trim().slice(0, 300) } : {}),
        estimatedMin: estimate.min,
        estimatedMax: estimate.max,
        leadSource,
        status: 'Enquiry',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Seed initial message in thread
      await addDoc(collection(db, 'customRequests', reqRef.id, 'messages'), {
        senderId: user.uid,
        senderName: profile?.displayName || user.displayName || 'Patron',
        senderRole: 'customer',
        text: `Submitted custom ${productType} request: "${theme.trim()}" — ${description.trim().slice(0, 400)}`,
        createdAt: serverTimestamp(),
      });

      // Record lead channel attribution
      try {
        await addDoc(collection(db, 'leads'), {
          name: (profile?.displayName || user.displayName || 'Custom Request Patron').slice(0, 100),
          contact: user.email || user.phoneNumber || user.uid,
          source: leadSource,
          notes: `Custom Studio: ${productType} (${style}) — ${theme.trim()}`,
          status: 'New',
          estimatedValue: estimate.min,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // non-blocking
      }

      // Confirmation notification
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Custom Request Received',
        message: `We received your "${theme.trim()}" idea! Our Dehradun artist will send your quote within 24 hours.`,
        type: 'quote',
        read: false,
        link: '/account',
        createdAt: serverTimestamp(),
      });

      showToast('Custom request submitted! Track & chat with our artist in your Account.', 'success');
      navigate('/account?tab=requests');
    } catch (error) {
      if (error instanceof Error && error.message.includes('Image upload')) {
        showToast(error.message, 'error');
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'customRequests');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E6DDD0] dark:border-[#2C2620]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">
            Bespoke Commission Wizard
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1">Custom Order Studio</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">Live Studio Estimate</p>
          <p className="text-lg font-semibold tabular-nums text-[#C65D3B]">
            {formatINR(estimate.min)} – {formatINR(estimate.max)}
          </p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="mt-6 grid grid-cols-6 gap-2">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStep(n)}
            className="text-left group"
          >
            <div
              className={`h-1.5 rounded-full transition-colors ${
                n <= step ? 'bg-[#C65D3B]' : 'bg-[#E6DDD0] dark:bg-[#2C2620]'
              }`}
            />
            <span
              className={`block mt-1.5 text-[11px] font-medium truncate ${
                n === step ? 'text-[#C65D3B]' : 'text-[#5C554E] dark:text-[#B5ADA4]'
              }`}
            >
              {n === 1 && '1. Piece'}
              {n === 2 && '2. Fit'}
              {n === 3 && '3. Craft'}
              {n === 4 && '4. Idea'}
              {n === 5 && '5. Date'}
              {n === 6 && '6. Review'}
            </span>
          </button>
        ))}
      </div>

      {/* Step Card */}
      <div className="mt-8 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 sm:p-8 shadow-xs">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold">Step 1: Choose your garment or bag</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PRODUCT_TYPES.map((pt) => (
                <button
                  key={pt.label}
                  type="button"
                  onClick={() => {
                    setProductType(pt.label);
                    if (pt.label === 'Tote Bag') setSize('One Size (15x16 in)');
                    else if (pt.label === 'Denim Jeans') setSize('30');
                    else setSize('M');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    productType === pt.label
                      ? 'border-[#C65D3B] bg-[#C65D3B]/8 ring-1 ring-[#C65D3B]'
                      : 'border-[#E6DDD0] dark:border-[#332D27] hover:border-[#C65D3B]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{pt.label}</span>
                    {productType === pt.label && <Check className="w-4 h-4 text-[#C65D3B]" />}
                  </div>
                  <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] mt-1">{pt.note}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-semibold">Step 2: Select size &amp; base colour</h2>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5C554E] mb-2">
                Size
              </label>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSize(sz)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      size === sz
                        ? 'bg-[#1F1D1B] text-white border-[#1F1D1B] dark:bg-[#F5EFE6] dark:text-[#141210]'
                        : 'border-[#E6DDD0] dark:border-[#332D27]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5C554E] mb-2">
                Base Colour / Wash
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((cl) => (
                  <button
                    key={cl}
                    type="button"
                    onClick={() => setColor(cl)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      color === cl
                        ? 'bg-[#C65D3B] text-white border-[#C65D3B]'
                        : 'border-[#E6DDD0] dark:border-[#332D27]'
                    }`}
                  >
                    {cl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold">Step 3: Choose your craft technique</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {STYLES.map((st) => (
                <button
                  key={st.label}
                  type="button"
                  onClick={() => setStyle(st.label)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    style === st.label
                      ? 'border-[#C65D3B] bg-[#C65D3B]/8 ring-1 ring-[#C65D3B]'
                      : 'border-[#E6DDD0] dark:border-[#332D27] hover:border-[#C65D3B]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{st.label}</span>
                    {style === st.label && <Check className="w-4 h-4 text-[#C65D3B]" />}
                  </div>
                  <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] mt-1">{st.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold">Step 4: Describe your idea &amp; references</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Theme / Artwork Title *</label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Kedarnath mountains + golden retriever"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Occasion</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                >
                  <option>Personal Wardrobe</option>
                  <option>Birthday Gift</option>
                  <option>Anniversary / Couple Set</option>
                  <option>College Fest / Farewell</option>
                  <option>Travel / Trekking</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Custom Text / Quote / Lyrics (Optional)</label>
                <input
                  type="text"
                  maxLength={200}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g. 'Mountains are calling' on collar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Preferred Colour Palette</label>
                <input
                  type="text"
                  maxLength={150}
                  value={preferredColors}
                  onChange={(e) => setPreferredColors(e.target.value)}
                  placeholder="e.g. Terracotta, sage green, mustard gold"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Detailed Idea &amp; Placement *</label>
              <textarea
                rows={4}
                required
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us placement (back panel, sleeves, front pocket), mood, elements to include, or anything special..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">
                Reference Images (1–5 images, max 5MB each)
              </label>
              <label className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-[#E6DDD0] dark:border-[#332D27] hover:border-[#C65D3B] cursor-pointer text-center">
                <ImagePlus className="w-6 h-6 text-[#C65D3B] mb-1.5" />
                <span className="text-xs font-medium">Click to upload Pinterest moodboards, sketches, or pet photos</span>
                <span className="text-[11px] text-[#5C554E] dark:text-[#B5ADA4] mt-0.5">JPG, PNG, WebP · up to 5MB</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFilePick} />
              </label>

              {previews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E6DDD0]">
                      <img src={src} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        aria-label="Remove reference image"
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h2 className="font-serif text-2xl font-semibold">Step 5: Budget, timeline &amp; gifting</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Comfortable Budget Range</label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                >
                  <option>₹1,000 – ₹2,000</option>
                  <option>₹2,000 – ₹3,500</option>
                  <option>₹2,500 – ₹4,000</option>
                  <option>₹4,000 – ₹6,000+</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Needed By Date (Optional)</label>
                <input
                  type="date"
                  value={neededByDate}
                  onChange={(e) => setNeededByDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">How did you find ArtWorn?</label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
              >
                <option value="Instagram">Instagram (@artworn.dehradun)</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="College Event">College Event / Campus Pop-Up</option>
                <option value="Referral">Friend Referral</option>
                <option value="Website">Google / Direct Website</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="rounded-xl bg-[#F3ECE2]/60 dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] p-4 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium">
                <input
                  type="checkbox"
                  checked={isGift}
                  onChange={(e) => setIsGift(e.target.checked)}
                  className="rounded accent-[#C65D3B] w-4 h-4"
                />
                <Gift className="w-4 h-4 text-[#C65D3B]" />
                This is a gift (add handwritten Dehradun postcard &amp; gift wrap · +₹99)
              </label>
              {isGift && (
                <textarea
                  rows={2}
                  maxLength={300}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Write your handwritten card message..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              )}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-semibold">Step 6: Review &amp; send to studio</h2>

            <div className="rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5C554E] dark:text-[#B5ADA4]">Piece &amp; Fit</span>
                <span className="font-medium">{productType} · Size {size} · {color}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C554E] dark:text-[#B5ADA4]">Technique</span>
                <span className="font-medium">{style}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C554E] dark:text-[#B5ADA4]">Theme</span>
                <span className="font-medium">{theme || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C554E] dark:text-[#B5ADA4]">Reference Images</span>
                <span className="font-medium">{files.length} attached</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C554E] dark:text-[#B5ADA4]">Budget / Needed By</span>
                <span className="font-medium">{budgetRange} {neededByDate ? `· ${neededByDate}` : ''}</span>
              </div>
              <div className="pt-3 border-t border-[#E6DDD0] dark:border-[#332D27] flex justify-between items-baseline">
                <span className="font-semibold">Estimated Price Range</span>
                <span className="text-lg font-semibold text-[#C65D3B] tabular-nums">
                  {formatINR(estimate.min)} – {formatINR(estimate.max)}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
              Submitting is free. Our founder will review your references and send an exact quote &amp; timeline inside your Account chat thread, where you can approve it and pay 50% advance to start painting.
            </p>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-6 border-t border-[#E6DDD0] dark:border-[#2C2620] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-sm font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-xs font-medium text-[#5C554E] dark:text-[#B5ADA4] hover:text-[#C65D3B]"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Save Draft
            </button>
          </div>

          {step < 6 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
              {submitting ? 'Uploading & Sending...' : 'Submit Custom Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
