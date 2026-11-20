import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Bell,
  Camera,
  Check,
  Copy,
  Download,
  Heart,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Palette,
  Plus,
  RefreshCw,
  Share2,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import { CustomRequestChat } from '../components/CustomRequestChat';
import { SafeImage } from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { db, handleFirestoreError, OperationType, uploadImageToStorage, validateImageFile } from '../lib/firebase';
import { formatDate, formatINR } from '../lib/format';
import { generateInvoicePDF } from '../lib/invoicePdf';
import type { Address, CustomRequest, Order, OrderStatus } from '../types';

const STATUS_TIMELINE: OrderStatus[] = [
  'Enquiry',
  'Quote Sent',
  'Approved',
  'Paid',
  'In Progress',
  'Shipped',
  'Delivered',
];

export const AccountPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'orders';

  const {
    user,
    profile,
    loading,
    isAdmin,
    setAuthModalOpen,
    resendVerification,
    logout,
    updateUserProfile,
    deleteAccountAndData,
  } = useAuth();
  const {
    products,
    wishlistIds,
    savedDesigns,
    toggleWishlist,
    removeSavedDesign,
    notifications,
    markNotificationRead,
    addToCart,
  } = useStore();
  const { showToast } = useToast();

  const [tab, setTab] = useState(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [proofUploadReqId, setProofUploadReqId] = useState<string | null>(null);

  // Profile edit
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [prefs, setPrefs] = useState('');
  const [newAddr, setNewAddr] = useState<Partial<Address>>({
    label: 'Home',
    city: 'Dehradun',
    state: 'Uttarakhand',
  });
  const [showAddrForm, setShowAddrForm] = useState(false);

  // Post-delivery review modal
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revPhoto, setRevPhoto] = useState<File | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhone(profile.phone || '');
      setPrefs((profile.stylePreferences || []).join(', '));
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        setOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const unsubReqs = onSnapshot(
      query(collection(db, 'customRequests'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustomRequest));
        setRequests(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'customRequests')
    );

    return () => {
      unsubOrders();
      unsubReqs();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-48 rounded-2xl bg-[#F3ECE2] dark:bg-[#1E1B18] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <User className="w-12 h-12 text-[#C65D3B] mx-auto" />
        <h1 className="font-serif text-3xl font-semibold mt-4">Your Studio Account</h1>
        <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4]">
          Sign in to track orders, chat with our artist on custom quotes, manage your wishlist, and earn referral credits.
        </p>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="mt-6 px-6 py-3 rounded-xl bg-[#C65D3B] text-white text-sm font-medium"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        phone: phone.trim(),
        stylePreferences: prefs
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10),
      });
      showToast('Profile preferences saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save profile.', 'error');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr: Address = {
      id: `addr-${Date.now()}`,
      label: newAddr.label || 'Home',
      fullName: newAddr.fullName || displayName,
      phone: newAddr.phone || phone,
      line1: newAddr.line1 || '',
      line2: newAddr.line2 || '',
      city: newAddr.city || '',
      state: newAddr.state || '',
      pincode: newAddr.pincode || '',
      isDefault: (profile?.addresses?.length || 0) === 0,
    };
    const next = [...(profile?.addresses || []), addr].slice(0, 5);
    await updateUserProfile({ addresses: next });
    setShowAddrForm(false);
    setNewAddr({ label: 'Home', city: 'Dehradun', state: 'Uttarakhand' });
    showToast('Address added to your profile.', 'success');
  };

  const handleRemoveAddress = async (id: string) => {
    const next = (profile?.addresses || []).filter((a) => a.id !== id);
    await updateUserProfile({ addresses: next });
    showToast('Address removed.', 'info');
  };

  const handleApproveQuote = async (req: CustomRequest) => {
    try {
      await updateDoc(doc(db, 'customRequests', req.id), {
        status: 'Approved',
        updatedAt: serverTimestamp(),
      });
      showToast('Quote approved! Pay 50% advance to start studio painting.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customRequests/${req.id}`);
    }
  };

  const handleAdvanceProofUpload = async (req: CustomRequest, file: File) => {
    const err = validateImageFile(file);
    if (err) {
      showToast(err, 'error');
      return;
    }
    setProofUploadReqId(req.id);
    try {
      const url = await uploadImageToStorage(file, 'payment-proofs', user.uid);
      await updateDoc(doc(db, 'customRequests', req.id), {
        status: 'Paid',
        paymentProofUrl: url,
        updatedAt: serverTimestamp(),
      });
      showToast('50% Advance payment proof uploaded! Painting slot reserved.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customRequests/${req.id}`);
    } finally {
      setProofUploadReqId(null);
    }
  };

  const handlePostDeliveryReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;
    try {
      let photoUrl: string | undefined;
      if (revPhoto) {
        photoUrl = await uploadImageToStorage(revPhoto, 'reviews', user.uid);
      }
      await addDoc(collection(db, 'reviews'), {
        productId: reviewOrder.items[0]?.productId || 'custom',
        orderId: reviewOrder.id,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'ArtWorn Patron',
        rating: revRating,
        comment: revComment.trim(),
        ...(photoUrl ? { photoUrl } : {}),
        approved: false,
        createdAt: serverTimestamp(),
      });
      setReviewOrder(null);
      setRevComment('');
      setRevPhoto(null);
      showToast('Thank you! Your review has been sent for studio verification.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    }
  };

  const wishedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6DDD0] dark:border-[#2C2620]">
        <div>
          <p className="text-xs font-medium text-[#C65D3B]">
            Patron Account {isAdmin && '· Studio Admin'}
          </p>
          <h1 className="font-serif text-3xl font-semibold mt-0.5">
            Namaste, {profile?.displayName || user.displayName || 'Friend'}
          </h1>
          <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] mt-1">
            {user.email || user.phoneNumber}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <Link
              to="/admin"
              className="px-4 py-2 rounded-xl bg-[#1F1D1B] dark:bg-[#F5EFE6] text-white dark:text-[#141210] text-xs font-medium"
            >
              Open Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-xs font-medium hover:border-[#C65D3B]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Email Verification Alert */}
      {user.email && !user.emailVerified && (
        <div className="mt-6 rounded-xl bg-[#E3A72F]/15 border border-[#E3A72F]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span>
            Please verify your email address ({user.email}) so you can place orders and send custom requests.
          </span>
          <button
            type="button"
            onClick={async () => {
              await resendVerification();
              showToast('Verification email resent!', 'success');
            }}
            className="inline-flex items-center gap-1.5 font-semibold text-[#C65D3B] hover:underline shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Resend Email
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
          { id: 'requests', label: `Custom Requests (${requests.length})`, icon: Palette },
          { id: 'wishlist', label: `Wishlist (${wishedProducts.length})`, icon: Heart },
          { id: 'referrals', label: 'Referrals', icon: Share2 },
          { id: 'notifications', label: `Notifications (${notifications.filter((n) => !n.read).length})`, icon: Bell },
          { id: 'profile', label: 'Profile & Settings', icon: User },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                tab === t.id
                  ? 'bg-[#C65D3B] text-white'
                  : 'bg-[#F3ECE2] dark:bg-[#1E1B18] text-[#5C554E] dark:text-[#B5ADA4]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {/* 1. ORDERS TAB */}
        {tab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-12 text-center">
                <Package className="w-10 h-10 text-[#C65D3B]/60 mx-auto" />
                <p className="font-serif text-xl font-medium mt-3">No orders placed yet</p>
                <Link
                  to="/shop"
                  className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium"
                >
                  Explore Shop
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const currentIdx = STATUS_TIMELINE.indexOf(order.status);
                return (
                  <div
                    key={order.id}
                    className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E6DDD0] dark:border-[#2C2620]">
                      <div>
                        <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">
                          Order #{order.orderNumber} · {formatDate(order.createdAt)}
                        </p>
                        <p className="text-base font-semibold mt-0.5 tabular-nums">
                          {formatINR(order.total)} · {order.status}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => generateInvoicePDF(order)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-xs font-medium hover:border-[#C65D3B]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF Invoice
                        </button>
                        {order.status === 'Delivered' && (
                          <button
                            type="button"
                            onClick={() => setReviewOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C65D3B] text-white text-xs font-medium"
                          >
                            <Star className="w-3.5 h-3.5" />
                            Write Photo Review
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 7-Stage Status Timeline */}
                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                      {STATUS_TIMELINE.map((st, idx) => {
                        const done = currentIdx >= idx;
                        return (
                          <div key={st} className="text-center">
                            <div
                              className={`h-1.5 rounded-full mb-1.5 ${
                                done ? 'bg-[#9CAF88]' : 'bg-[#E6DDD0] dark:bg-[#2C2620]'
                              }`}
                            />
                            <span
                              className={`text-[10px] font-medium block ${
                                done ? 'text-[#1F1D1B] dark:text-[#F5EFE6]' : 'text-[#5C554E] dark:text-[#B5ADA4]'
                              }`}
                            >
                              {st}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-2 text-xs text-[#5C554E] dark:text-[#B5ADA4]">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {item.title} ({item.size}, {item.color}) × {item.quantity}
                          </span>
                          <span className="tabular-nums font-medium text-[#1F1D1B] dark:text-[#F5EFE6]">
                            {formatINR(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2. CUSTOM REQUESTS TAB */}
        {tab === 'requests' && (
          <div className="space-y-6">
            {requests.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-12 text-center">
                <Palette className="w-10 h-10 text-[#C65D3B]/60 mx-auto" />
                <p className="font-serif text-xl font-medium mt-3">No custom commissions yet</p>
                <Link
                  to="/custom-studio"
                  className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium"
                >
                  Send Us Your Idea
                </Link>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-[#C65D3B] font-medium">
                        {req.productType} · {req.style} · Status: {req.status}
                      </p>
                      <h2 className="font-serif text-xl font-semibold mt-0.5">{req.theme}</h2>
                      <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] mt-1">
                        Size {req.size} · {req.color} · Est. {formatINR(req.estimatedMin)}–{formatINR(req.estimatedMax)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {req.quotedPrice && (
                        <div className="px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs">
                          <span className="text-[#5C554E]">Studio Quote: </span>
                          <strong className="text-[#C65D3B] tabular-nums">{formatINR(req.quotedPrice)}</strong>
                          {req.dueDate && <span className="ml-2 text-[#5C554E]">· Ready by {req.dueDate}</span>}
                        </div>
                      )}

                      {req.status === 'Quote Sent' && (
                        <button
                          type="button"
                          onClick={() => handleApproveQuote(req)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#9CAF88] text-[#141210] text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve Quote
                        </button>
                      )}

                      {req.status === 'Approved' && (
                        <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C65D3B] text-white text-xs font-medium cursor-pointer">
                          <Camera className="w-3.5 h-3.5" />
                          {proofUploadReqId === req.id
                            ? 'Uploading...'
                            : `Pay 50% Advance (${formatINR(req.advanceAmount || Math.round((req.quotedPrice || req.estimatedMin) * 0.5))})`}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleAdvanceProofUpload(req, f);
                            }}
                          />
                        </label>
                      )}

                      <button
                        type="button"
                        onClick={() => setOpenChatId(openChatId === req.id ? null : req.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-xs font-medium"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#C65D3B]" />
                        {openChatId === req.id ? 'Hide Chat' : 'Artist Chat'}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4]">{req.description}</p>

                  {req.referenceImages?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {req.referenceImages.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-[#E6DDD0]">
                          <SafeImage src={img} alt="Reference" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}

                  {openChatId === req.id && (
                    <CustomRequestChat
                      requestId={req.id}
                      requestOwnerUid={req.userId}
                      senderRole="customer"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. WISHLIST & SAVED DESIGNS */}
        {tab === 'wishlist' && (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-xl font-semibold mb-4">Saved Pieces</h2>
              {wishedProducts.length === 0 ? (
                <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4]">No saved pieces yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wishedProducts.map((p) => (
                    <div key={p.id} className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] overflow-hidden">
                      <div className="aspect-[4/3]">
                        <SafeImage src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <Link to={`/product/${p.id}`} className="text-sm font-semibold hover:text-[#C65D3B]">
                            {p.title}
                          </Link>
                          <p className="text-xs text-[#C65D3B] tabular-nums mt-0.5">{formatINR(p.price)}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              addToCart({
                                productId: p.id,
                                title: p.title,
                                image: p.images[0],
                                price: p.price,
                                costPrice: p.costPrice ?? 1000,
                                size: p.sizes[0] || 'M',
                                color: p.colors[0] || 'Default',
                                quantity: 1,
                              })
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#C65D3B] text-white text-xs font-medium"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(p.id)}
                            aria-label="Remove from wishlist"
                            className="p-1.5 rounded-lg border border-[#E6DDD0] dark:border-[#332D27]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-serif text-xl font-semibold mb-4">Saved Custom Studio Ideas</h2>
              {savedDesigns.length === 0 ? (
                <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4]">
                  Save a draft inside the Custom Studio to keep your ideas here.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedDesigns.map((d) => (
                    <div key={d.id} className="rounded-xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-4 flex justify-between gap-4">
                      <div>
                        <p className="text-xs text-[#C65D3B]">{d.productType} · {d.style} · {d.color}</p>
                        <h3 className="font-semibold text-sm mt-0.5">{d.title}</h3>
                        <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] mt-1">{d.notes}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSavedDesign(d.id)}
                        aria-label="Delete saved design"
                        className="text-[#5C554E] hover:text-[#C65D3B] self-start"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. REFERRAL PROGRAM */}
        {tab === 'referrals' && (
          <div className="max-w-2xl rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 sm:p-8 space-y-5">
            <h2 className="font-serif text-2xl font-semibold">Gift Friends ₹150, Earn ₹150</h2>
            <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
              Share your unique studio code with classmates and friends. They receive ₹150 off their first order, and you earn ₹150 in studio credits when they check out.
            </p>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27]">
              <code className="flex-1 text-lg font-semibold tracking-wider text-[#C65D3B]">
                {profile?.referralCode || 'AW-STUDIO'}
              </code>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(profile?.referralCode || '');
                  showToast('Referral code copied!', 'success');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F1D1B] dark:bg-[#F5EFE6] text-white dark:text-[#141210] text-xs font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Code
              </button>
            </div>
            <div className="text-sm">
              <span className="text-[#5C554E] dark:text-[#B5ADA4]">Available Referral Credits: </span>
              <strong className="tabular-nums text-[#C65D3B]">{formatINR(profile?.referralCredits || 0)}</strong>
            </div>
          </div>
        )}

        {/* 5. NOTIFICATIONS */}
        {tab === 'notifications' && (
          <div className="max-w-2xl space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4]">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-xl border p-4 flex items-start justify-between gap-4 ${
                    n.read
                      ? 'bg-white dark:bg-[#1E1B18] border-[#E6DDD0] dark:border-[#2C2620]'
                      : 'bg-[#C65D3B]/6 border-[#C65D3B]/40'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] mt-1">{n.message}</p>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className="text-xs font-medium text-[#C65D3B] hover:underline shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 6. PROFILE & SETTINGS */}
        {tab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleSaveProfile}
              className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-4"
            >
              <h2 className="font-serif text-xl font-semibold">Profile &amp; Style Preferences</h2>
              <div>
                <label className="block text-xs font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Style Preferences (comma separated)</label>
                <input
                  type="text"
                  value={prefs}
                  onChange={(e) => setPrefs(e.target.value)}
                  placeholder="Oversized Denim, Botanical Florals, Earthy Tones"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium"
              >
                Save Changes
              </button>
            </form>

            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-xl font-semibold">Saved Addresses</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddrForm((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#C65D3B]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Address
                  </button>
                </div>

                {showAddrForm && (
                  <form onSubmit={handleAddAddress} className="space-y-3 pt-2 border-t border-[#E6DDD0] dark:border-[#2C2620]">
                    <input
                      type="text"
                      required
                      placeholder="Street / Hostel Address"
                      value={newAddr.line1 || ''}
                      onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={newAddr.city || ''}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={newAddr.state || ''}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
                      />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="PIN"
                        value={newAddr.pincode || ''}
                        onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
                      />
                    </div>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-[#1F1D1B] text-white text-xs font-medium">
                      Save Address
                    </button>
                  </form>
                )}

                <div className="space-y-2.5">
                  {(profile?.addresses || []).length === 0 ? (
                    <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">No saved addresses yet.</p>
                  ) : (
                    profile?.addresses?.map((addr) => (
                      <div key={addr.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] text-xs">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#C65D3B] mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold">{addr.label} · {addr.fullName}</p>
                            <p className="text-[#5C554E] dark:text-[#B5ADA4]">{addr.line1}, {addr.city} - {addr.pincode}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddress(addr.id)}
                          aria-label="Delete address"
                          className="text-[#5C554E] hover:text-[#C65D3B]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Account Deletion */}
              <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#C65D3B]/30 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-[#C65D3B]">Delete Account &amp; Data</h3>
                <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">
                  Permanently erase your ArtWorn profile, saved addresses, and wishlist from our database.
                </p>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 rounded-xl border border-[#C65D3B]/50 text-[#C65D3B] text-xs font-medium"
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteAccountAndData();
                          showToast('Your account and data have been deleted.', 'info');
                        } catch (err) {
                          showToast(err instanceof Error ? err.message : 'Unable to delete account.', 'error');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[#C65D3B] text-white text-xs font-medium"
                    >
                      Confirm Permanent Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-2 text-xs text-[#5C554E]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post-Delivery Photo Review Modal */}
      {reviewOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          onClick={() => setReviewOrder(null)}
        >
          <form
            onSubmit={handlePostDeliveryReview}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] p-6 space-y-4"
          >
            <h3 className="font-serif text-xl font-semibold">Review Order #{reviewOrder.orderNumber}</h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRevRating(n)} aria-label={`Rate ${n}`}>
                  <Star className={`w-5 h-5 ${n <= revRating ? 'fill-[#E3A72F] text-[#E3A72F]' : 'text-[#E6DDD0]'}`} />
                </button>
              ))}
            </div>
            <textarea
              required
              rows={3}
              value={revComment}
              onChange={(e) => setRevComment(e.target.value)}
              placeholder="Share how it looks and fits..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
            />
            <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-[#E6DDD0] text-xs cursor-pointer">
              <Camera className="w-4 h-4 text-[#C65D3B]" />
              <span>{revPhoto ? revPhoto.name : 'Upload photo (max 5MB)'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setRevPhoto(e.target.files?.[0] || null)} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReviewOrder(null)} className="px-4 py-2 text-xs">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-[#C65D3B] text-white text-xs font-medium">
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
