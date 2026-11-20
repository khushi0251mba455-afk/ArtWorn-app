import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../lib/format';
import { SafeImage } from './SafeImage';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartOpen, setCartOpen, updateCartQty, removeFromCart, cartSubtotal } = useStore();

  if (!cartOpen) return null;

  const freeShippingThreshold = 1999;
  const remaining = Math.max(0, freeShippingThreshold - cartSubtotal);
  const progress = Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      onClick={() => setCartOpen(false)}
    >
      <div
        className="w-full max-w-md h-full bg-[#FAF6F0] dark:bg-[#141210] text-[#1F1D1B] dark:text-[#F5EFE6] border-l border-[#E6DDD0] dark:border-[#332D27] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E6DDD0] dark:border-[#332D27] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C65D3B]" />
            <h2 className="font-serif text-lg font-semibold">Your Studio Bag</h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close bag"
            className="p-2 rounded-lg hover:bg-[#F3ECE2] dark:hover:bg-[#25211D]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping meter */}
        <div className="px-6 py-3 bg-[#F3ECE2]/60 dark:bg-[#1E1B18] border-b border-[#E6DDD0] dark:border-[#332D27]">
          <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">
            {remaining === 0
              ? 'You unlocked free insured Pan-India shipping!'
              : `Add ${formatINR(remaining)} more for free Pan-India shipping.`}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#E6DDD0] dark:bg-[#332D27] overflow-hidden">
            <div
              className="h-full bg-[#9CAF88] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-[#C65D3B]/50 mb-3" />
              <p className="font-serif text-lg font-medium">Your bag is waiting for art</p>
              <p className="text-sm text-[#5C554E] dark:text-[#B5ADA4] mt-1 max-w-xs">
                Explore hand-painted jackets, embroidered tees, or start a one-of-one commission.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/shop');
                }}
                className="mt-5 px-5 py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors"
              >
                Explore Shop
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.size}-${item.color}`}
                className="flex gap-3.5 pb-4 border-b border-[#E6DDD0] dark:border-[#332D27]"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F3ECE2] dark:bg-[#25211D] shrink-0">
                  <SafeImage src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold truncate">{item.title}</h3>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.size, item.color)}
                      aria-label={`Remove ${item.title}`}
                      className="text-[#5C554E] hover:text-[#C65D3B] p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] mt-0.5">
                    {item.size} · {item.color}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-[#E6DDD0] dark:border-[#3A332C]">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.size, item.color, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="p-1.5 hover:bg-[#F3ECE2] dark:hover:bg-[#25211D]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-medium tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.size, item.color, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="p-1.5 hover:bg-[#F3ECE2] dark:hover:bg-[#25211D]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-[#E6DDD0] dark:border-[#332D27] bg-white dark:bg-[#1E1B18] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#5C554E] dark:text-[#B5ADA4]">Subtotal</span>
              <span className="font-semibold text-base tabular-nums">{formatINR(cartSubtotal)}</span>
            </div>
            <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4]">
              Coupons, referral credits, and PIN-code shipping calculated at checkout.
            </p>
            <button
              type="button"
              onClick={() => {
                setCartOpen(false);
                navigate('/checkout');
              }}
              className="w-full py-3 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
