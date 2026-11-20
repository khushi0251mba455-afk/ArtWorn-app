export type UserRole = 'customer' | 'admin';

export type OrderStatus =
  | 'Enquiry'
  | 'Quote Sent'
  | 'Approved'
  | 'Paid'
  | 'In Progress'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  referralCode?: string;
  referredBy?: string;
  referralCredits?: number;
  stylePreferences?: string[];
  addresses?: Address[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ProductCategory =
  | 'Denim Jackets'
  | 'T-Shirts'
  | 'Tote Bags'
  | 'Denim Pieces'
  | 'Accessories';

export interface Product {
  id: string;
  title: string;
  slug: string;
  category: ProductCategory;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  colors: string[];
  sizes: string[];
  images: string[];
  occasion: string;
  isCustom: boolean;
  featured: boolean;
  stock: number;
  deliveryDays: number;
  rating: number;
  reviewCount: number;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  productId: string;
  title: string;
  image: string;
  price: number;
  costPrice: number;
  size: string;
  color: string;
  quantity: number;
  isCustom?: boolean;
  customRequestId?: string;
  customNote?: string;
}

export type CustomProductType = 'T-Shirt' | 'Denim Jacket' | 'Tote Bag' | 'Denim Jeans' | 'Other';
export type CustomStyle = 'Hand-Painted' | 'Embroidery' | 'Mixed Media' | 'Patches & Embellishments';

export interface CustomRequest {
  id: string;
  userId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  productType: CustomProductType;
  size: string;
  color: string;
  style: CustomStyle;
  theme: string;
  customText?: string;
  preferredColors?: string;
  occasion?: string;
  description: string;
  referenceImages: string[];
  budgetRange: string;
  neededByDate?: string;
  isGift: boolean;
  giftMessage?: string;
  estimatedMin: number;
  estimatedMax: number;
  quotedPrice?: number;
  advanceAmount?: number;
  leadSource?: string;
  status: OrderStatus;
  dueDate?: string;
  paymentProofUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CustomMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text?: string;
  imageUrl?: string;
  createdAt?: unknown;
}

export type PaymentMethod = 'UPI' | 'COD' | 'Razorpay' | 'Advance50';
export type PaymentStatus = 'Pending Verification' | 'Advance Paid' | 'Paid' | 'COD Pending';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  shippingCharge: number;
  discount: number;
  couponCode?: string;
  referralCodeUsed?: string;
  total: number;
  costTotal: number;
  advancePaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProofUrl?: string;
  isAdvancePayment?: boolean;
  shippingAddress: Address;
  status: OrderStatus;
  customRequestId?: string;
  leadSource?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Review {
  id: string;
  productId: string;
  orderId?: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  photoUrl?: string;
  approved: boolean;
  createdAt?: unknown;
}

export interface SavedDesign {
  id: string;
  title: string;
  productType: CustomProductType;
  style: CustomStyle;
  color: string;
  notes: string;
  savedAt: string;
}

export interface WishlistDoc {
  userId: string;
  productIds: string[];
  savedDesigns?: SavedDesign[];
  updatedAt?: unknown;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrder: number;
  active: boolean;
  expiresAt?: string;
}

export interface SurveyResponse {
  id: string;
  userId?: string;
  favoriteProducts: string[];
  preferredPriceRange: string;
  customizationInterest: string;
  discoverySource: string;
  feedback?: string;
  createdAt?: unknown;
}

export type LeadSource = 'Instagram' | 'WhatsApp' | 'College Event' | 'Referral' | 'Website' | 'Other';
export type LeadStatus = 'New' | 'Contacted' | 'Quoted' | 'Converted' | 'Archived';

export interface Lead {
  id: string;
  name: string;
  contact: string;
  source: LeadSource;
  notes?: string;
  status: LeadStatus;
  estimatedValue?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Denim Jackets' | 'T-Shirts' | 'Tote Bags' | 'Denim Pieces';
  imageUrl: string;
  beforeImageUrl?: string;
  story?: string;
  technique: string;
  featured: boolean;
  createdAt?: unknown;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'quote' | 'message' | 'promo';
  read: boolean;
  link?: string;
  createdAt?: unknown;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface SiteSettings {
  bannerText: string;
  bannerActive: boolean;
  preOrderTitle: string;
  preOrderSubtitle: string;
  preOrderEndsAt: string;
  preOrderSlotsTotal: number;
  preOrderSlotsLeft: number;
  preOrderPrice: number;
  faqs: FAQItem[];
  updatedAt?: unknown;
}
