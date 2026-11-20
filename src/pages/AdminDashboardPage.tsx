import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Check,
  Database,
  Download,
  MessageSquare,
  Plus,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import { CustomRequestChat } from '../components/CustomRequestChat';
import { SafeImage } from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { db, handleFirestoreError, OperationType, uploadImageToStorage } from '../lib/firebase';
import { formatDate, formatINR } from '../lib/format';
import type {
  Coupon,
  CustomRequest,
  GalleryItem,
  Lead,
  LeadSource,
  LeadStatus,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  Review,
  SurveyResponse,
  UserProfile,
} from '../types';

type AdminTab =
  | 'overview'
  | 'requests'
  | 'orders'
  | 'products'
  | 'leads'
  | 'reviews'
  | 'surveys'
  | 'settings';

const STATUS_OPTIONS: OrderStatus[] = [
  'Enquiry',
  'Quote Sent',
  'Approved',
  'Paid',
  'In Progress',
  'Shipped',
  'Delivered',
  'Cancelled',
];

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '').replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const AdminDashboardPage: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const { products, galleryItems, siteSettings, refreshCatalog, seedStudioDatabase } = useStore();
  const { showToast } = useToast();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Active chat & quote modal state
  const [activeChatReqId, setActiveChatReqId] = useState<string | null>(null);
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, { price: string; dueDate: string }>>({});

  // Product editor state
  const [editingProd, setEditingProd] = useState<Partial<Product> | null>(null);
  const [prodImageUrls, setProdImageUrls] = useState('');

  // New Lead form
  const [leadForm, setLeadForm] = useState({
    name: '',
    contact: '',
    source: 'Instagram' as LeadSource,
    notes: '',
    estimatedValue: '2500',
  });

  // New Coupon form
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percent' as 'percent' | 'flat',
    discountValue: '10',
    minOrder: '999',
  });

  // New Gallery form
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: 'Denim Jackets' as GalleryItem['category'],
    technique: 'Hand-Painted Textile Acrylics',
    story: '',
    imageUrl: '',
  });

  // Site Settings draft
  const [bannerText, setBannerText] = useState(siteSettings.bannerText);
  const [bannerActive, setBannerActive] = useState(siteSettings.bannerActive);
  const [preOrderTitle, setPreOrderTitle] = useState(siteSettings.preOrderTitle);
  const [preOrderSlotsLeft, setPreOrderSlotsLeft] = useState(String(siteSettings.preOrderSlotsLeft));
  const [preOrderPrice, setPreOrderPrice] = useState(String(siteSettings.preOrderPrice));

  useEffect(() => {
    setBannerText(siteSettings.bannerText);
    setBannerActive(siteSettings.bannerActive);
    setPreOrderTitle(siteSettings.preOrderTitle);
    setPreOrderSlotsLeft(String(siteSettings.preOrderSlotsLeft));
    setPreOrderPrice(String(siteSettings.preOrderPrice));
  }, [siteSettings]);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const unsubs = [
      onSnapshot(
        collection(db, 'orders'),
        (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
      ),
      onSnapshot(
        collection(db, 'customRequests'),
        (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustomRequest))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'customRequests')
      ),
      onSnapshot(
        collection(db, 'users'),
        (snap) => setCustomers(snap.docs.map((d) => ({ ...d.data() } as UserProfile))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      ),
      onSnapshot(
        collection(db, 'reviews'),
        (snap) => setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'reviews')
      ),
      onSnapshot(
        collection(db, 'leads'),
        (snap) => setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lead))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'leads')
      ),
      onSnapshot(
        collection(db, 'surveyResponses'),
        (snap) => setSurveys(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SurveyResponse))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'surveyResponses')
      ),
      onSnapshot(
        collection(db, 'coupons'),
        (snap) => setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon))),
        (err) => handleFirestoreError(err, OperationType.LIST, 'coupons')
      ),
    ];

    return () => unsubs.forEach((u) => u());
  }, [user, isAdmin]);

  // Analytics Computations
  const metrics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'Cancelled');
    const revenue = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const totalCost = validOrders.reduce((acc, o) => acc + (o.costTotal || Math.round((o.total || 0) * 0.45)), 0);
    const netProfit = revenue - totalCost;
    const pendingReqs = requests.filter((r) => ['Enquiry', 'Quote Sent', 'Approved'].includes(r.status)).length;
    const convertedLeads = leads.filter((l) => l.status === 'Converted').length;
    const convRate = leads.length > 0 ? Math.round(((convertedLeads + validOrders.length) / (leads.length + validOrders.length)) * 100) : 100;
    return { revenue, netProfit, orderCount: validOrders.length, pendingReqs, customerCount: customers.length, convRate };
  }, [orders, requests, customers, leads]);

  const salesChartData = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      if (o.status === 'Cancelled') return;
      const label = formatDate(o.createdAt);
      const key = label === '—' ? 'Today' : label;
      map.set(key, (map.get(key) || 0) + (o.total || 0));
    });
    if (map.size === 0) {
      return [
        { date: 'Week 1', revenue: 6400 },
        { date: 'Week 2', revenue: 11800 },
        { date: 'Week 3', revenue: 15200 },
        { date: 'Week 4', revenue: 19400 },
      ];
    }
    return Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }));
  }, [orders]);

  const topProductsData = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((o) => {
      o.items?.forEach((it) => {
        const short = it.title.split(' ').slice(0, 2).join(' ');
        counts.set(short, (counts.get(short) || 0) + it.quantity);
      });
    });
    if (counts.size === 0) {
      return products.slice(0, 4).map((p, i) => ({
        name: p.title.split(' ').slice(0, 2).join(' '),
        units: Math.max(2, 12 - i * 2),
      }));
    }
    return Array.from(counts.entries())
      .map(([name, units]) => ({ name, units }))
      .slice(0, 6);
  }, [orders, products]);

  const leadSourceData = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => map.set(l.source, (map.get(l.source) || 0) + 1));
    if (map.size === 0) {
      return [
        { source: 'Instagram', count: 14 },
        { source: 'WhatsApp', count: 8 },
        { source: 'College Event', count: 6 },
        { source: 'Referral', count: 5 },
      ];
    }
    return Array.from(map.entries()).map(([source, count]) => ({ source, count }));
  }, [leads]);

  const surveyDiscoveryData = useMemo(() => {
    const map = new Map<string, number>();
    surveys.forEach((s) => map.set(s.discoverySource, (map.get(s.discoverySource) || 0) + 1));
    return Array.from(map.entries()).map(([channel, responses]) => ({ channel, responses }));
  }, [surveys]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-40 rounded-2xl bg-[#F3ECE2] dark:bg-[#1E1B18] animate-pulse" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-[#C65D3B] mx-auto" />
        <h1 className="font-serif text-3xl font-semibold mt-4">Studio Admin Access Only</h1>
        <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4]">
          This workspace is restricted to ArtWorn Dehradun studio administrators. Sign in with an admin account to manage orders, custom quotes, and analytics.
        </p>
      </div>
    );
  }

  // --- Handlers ---
  const handleSendQuote = async (req: CustomRequest) => {
    const draft = quoteDrafts[req.id];
    const price = Number(draft?.price || req.quotedPrice || req.estimatedMin);
    if (!price || price <= 0) {
      showToast('Enter a valid quote amount in INR.', 'error');
      return;
    }
    const advanceAmount = Math.round(price * 0.5);
    try {
      await updateDoc(doc(db, 'customRequests', req.id), {
        quotedPrice: price,
        advanceAmount,
        ...(draft?.dueDate ? { dueDate: draft.dueDate } : {}),
        status: 'Quote Sent',
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId: req.userId,
        title: `Quote Ready for "${req.theme}"`,
        message: `Your custom piece is quoted at ${formatINR(price)} (50% advance: ${formatINR(advanceAmount)}). Open Custom Requests to approve.`,
        type: 'quote',
        read: false,
        link: '/account?tab=requests',
        createdAt: serverTimestamp(),
      });
      showToast('Quote sent & customer notified!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customRequests/${req.id}`);
    }
  };

  const handleReqStatus = async (reqId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'customRequests', reqId), {
        status,
        updatedAt: serverTimestamp(),
      });
      showToast(`Custom request updated to ${status}.`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customRequests/${reqId}`);
    }
  };

  const handleOrderStatus = async (order: Order, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status,
        ...(status === 'Paid' ? { paymentStatus: 'Paid' } : {}),
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'notifications'), {
        userId: order.userId,
        title: `Order #${order.orderNumber} → ${status}`,
        message: `Your ArtWorn order status is now "${status}".`,
        type: 'order',
        read: false,
        link: '/account',
        createdAt: serverTimestamp(),
      });
      showToast(`Order #${order.orderNumber} marked ${status}.`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProd) return;
    const id = editingProd.id || `prod-${Date.now()}`;
    const imgs = prodImageUrls
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (imgs.length === 0) {
      showToast('Add at least one image URL or upload an image.', 'error');
      return;
    }

    const payload = {
      title: (editingProd.title || 'New Piece').trim().slice(0, 120),
      slug: (editingProd.slug || editingProd.title || 'piece').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: (editingProd.category || 'Denim Jackets') as ProductCategory,
      description: (editingProd.description || '').trim().slice(0, 2000),
      price: Number(editingProd.price) || 1499,
      compareAtPrice: Number(editingProd.compareAtPrice) || Number(editingProd.price) || 1499,
      costPrice: Number(editingProd.costPrice) || 700,
      colors: editingProd.colors?.length ? editingProd.colors : ['Classic Indigo'],
      sizes: editingProd.sizes?.length ? editingProd.sizes : ['S', 'M', 'L', 'XL'],
      images: imgs.slice(0, 8),
      occasion: editingProd.occasion || 'Everyday & Campus',
      isCustom: Boolean(editingProd.isCustom),
      featured: Boolean(editingProd.featured),
      stock: Number(editingProd.stock) || 5,
      deliveryDays: Number(editingProd.deliveryDays) || 7,
      rating: Number(editingProd.rating) || 4.9,
      reviewCount: Number(editingProd.reviewCount) || 1,
      active: editingProd.active !== false,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingProd.id) {
        await updateDoc(doc(db, 'products', id), payload);
      } else {
        await setDoc(doc(db, 'products', id), { ...payload, createdAt: serverTimestamp() });
      }
      setEditingProd(null);
      await refreshCatalog();
      showToast('Product saved to Firestore!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      await refreshCatalog();
      showToast('Product removed.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'leads'), {
        name: leadForm.name.trim(),
        contact: leadForm.contact.trim(),
        source: leadForm.source,
        notes: leadForm.notes.trim(),
        status: 'New' as LeadStatus,
        estimatedValue: Number(leadForm.estimatedValue) || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setLeadForm({ name: '', contact: '', source: 'Instagram', notes: '', estimatedValue: '2500' });
      showToast('Lead added to tracker.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'leads');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(
        doc(db, 'siteSettings', 'main'),
        {
          ...siteSettings,
          bannerText: bannerText.trim(),
          bannerActive,
          preOrderTitle: preOrderTitle.trim(),
          preOrderSlotsLeft: Math.max(0, Number(preOrderSlotsLeft) || 0),
          preOrderPrice: Math.max(0, Number(preOrderPrice) || 3299),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await refreshCatalog();
      showToast('Studio settings & Pre-Order updated!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'siteSettings/main');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E6DDD0] dark:border-[#2C2620]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">
            ArtWorn Studio Control
          </p>
          <h1 className="font-serif text-3xl font-semibold mt-1">Admin Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              await seedStudioDatabase();
              showToast('Sample catalog, gallery, coupons, and FAQs seeded!', 'success');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-xs font-medium hover:border-[#C65D3B]"
          >
            <Database className="w-3.5 h-3.5 text-[#C65D3B]" />
            Seed Sample Data
          </button>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                `artworn-orders-${new Date().toISOString().slice(0, 10)}.csv`,
                orders.map((o) => ({
                  OrderNumber: o.orderNumber,
                  Customer: o.customerName,
                  Phone: o.customerPhone || '',
                  Status: o.status,
                  PaymentMethod: o.paymentMethod,
                  TotalINR: o.total,
                  CostINR: o.costTotal || 0,
                  ProfitINR: (o.total || 0) - (o.costTotal || 0),
                  City: o.shippingAddress?.city || '',
                }))
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F1D1B] dark:bg-[#F5EFE6] text-white dark:text-[#141210] text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            Export Orders CSV
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
        {(
          [
            ['overview', 'Overview & Charts'],
            ['requests', `Custom Requests (${requests.length})`],
            ['orders', `Orders & Profit (${orders.length})`],
            ['products', `Products (${products.length})`],
            ['leads', `Lead Tracker (${leads.length})`],
            ['reviews', `Reviews (${reviews.length})`],
            ['surveys', `Surveys (${surveys.length})`],
            ['settings', 'Coupons, Gallery & Banner'],
          ] as [AdminTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              tab === id
                ? 'bg-[#C65D3B] text-white'
                : 'bg-[#F3ECE2] dark:bg-[#1E1B18] text-[#5C554E] dark:text-[#B5ADA4]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Revenue', val: formatINR(metrics.revenue) },
                { label: 'Est. Net Profit', val: formatINR(metrics.netProfit) },
                { label: 'Active Orders', val: String(metrics.orderCount) },
                { label: 'Pending Custom Req.', val: String(metrics.pendingReqs) },
                { label: 'Customers · Conv.', val: `${metrics.customerCount} · ${metrics.convRate}%` },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-5"
                >
                  <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">{kpi.label}</p>
                  <p className="font-serif text-2xl font-semibold mt-1 tabular-nums">{kpi.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-5">
                <h2 className="text-sm font-semibold mb-4">Sales Over Time (₹)</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6DDD0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#C65D3B" fill="#C65D3B" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-5">
                <h2 className="text-sm font-semibold mb-4">Top Pieces (Units)</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6DDD0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="units" fill="#E3A72F" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-5">
                <h2 className="text-sm font-semibold mb-4">Lead Sources</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadSourceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6DDD0" />
                      <XAxis dataKey="source" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#9CAF88" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM REQUESTS */}
        {tab === 'requests' && (
          <div className="space-y-5">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#C65D3B] font-medium">
                      {req.customerName} · {req.customerEmail || req.customerPhone} · Source: {req.leadSource || 'Website'}
                    </p>
                    <h3 className="font-serif text-xl font-semibold mt-0.5">
                      {req.theme} ({req.productType} · {req.style})
                    </h3>
                    <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] mt-1">
                      Size {req.size} · {req.color} · Budget {req.budgetRange} {req.neededByDate ? `· Needed by ${req.neededByDate}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={req.status}
                      onChange={(e) => handleReqStatus(req.id, e.target.value as OrderStatus)}
                      className="px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs font-medium"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setActiveChatReqId(activeChatReqId === req.id ? null : req.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-xs font-medium"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#C65D3B]" />
                      {activeChatReqId === req.id ? 'Hide Chat' : 'Open Chat'}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4]">{req.description}</p>

                {req.referenceImages?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {req.referenceImages.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-[#E6DDD0]">
                        <SafeImage src={src} alt="Reference" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {req.paymentProofUrl && (
                  <a href={req.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-[#C65D3B] underline">
                    View Customer 50% Advance Screenshot →
                  </a>
                )}

                {/* Send Quote Bar */}
                <div className="pt-3 border-t border-[#E6DDD0] dark:border-[#2C2620] flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    placeholder={`Quote ₹ (Est. ${req.estimatedMin})`}
                    value={quoteDrafts[req.id]?.price ?? (req.quotedPrice ? String(req.quotedPrice) : '')}
                    onChange={(e) =>
                      setQuoteDrafts((prev) => ({
                        ...prev,
                        [req.id]: { ...prev[req.id], price: e.target.value },
                      }))
                    }
                    className="w-44 px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs tabular-nums"
                  />
                  <input
                    type="date"
                    value={quoteDrafts[req.id]?.dueDate ?? req.dueDate ?? ''}
                    onChange={(e) =>
                      setQuoteDrafts((prev) => ({
                        ...prev,
                        [req.id]: { ...prev[req.id], dueDate: e.target.value },
                      }))
                    }
                    className="px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendQuote(req)}
                    className="px-4 py-2 rounded-xl bg-[#C65D3B] text-white text-xs font-medium"
                  >
                    Send Quote to Customer
                  </button>
                </div>

                {activeChatReqId === req.id && (
                  <CustomRequestChat requestId={req.id} requestOwnerUid={req.userId} senderRole="admin" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ORDERS & PROFIT TRACKER */}
        {tab === 'orders' && (
          <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse tabular-nums">
              <thead>
                <tr className="border-b border-[#E6DDD0] dark:border-[#2C2620] text-[#5C554E] dark:text-[#B5ADA4]">
                  <th className="p-4">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Selling (₹)</th>
                  <th className="p-4">Var. Cost (₹)</th>
                  <th className="p-4">Profit (₹)</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DDD0]/60 dark:divide-[#2C2620]">
                {orders.map((o) => {
                  const cost = o.costTotal || Math.round(o.total * 0.45);
                  const profit = o.total - cost;
                  return (
                    <tr key={o.id}>
                      <td className="p-4 font-semibold">
                        #{o.orderNumber}
                        <span className="block font-normal text-[#5C554E]">{formatDate(o.createdAt)}</span>
                      </td>
                      <td className="p-4">
                        {o.customerName}
                        <span className="block text-[#5C554E]">{o.shippingAddress?.city} · {o.customerPhone}</span>
                      </td>
                      <td className="p-4">
                        {o.paymentMethod}
                        {o.paymentProofUrl && (
                          <a href={o.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="block text-[#C65D3B] underline">
                            View Proof
                          </a>
                        )}
                      </td>
                      <td className="p-4 font-semibold">{formatINR(o.total)}</td>
                      <td className="p-4 text-[#5C554E]">{formatINR(cost)}</td>
                      <td className="p-4 font-semibold text-[#5C724A] dark:text-[#9CAF88]">{formatINR(profit)}</td>
                      <td className="p-4">
                        <select
                          value={o.status}
                          onChange={(e) => handleOrderStatus(o, e.target.value as OrderStatus)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27]"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingProd({
                    title: '',
                    category: 'Denim Jackets',
                    price: 2999,
                    costPrice: 1300,
                    stock: 5,
                    deliveryDays: 7,
                    featured: true,
                    active: true,
                  });
                  setProdImageUrls('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#C65D3B] text-white text-xs font-medium"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            {editingProd && (
              <form
                onSubmit={handleSaveProduct}
                className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#C65D3B]/40 p-6 space-y-4"
              >
                <h3 className="font-serif text-xl font-semibold">
                  {editingProd.id ? 'Edit Product' : 'New Product'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Product Title"
                    value={editingProd.title || ''}
                    onChange={(e) => setEditingProd({ ...editingProd, title: e.target.value })}
                    className="px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                  />
                  <select
                    value={editingProd.category || 'Denim Jackets'}
                    onChange={(e) => setEditingProd({ ...editingProd, category: e.target.value as ProductCategory })}
                    className="px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                  >
                    <option>Denim Jackets</option>
                    <option>T-Shirts</option>
                    <option>Tote Bags</option>
                    <option>Denim Pieces</option>
                    <option>Accessories</option>
                  </select>
                  <input
                    type="number"
                    required
                    placeholder="Selling Price (INR)"
                    value={editingProd.price || ''}
                    onChange={(e) => setEditingProd({ ...editingProd, price: Number(e.target.value) })}
                    className="px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <input
                    type="number"
                    placeholder="Cost Price (INR)"
                    value={editingProd.costPrice || ''}
                    onChange={(e) => setEditingProd({ ...editingProd, costPrice: Number(e.target.value) })}
                    className="px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={editingProd.stock ?? 5}
                    onChange={(e) => setEditingProd({ ...editingProd, stock: Number(e.target.value) })}
                    className="px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                  />
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProd.featured)}
                      onChange={(e) => setEditingProd({ ...editingProd, featured: e.target.checked })}
                    />
                    Featured on Home
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProd.isCustom)}
                      onChange={(e) => setEditingProd({ ...editingProd, isCustom: e.target.checked })}
                    />
                    Custom Commission
                  </label>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="Description"
                  value={editingProd.description || ''}
                  onChange={(e) => setEditingProd({ ...editingProd, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
                />
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Image URLs (one per line)"
                    value={prodImageUrls}
                    onChange={(e) => setProdImageUrls(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6DDD0] text-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#C65D3B]" />
                    Upload Photo to Storage
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const url = await uploadImageToStorage(f, 'catalog');
                          setProdImageUrls((prev) => (prev ? `${prev}\n${url}` : url));
                          showToast('Image uploaded!', 'success');
                        } catch (err) {
                          showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-5 py-2 rounded-xl bg-[#C65D3B] text-white text-xs font-medium">
                    Save Product
                  </button>
                  <button type="button" onClick={() => setEditingProd(null)} className="px-4 py-2 text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-4 flex gap-4 items-center"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <SafeImage src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#5C554E]">{p.category} · Stock {p.stock}</p>
                    <h4 className="text-sm font-semibold truncate">{p.title}</h4>
                    <p className="text-xs text-[#C65D3B] font-semibold tabular-nums mt-0.5">{formatINR(p.price)}</p>
                    <div className="mt-2 flex gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProd(p);
                          setProdImageUrls(p.images.join('\n'));
                        }}
                        className="text-[#C65D3B] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-[#5C554E] hover:text-[#C65D3B]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEADS */}
        {tab === 'leads' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleAddLead}
              className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-5 space-y-3 h-fit"
            >
              <h3 className="font-serif text-lg font-semibold">Log New Lead</h3>
              <input
                type="text"
                required
                placeholder="Lead Name"
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
              />
              <input
                type="text"
                required
                placeholder="Instagram Handle / Phone"
                value={leadForm.contact}
                onChange={(e) => setLeadForm({ ...leadForm, contact: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
              />
              <select
                value={leadForm.source}
                onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value as LeadSource })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
              >
                <option>Instagram</option>
                <option>WhatsApp</option>
                <option>College Event</option>
                <option>Referral</option>
                <option>Website</option>
                <option>Other</option>
              </select>
              <textarea
                rows={2}
                placeholder="Notes"
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
              />
              <button type="submit" className="w-full py-2 rounded-xl bg-[#C65D3B] text-white text-xs font-medium">
                Add Lead
              </button>
            </form>

            <div className="lg:col-span-8 space-y-3">
              {leads.map((l) => (
                <div
                  key={l.id}
                  className="rounded-xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-sm">{l.name} · {l.source}</p>
                    <p className="text-[#5C554E] dark:text-[#B5ADA4]">{l.contact} {l.notes ? `· ${l.notes}` : ''}</p>
                  </div>
                  <select
                    value={l.status}
                    onChange={async (e) => {
                      await updateDoc(doc(db, 'leads', l.id), {
                        status: e.target.value,
                        updatedAt: serverTimestamp(),
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27]"
                  >
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Quoted</option>
                    <option>Converted</option>
                    <option>Archived</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {tab === 'reviews' && (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-4 flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div>
                  <p className="font-semibold text-sm">
                    {rev.userName} · {rev.rating}/5 ★ ({rev.approved ? 'Approved' : 'Pending'})
                  </p>
                  <p className="text-[#5C554E] dark:text-[#B5ADA4] mt-1">{rev.comment}</p>
                </div>
                <div className="flex gap-2">
                  {!rev.approved && (
                    <button
                      type="button"
                      onClick={async () => {
                        await updateDoc(doc(db, 'reviews', rev.id), { approved: true });
                        showToast('Review approved!', 'success');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#9CAF88] text-[#141210] font-medium"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteDoc(doc(db, 'reviews', rev.id));
                      showToast('Review deleted.', 'info');
                    }}
                    className="p-1.5 rounded-lg border border-[#E6DDD0] text-[#5C554E] hover:text-[#C65D3B]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SURVEYS */}
        {tab === 'surveys' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-xl font-semibold">Validation Survey Insights ({surveys.length})</h2>
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    'artworn-survey-results.csv',
                    surveys.map((s) => ({
                      Favorites: s.favoriteProducts.join(' | '),
                      PriceRange: s.preferredPriceRange,
                      CustomizationInterest: s.customizationInterest,
                      Discovery: s.discoverySource,
                      Feedback: s.feedback || '',
                    }))
                  )
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F1D1B] text-white text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Export Survey CSV
              </button>
            </div>

            {surveyDiscoveryData.length > 0 && (
              <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-5 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={surveyDiscoveryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6DDD0" />
                    <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="responses" fill="#C65D3B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-3">
              {surveys.map((s) => (
                <div key={s.id} className="rounded-xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-4 text-xs space-y-1">
                  <p className="font-semibold">{s.favoriteProducts.join(', ')}</p>
                  <p className="text-[#5C554E] dark:text-[#B5ADA4]">
                    {s.preferredPriceRange} · {s.customizationInterest} · Found via {s.discoverySource}
                  </p>
                  {s.feedback && <p className="italic">&ldquo;{s.feedback}&rdquo;</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS, COUPONS, GALLERY */}
        {tab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleSaveSettings}
              className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-4"
            >
              <h2 className="font-serif text-xl font-semibold">Homepage Banner &amp; Pre-Order</h2>
              <label className="flex items-center gap-2 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={bannerActive}
                  onChange={(e) => setBannerActive(e.target.checked)}
                />
                Show top announcement banner
              </label>
              <input
                type="text"
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
              />
              <div>
                <label className="block text-xs font-medium mb-1">Pre-Order Campaign Title</label>
                <input
                  type="text"
                  value={preOrderTitle}
                  onChange={(e) => setPreOrderTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Slots Left</label>
                  <input
                    type="number"
                    value={preOrderSlotsLeft}
                    onChange={(e) => setPreOrderSlotsLeft(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Pre-Order Price (INR)</label>
                  <input
                    type="number"
                    value={preOrderPrice}
                    onChange={(e) => setPreOrderPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-xs"
                  />
                </div>
              </div>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#C65D3B] text-white text-xs font-medium">
                Save Studio Settings
              </button>
            </form>

            <div className="lg:col-span-6 space-y-6">
              {/* Coupons */}
              <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-4">
                <h2 className="font-serif text-xl font-semibold">Promo Coupons</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const code = couponForm.code.trim().toUpperCase();
                    if (!code) return;
                    await setDoc(doc(db, 'coupons', code), {
                      code,
                      discountType: couponForm.discountType,
                      discountValue: Number(couponForm.discountValue),
                      minOrder: Number(couponForm.minOrder) || 0,
                      active: true,
                    });
                    setCouponForm({ code: '', discountType: 'percent', discountValue: '10', minOrder: '999' });
                    showToast(`Coupon ${code} created!`, 'success');
                  }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  <input
                    type="text"
                    required
                    placeholder="CODE"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    className="px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] text-xs uppercase"
                  />
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as 'percent' | 'flat' })}
                    className="px-2 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] text-xs"
                  >
                    <option value="percent">% Off</option>
                    <option value="flat">₹ Off</option>
                  </select>
                  <input
                    type="number"
                    required
                    placeholder="Value"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] text-xs"
                  />
                  <button type="submit" className="px-3 py-2 rounded-xl bg-[#1F1D1B] text-white text-xs font-medium">
                    Add
                  </button>
                </form>

                <div className="space-y-2 text-xs">
                  {coupons.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210]">
                      <span>
                        <strong>{c.code}</strong> · {c.discountType === 'percent' ? `${c.discountValue}%` : formatINR(c.discountValue)} off (min {formatINR(c.minOrder)})
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteDoc(doc(db, 'coupons', c.id))}
                        className="text-[#5C554E] hover:text-[#C65D3B]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Gallery Add */}
              <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-3">
                <h2 className="font-serif text-xl font-semibold">Add Portfolio Gallery Item ({galleryItems.length})</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await addDoc(collection(db, 'galleryItems'), {
                      ...galleryForm,
                      featured: true,
                      createdAt: serverTimestamp(),
                    });
                    setGalleryForm({
                      title: '',
                      category: 'Denim Jackets',
                      technique: 'Hand-Painted Textile Acrylics',
                      story: '',
                      imageUrl: '',
                    });
                    await refreshCatalog();
                    showToast('Added to Gallery!', 'success');
                  }}
                  className="space-y-2.5"
                >
                  <input
                    type="text"
                    required
                    placeholder="Piece Title"
                    value={galleryForm.title}
                    onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Image URL"
                    value={galleryForm.imageUrl}
                    onChange={(e) => setGalleryForm({ ...galleryForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] text-xs"
                  />
                  <button type="submit" className="px-4 py-2 rounded-xl bg-[#C65D3B] text-white text-xs font-medium">
                    Publish Gallery Piece
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
