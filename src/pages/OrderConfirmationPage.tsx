import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { CheckCircle2, Download, Mail } from 'lucide-react';
import { db } from '../lib/firebase';
import { formatINR } from '../lib/format';
import { generateInvoicePDF } from '../lib/invoicePdf';
import type { Order } from '../types';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const stateOrder = (location.state as { order?: Order } | null)?.order || null;
  const [order, setOrder] = useState<Order | null>(stateOrder);

  useEffect(() => {
    if (!order && orderId) {
      getDoc(doc(db, 'orders', orderId))
        .then((snap) => {
          if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order);
        })
        .catch(() => {});
    }
  }, [order, orderId]);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <CheckCircle2 className="w-12 h-12 text-[#9CAF88] mx-auto" />
        <h1 className="font-serif text-3xl font-semibold mt-4">Order Confirmed!</h1>
        <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4]">
          View your status timeline and invoice anytime from your Account.
        </p>
        <Link
          to="/account"
          className="mt-6 inline-block px-6 py-3 rounded-xl bg-[#C65D3B] text-white text-sm font-medium"
        >
          Go to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-6">
      <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 sm:p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-[#9CAF88] mx-auto" />
        <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B] mt-3">
          Order #{order.orderNumber} Confirmed
        </p>
        <h1 className="font-serif text-3xl font-semibold mt-1">Thank you, {order.customerName}!</h1>
        <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4]">
          We&apos;ve queued your piece in our Dehradun studio. Download your PDF invoice or track progress from your account.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => generateInvoicePDF(order)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F1D1B] dark:bg-[#F5EFE6] text-white dark:text-[#141210] text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download PDF Invoice
          </button>
          <Link
            to="/account"
            className="px-5 py-2.5 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-sm font-medium"
          >
            Track Order Status
          </Link>
        </div>
      </div>

      {/* Email-style Confirmation Preview */}
      <div className="rounded-2xl bg-[#FAF6F0] dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 text-xs font-medium text-[#5C554E] dark:text-[#B5ADA4] pb-4 border-b border-[#E6DDD0] dark:border-[#2C2620]">
          <Mail className="w-4 h-4 text-[#C65D3B]" />
          <span>Confirmation Receipt · Sent to {order.customerEmail || order.customerPhone || 'your account'}</span>
        </div>

        <div className="space-y-2.5 text-sm">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <span>
                {item.title} ({item.size}, {item.color}) × {item.quantity}
              </span>
              <span className="font-medium tabular-nums">{formatINR(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#E6DDD0] dark:border-[#2C2620] space-y-1.5 text-sm tabular-nums">
          <div className="flex justify-between text-[#5C554E] dark:text-[#B5ADA4]">
            <span>Shipping</span>
            <span>{order.shippingCharge === 0 ? 'Free' : formatINR(order.shippingCharge)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-[#5C724A]">
              <span>Discount</span>
              <span>-{formatINR(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base pt-1">
            <span>Total</span>
            <span>{formatINR(order.total)}</span>
          </div>
          <div className="flex justify-between text-xs text-[#C65D3B]">
            <span>Paid ({order.paymentMethod})</span>
            <span>{formatINR(order.advancePaid)}</span>
          </div>
          {order.balanceDue > 0 && (
            <div className="flex justify-between text-xs text-[#5C554E]">
              <span>Balance on Completion / Delivery</span>
              <span>{formatINR(order.balanceDue)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
