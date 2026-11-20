import type { CustomProductType, CustomStyle } from '../types';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatDate(value: unknown): string {
  if (!value) return '—';
  let date: Date | null = null;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    date = (value as { toDate: () => Date }).toDate();
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else if (value instanceof Date) {
    date = value;
  }
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function validatePinCode(pincode: string): { valid: boolean; region?: string; message?: string } {
  const clean = pincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(clean)) {
    return { valid: false, message: 'Enter a valid 6-digit Indian PIN code.' };
  }
  if (clean.startsWith('248') || clean.startsWith('249') || clean.startsWith('262') || clean.startsWith('263')) {
    return { valid: true, region: 'Uttarakhand Local Studio Dispatch (1–2 days)' };
  }
  if (clean.startsWith('11') || clean.startsWith('12') || clean.startsWith('20')) {
    return { valid: true, region: 'Delhi NCR Express (2–4 days)' };
  }
  return { valid: true, region: 'Pan-India Tracked Courier (4–7 days)' };
}

export function calculateShipping(subtotal: number, pincode: string): number {
  if (subtotal >= 1999) return 0;
  if (pincode.startsWith('248')) return 60; // Dehradun local flat rate
  return 110;
}

export function isCodEligible(total: number, hasCustomItem: boolean): { eligible: boolean; reason?: string } {
  if (hasCustomItem) {
    return { eligible: false, reason: 'Custom & pre-order pieces require 50% or 100% advance confirmation.' };
  }
  if (total > 3500) {
    return { eligible: false, reason: 'Cash on Delivery is available for ready-made orders up to ₹3,500.' };
  }
  return { eligible: true };
}

export function estimateCustomPrice(
  productType: CustomProductType,
  style: CustomStyle,
  hasText: boolean,
  isGift: boolean
): { min: number; max: number } {
  const baseMap: Record<CustomProductType, number> = {
    'Tote Bag': 799,
    'T-Shirt': 1099,
    'Denim Jeans': 2299,
    'Denim Jacket': 2699,
    Other: 1499,
  };
  const styleAdd: Record<CustomStyle, [number, number]> = {
    'Hand-Painted': [400, 900],
    Embroidery: [550, 1200],
    'Mixed Media': [750, 1500],
    'Patches & Embellishments': [450, 1000],
  };
  const base = baseMap[productType] || 1499;
  const [sMin, sMax] = styleAdd[style] || [400, 900];
  const extras = (hasText ? 150 : 0) + (isGift ? 99 : 0);
  return {
    min: base + sMin + extras,
    max: base + sMax + extras + 300,
  };
}
