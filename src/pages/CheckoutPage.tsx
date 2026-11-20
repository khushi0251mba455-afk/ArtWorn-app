import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { CheckCircle2, CreditCard, ImagePlus, Loader2, ShieldCheck, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { SEED_COUPONS } from '../data/seedData';
import { db, handleFirestoreError, OperationType, uploadImageToStorage, validateImageFile } from '../lib/firebase';
import { calculateShipping, formatINR, isCodEligible, validatePinCode } from '../lib/format';
import type { Coupon, PaymentMethod } from '../types';

/**
 * Plug in live Razorpay Web Checkout here when VITE_RAZORPAY_KEY_ID is configured.
 * Script URL: https://checkout.razorpay.com/v1/checkout.js
 */
async function initiateRazorpayPayment(amountInINR: number, customerName: string, email: string): Promise<{ ok: boolean; paymentId?: string }> {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error('Razorpay key (VITE_RAZORPAY_KEY_ID) is not configured yet. Please use UPI or COD.');
  }
  // Placeholder hook for window.Razorpay({ key, amount: amountInINR * 100, currency: 'INR', name: 'ArtWorn', prefill: { name: customerName, email } })
  console.info('Ready for Razorpay invocation:', { key, amountInINR, customerName, email });
  return { ok: true, paymentId: `rzp_plug_${Date.now()}` };
}

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isPreOrderFlow = searchParams.get('preorder') === '1';
  const navigate = useNavigate();
  const { user, profile, isVerified, setAuthModalOpen } = useAuth();
  const { cart, cartSubtotal, clearCart, siteSettings, refreshCatalog } = useStore();
  const { showToast } = useToast();

  const defaultAddr = profile?.addresses?.find((a) => a.isDefault) || profile?.addresses?.[0];

  const [fullName, setFullName] = useState(defaultAddr?.fullName || profile?.displayName || '');
  const [phone, setPhone] = useState(defaultAddr?.phone || profile?.phone || '');
  const [line1, setLine1] = useState(defaultAddr?.line1 || '');
  const [line2, setLine2] = useState(defaultAddr?.line2 || '');
  const [city, setCity] = useState(defaultAddr?.city || 'Dehradun');
  const [stateName, setStateName] = useState(defaultAddr?.state || 'Uttarakhand');
  const [pincode, setPincode] = useState(defaultAddr?.pincode || '248001');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [referralInput, setReferralInput] = useState('');
  const [referralDiscount, setReferralDiscount] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [use50Advance, setUse50Advance] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (profile && !fullName) setFullName(profile.displayName || '');
    if (defaultAddr && !line1) {
      setFullName(defaultAddr.fullName);
      setPhone(defaultAddr.phone);
      setLine1(defaultAddr.line1);
      setLine2(defaultAddr.line2 || '');
      setCity(defaultAddr.city);
      setStateName(defaultAddr.state);
      setPincode(defaultAddr.pincode);
    }
  }, [profile, defaultAddr]);

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold">Your bag is empty</h1>
        <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4] mt-2">
          Add a wearable art piece before heading to checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 px-6 py-3 rounded-xl bg-[#C65D3B] text-white text-sm font-medium"
        >
          Browse Shop
        </button>
      </div>
    );
  }

  const pinStatus = validatePinCode(pincode);
  const shippingCharge = calculateShipping(cartSubtotal, pincode);
  const hasCustomItem = cart.some((i) => i.isCustom) || isPreOrderFlow;

  let couponDiscount = 0;
  if (appliedCoupon && cartSubtotal >= appliedCoupon.minOrder) {
    couponDiscount =
      appliedCoupon.discountType === 'percent'
        ? Math.round((cartSubtotal * appliedCoupon.discountValue) / 100)
        : appliedCoupon.discountValue;
  }
  const totalDiscount = Math.min(cartSubtotal, couponDiscount + referralDiscount);
  const grandTotal = Math.max(0, cartSubtotal + shippingCharge - totalDiscount);
  const codCheck = isCodEligible(grandTotal, hasCustomItem);

  const advancePaid =
    paymentMethod === 'COD'
      ? 0
      : hasCustomItem && use50Advance
      ? Math.round(grandTotal * 0.5)
      : grandTotal;
  const balanceDue = Math.max(0, grandTotal - advancePaid);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    try {
      const snap = await getDoc(doc(db, 'coupons', code));
      let found: Coupon | undefined;
      if (snap.exists()) {
        found = { id: snap.id, ...(snap.data() as Omit<Coupon, 'id'>) };
      } else {
        found = SEED_COUPONS.find((c) => c.code === code);
      }
      if (!found || !found.active) {
        showToast('Invalid or inactive coupon code.', 'error');
        return;
      }
      if (cartSubtotal < found.minOrder) {
        showToast(`Minimum order of ${formatINR(found.minOrder)} required for ${code}.`, 'error');
        return;
      }
      setAppliedCoupon(found);
      showToast(`Coupon ${code} applied!`, 'success');
    } catch {
      const fallback = SEED_COUPONS.find((c) => c.code === code);
      if (fallback && cartSubtotal >= fallback.minOrder) {
        setAppliedCoupon(fallback);
        showToast(`Coupon ${code} applied!`, 'success');
      } else {
        showToast('Could not validate coupon code.', 'error');
      }
    }
  };

  const handleApplyReferral = async () => {
    const code = referralInput.trim().toUpperCase();
    if (!code) return;
    if (profile?.referralCode === code) {
      showToast('You cannot apply your own referral code.', 'error');
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'referralCodes', code));
      if (snap.exists() && snap.data().active) {
        setReferralDiscount(150);
        showToast('Referral code verified! ₹150 off unlocked for you & your friend.', 'success');
      } else {
        showToast('Referral code not found.', 'error');
      }
    } catch {
      showToast('Sign in to validate referral codes.', 'info');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!isVerified) {
      showToast('Please verify your email address before placing an order.', 'error');
      return;
    }
    if (!pinStatus.valid) {
      showToast(pinStatus.message || 'Invalid PIN code.', 'error');
      return;
    }
    if (paymentMethod === 'COD' && !codCheck.eligible) {
      showToast(codCheck.reason || 'COD not eligible for this order.', 'error');
      return;
    }
    if (paymentMethod === 'UPI' && !proofFile) {
      showToast('Please upload your UPI payment screenshot to confirm.', 'error');
      return;
    }

    setPlacing(true);
    try {
      if (paymentMethod === 'Razorpay') {
        await initiateRazorpayPayment(advancePaid, fullName, user.email || '');
      }

      let paymentProofUrl: string | undefined;
      if (proofFile) {
        const err = validateImageFile(proofFile);
        if (err) throw new Error(err);
        paymentProofUrl = await uploadImageToStorage(proofFile, 'payment-proofs', user.uid);
      }

      const orderNumber = `AW-${Math.floor(100000 + Math.random() * 900000)}`;
      const costTotal = cart.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);
      const orderRef = doc(collection(db, 'orders'));

      const finalMethod: PaymentMethod =
        hasCustomItem && use50Advance && paymentMethod === 'UPI' ? 'Advance50' : paymentMethod;

      await setDoc(orderRef, {
        orderNumber,
        userId: user.uid,
        customerName: fullName.trim().slice(0, 100),
        ...(user.email ? { customerEmail: user.email } : {}),
        customerPhone: phone.trim().slice(0, 25),
        items: cart,
        subtotal: cartSubtotal,
        shippingCharge,
        discount: totalDiscount,
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        ...(referralDiscount > 0 ? { referralCodeUsed: referralInput.trim().toUpperCase() } : {}),
        total: grandTotal,
        costTotal,
        advancePaid,
        balanceDue,
        paymentMethod: finalMethod,
        paymentStatus:
          paymentMethod === 'COD'
            ? 'COD Pending'
            : hasCustomItem && use50Advance
            ? 'Advance Paid'
            : 'Pending Verification',
        ...(paymentProofUrl ? { paymentProofUrl } : {}),
        isAdvancePayment: hasCustomItem && use50Advance,
        shippingAddress: {
          id: `addr-${Date.now()}`,
          label: 'Shipping',
          fullName: fullName.trim(),
          phone: phone.trim(),
          line1: line1.trim(),
          line2: line2.trim(),
          city: city.trim(),
          state: stateName.trim(),
          pincode: pincode.trim(),
        },
        status: 'Paid',
        leadSource: 'Website',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Record referral reward if used
      if (referralDiscount > 0 && referralInput.trim()) {
        try {
          const refSnap = await getDoc(doc(db, 'referralCodes', referralInput.trim().toUpperCase()));
          if (refSnap.exists()) {
            await addDoc(collection(db, 'referrals'), {
              code: referralInput.trim().toUpperCase(),
              referrerUserId: refSnap.data().ownerId,
              refereeUserId: user.uid,
              discountAmount: 150,
              status: 'Rewarded',
              createdAt: serverTimestamp(),
            });
          }
        } catch {
          // non-blocking
        }
      }

      // Decrement Pre-Order slots if applicable
      if (isPreOrderFlow && siteSettings.preOrderSlotsLeft > 0) {
        try {
          await updateDoc(doc(db, 'siteSettings', 'main'), {
            preOrderSlotsLeft: increment(-1),
            updatedAt: serverTimestamp(),
          });
          refreshCatalog();
        } catch {
          // ignore if settings doc not yet seeded
        }
      }

      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: `Order #${orderNumber} Confirmed`,
        message: 'Our Dehradun studio received your order and will share dispatch updates soon.',
        type: 'order',
        read: false,
        link: '/account',
        createdAt: serverTimestamp(),
      });

      clearCart();
      navigate(`/order-confirmation/${orderRef.id}`, {
        state: {
          order: {
            id: orderRef.id,
            orderNumber,
            customerName: fullName,
            customerEmail: user.email,
            customerPhone: phone,
            items: cart,
            subtotal: cartSubtotal,
            shippingCharge,
            discount: totalDiscount,
            couponCode: appliedCoupon?.code,
            total: grandTotal,
            advancePaid,
            balanceDue,
            paymentMethod: finalMethod,
            paymentStatus: paymentMethod === 'COD' ? 'COD Pending' : 'Pending Verification',
            shippingAddress: {
              id: '1',
              label: 'Delivery',
              fullName,
              phone,
              line1,
              line2,
              city,
              state: stateName,
              pincode,
            },
            status: 'Paid',
          },
        },
      });
    } catch (error) {
      if (error instanceof Error && (error.message.includes('Razorpay') || error.message.includes('Image'))) {
        showToast(error.message, 'error');
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'orders');
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-24">
      <h1 className="font-serif text-3xl font-semibold mb-8">Studio Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Address */}
          <section className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-4">
            <h2 className="font-serif text-xl font-semibold">1. Delivery Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Street Address / Hostel / Campus *</label>
              <input
                type="text"
                required
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                placeholder="House no., street, or college campus"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">PIN Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm tabular-nums"
                />
              </div>
            </div>
            <p className={`text-xs ${pinStatus.valid ? 'text-[#5C724A] dark:text-[#9CAF88]' : 'text-[#C65D3B]'}`}>
              {pinStatus.valid ? pinStatus.region : pinStatus.message}
            </p>
          </section>

          {/* Payment Options */}
          <section className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-4">
            <h2 className="font-serif text-xl font-semibold">2. Payment Method</h2>

            {hasCustomItem && (
              <label className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#E3A72F]/12 border border-[#E3A72F]/40 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={use50Advance}
                  onChange={(e) => setUse50Advance(e.target.checked)}
                  className="accent-[#C65D3B]"
                />
                Pay 50% Advance Now ({formatINR(Math.round(grandTotal * 0.5))}) and remaining 50% when finished photos are shared.
              </label>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] cursor-pointer">
                <input
                  type="radio"
                  name="payMethod"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="mt-1 accent-[#C65D3B]"
                />
                <div className="flex-1 text-sm">
                  <span className="font-semibold">UPI Transfer (GPay / PhonePe / Paytm)</span>
                  <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] mt-1">
                    Scan or pay to UPI ID <strong className="text-[#1F1D1B] dark:text-[#F5EFE6]">artworn.dehradun@okaxis</strong> and upload payment screenshot below.
                  </p>
                  {paymentMethod === 'UPI' && (
                    <label className="mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-[#C65D3B]/60 text-xs cursor-pointer">
                      <ImagePlus className="w-4 h-4 text-[#C65D3B]" />
                      <span className="truncate">
                        {proofFile ? proofFile.name : `Upload screenshot of ${formatINR(advancePaid)} payment *`}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] ${
                  codCheck.eligible ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <input
                  type="radio"
                  name="payMethod"
                  disabled={!codCheck.eligible}
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 accent-[#C65D3B]"
                />
                <div className="text-sm">
                  <span className="font-semibold">Cash on Delivery (COD)</span>
                  <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] mt-0.5">
                    {codCheck.eligible ? 'Pay in cash or UPI upon delivery.' : codCheck.reason}
                  </p>
                </div>
              </label>

              {/* Clearly marked Razorpay Plug-in Slot */}
              <label className="flex items-start gap-3 p-4 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] cursor-pointer">
                <input
                  type="radio"
                  name="payMethod"
                  checked={paymentMethod === 'Razorpay'}
                  onChange={() => setPaymentMethod('Razorpay')}
                  className="mt-1 accent-[#C65D3B]"
                />
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#C65D3B]" />
                    <span className="font-semibold">Razorpay Cards / NetBanking / UPI</span>
                  </div>
                  <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] mt-0.5">
                    Plug-in gateway ready (uses <code className="text-[11px]">VITE_RAZORPAY_KEY_ID</code> when live).
                  </p>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <aside className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-serif text-xl font-semibold">Order Summary</h2>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={`${item.productId}-${item.size}-${item.color}`} className="flex justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">
                    {item.size} · {item.color} × {item.quantity}
                  </p>
                </div>
                <span className="font-medium tabular-nums shrink-0">{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Coupon & Referral */}
          <div className="pt-4 border-t border-[#E6DDD0] dark:border-[#2C2620] space-y-2.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-[#5C554E] absolute left-3 top-3" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon (e.g. ART10)"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs uppercase"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-xs font-medium hover:border-[#C65D3B]"
              >
                Apply
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
                placeholder="Friend's referral code (AW-...)"
                className="flex-1 px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs uppercase"
              />
              <button
                type="button"
                onClick={handleApplyReferral}
                className="px-4 py-2 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-xs font-medium hover:border-[#C65D3B]"
              >
                Verify
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6DDD0] dark:border-[#2C2620] space-y-2 text-sm tabular-nums">
            <div className="flex justify-between">
              <span className="text-[#5C554E] dark:text-[#B5ADA4]">Subtotal</span>
              <span>{formatINR(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C554E] dark:text-[#B5ADA4]">Shipping</span>
              <span>{shippingCharge === 0 ? 'Free' : formatINR(shippingCharge)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-[#5C724A] dark:text-[#9CAF88]">
                <span>Discounts</span>
                <span>-{formatINR(totalDiscount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#E6DDD0] dark:border-[#2C2620] flex justify-between font-semibold text-base">
              <span>Order Total</span>
              <span>{formatINR(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#C65D3B] font-medium">
              <span>Payable Now</span>
              <span>{formatINR(advancePaid)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={placing}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors disabled:opacity-60"
          >
            {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {placing ? 'Confirming Order...' : `Confirm Order · ${formatINR(advancePaid)}`}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#5C554E] dark:text-[#B5ADA4]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#9CAF88]" />
            Hand-crafted &amp; quality-checked in Dehradun before dispatch
          </p>
        </aside>
      </form>
    </div>
  );
};
