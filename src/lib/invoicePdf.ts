import { jsPDF } from 'jspdf';
import type { Order } from '../types';
import { formatDate } from './format';

export function generateInvoicePDF(order: Order): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(198, 93, 59); // Terracotta #C65D3B
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setTextColor(250, 246, 240);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ArtWorn', 16, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Turn your style into art  |  Rajpur Road, Dehradun, Uttarakhand 248001', 16, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TAX INVOICE', pageWidth - 16, 17, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`#${order.orderNumber}`, pageWidth - 16, 25, { align: 'right' });

  // Customer & Order metadata
  doc.setTextColor(31, 29, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Billed & Shipped To:', 16, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(order.shippingAddress?.fullName || order.customerName, 16, 54);
  doc.text(order.shippingAddress?.line1 || '', 16, 60);
  if (order.shippingAddress?.line2) {
    doc.text(order.shippingAddress.line2, 16, 66);
  }
  doc.text(
    `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}`,
    16,
    order.shippingAddress?.line2 ? 72 : 66
  );
  doc.text(`Phone: ${order.shippingAddress?.phone || order.customerPhone || '—'}`, 16, order.shippingAddress?.line2 ? 78 : 72);

  doc.setFont('helvetica', 'bold');
  doc.text('Order Summary:', 125, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(order.createdAt) === '—' ? new Date().toLocaleDateString('en-IN') : formatDate(order.createdAt)}`, 125, 54);
  doc.text(`Status: ${order.status}`, 125, 60);
  doc.text(`Payment: ${order.paymentMethod} (${order.paymentStatus})`, 125, 66);

  // Table header
  let y = 94;
  doc.setFillColor(243, 236, 226);
  doc.rect(16, y - 6, pageWidth - 32, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Item', 18, y);
  doc.text('Variant', 102, y);
  doc.text('Qty', 142, y, { align: 'right' });
  doc.text('Amount (INR)', pageWidth - 18, y, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  order.items.forEach((item) => {
    const title = item.title.length > 42 ? `${item.title.slice(0, 39)}...` : item.title;
    doc.text(title, 18, y);
    doc.text(`${item.size} / ${item.color}`, 102, y);
    doc.text(String(item.quantity), 142, y, { align: 'right' });
    doc.text(`Rs. ${(item.price * item.quantity).toLocaleString('en-IN')}`, pageWidth - 18, y, { align: 'right' });
    y += 8;
  });

  // Totals block
  y += 6;
  doc.setDrawColor(220, 212, 200);
  doc.line(16, y, pageWidth - 16, y);
  y += 10;

  const rightLabelX = 138;
  const rightValX = pageWidth - 18;

  doc.text('Subtotal:', rightLabelX, y);
  doc.text(`Rs. ${order.subtotal.toLocaleString('en-IN')}`, rightValX, y, { align: 'right' });
  y += 7;

  doc.text('Shipping:', rightLabelX, y);
  doc.text(order.shippingCharge === 0 ? 'Free' : `Rs. ${order.shippingCharge.toLocaleString('en-IN')}`, rightValX, y, { align: 'right' });
  y += 7;

  if (order.discount > 0) {
    doc.text(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}:`, rightLabelX, y);
    doc.text(`-Rs. ${order.discount.toLocaleString('en-IN')}`, rightValX, y, { align: 'right' });
    y += 7;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total:', rightLabelX, y + 2);
  doc.text(`Rs. ${order.total.toLocaleString('en-IN')}`, rightValX, y + 2, { align: 'right' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Paid Now:', rightLabelX, y);
  doc.text(`Rs. ${order.advancePaid.toLocaleString('en-IN')}`, rightValX, y, { align: 'right' });
  y += 6;
  doc.text('Balance Due:', rightLabelX, y);
  doc.text(`Rs. ${order.balanceDue.toLocaleString('en-IN')}`, rightValX, y, { align: 'right' });

  // Care instructions footer
  doc.setTextColor(92, 85, 78);
  doc.setFontSize(8.5);
  doc.text('Wash Care: Gentle cold hand-wash inside out. Do not scrub or bleach painted artwork. Steam iron on reverse.', 16, 268);
  doc.text('Thank you for supporting independent hand-crafted wearable art from Dehradun.', 16, 274);

  doc.save(`ArtWorn-Invoice-${order.orderNumber}.pdf`);
}
