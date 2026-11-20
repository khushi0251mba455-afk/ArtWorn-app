import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Bell,
  Home,
  Images,
  Moon,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Store,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar: React.FC = () => {
  const { user, isAdmin, setAuthModalOpen } = useAuth();
  const { cartCount, setCartOpen, siteSettings, unreadNotificationsCount } = useStore();
  const { dark, toggleTheme } = useTheme();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
      isActive
        ? 'text-[#C65D3B] border-b-2 border-[#C65D3B]'
        : 'text-[#5C554E] dark:text-[#B5ADA4] hover:text-[#1F1D1B] dark:hover:text-[#F5EFE6]'
    }`;

  return (
    <>
      {siteSettings.bannerActive && !bannerDismissed && (
        <div className="bg-[#1F1D1B] dark:bg-[#25211D] text-[#FAF6F0] text-xs px-4 py-1.5 flex items-center justify-center relative">
          <p className="truncate pr-6 text-center">{siteSettings.bannerText}</p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss announcement"
            className="absolute right-3 p-1 opacity-75 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF6F0]/92 dark:bg-[#141210]/92 backdrop-blur-md border-b border-[#E6DDD0] dark:border-[#2C2620]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="font-serif text-xl md:text-2xl font-bold tracking-tight text-[#1F1D1B] dark:text-[#F5EFE6] whitespace-nowrap shrink-0"
          >
            ArtWorn
          </Link>

          {/* Zone 2: 5 concise single-line links */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
            <NavLink to="/shop" className={navLinkClass}>
              Shop
            </NavLink>
            <NavLink to="/custom-studio" className={navLinkClass}>
              Custom Studio
            </NavLink>
            <NavLink to="/gallery" className={navLinkClass}>
              Gallery
            </NavLink>
            <NavLink to="/pre-order" className={navLinkClass}>
              Pre-Order
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
          </nav>

          {/* Zone 3: Actions & Primary Bag CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-[#5C554E] dark:text-[#B5ADA4] hover:bg-[#F3ECE2] dark:hover:bg-[#25211D] transition-colors"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                aria-label="Studio Admin Dashboard"
                title="Admin Dashboard"
                className="p-2 rounded-lg text-[#C65D3B] hover:bg-[#C65D3B]/10 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
              </Link>
            )}

            {user ? (
              <Link
                to="/account"
                aria-label="My Account"
                className="relative p-2 rounded-lg text-[#5C554E] dark:text-[#B5ADA4] hover:bg-[#F3ECE2] dark:hover:bg-[#25211D] transition-colors"
              >
                {unreadNotificationsCount > 0 ? (
                  <>
                    <Bell className="w-4 h-4 text-[#C65D3B]" />
                    <span className="sr-only">{unreadNotificationsCount} unread notifications</span>
                  </>
                ) : (
                  <User className="w-4 h-4" />
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                aria-label="Sign in"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#5C554E] dark:text-[#B5ADA4] hover:bg-[#F3ECE2] dark:hover:bg-[#25211D] transition-colors whitespace-nowrap shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#C65D3B] text-white text-xs font-medium hover:bg-[#B24F30] transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="tabular-nums">Bag ({cartCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb-zone friendly, <= 56px height) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6F0]/95 dark:bg-[#141210]/95 backdrop-blur-md border-t border-[#E6DDD0] dark:border-[#2C2620] pb-safe"
      >
        <div className="grid grid-cols-5 h-14 items-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full text-[10px] font-medium ${
                isActive ? 'text-[#C65D3B]' : 'text-[#5C554E] dark:text-[#B5ADA4]'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="mt-0.5">Home</span>
          </NavLink>
          <NavLink
            to="/shop"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full text-[10px] font-medium ${
                isActive ? 'text-[#C65D3B]' : 'text-[#5C554E] dark:text-[#B5ADA4]'
              }`
            }
          >
            <Store className="w-5 h-5" />
            <span className="mt-0.5">Shop</span>
          </NavLink>
          <NavLink
            to="/custom-studio"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full text-[10px] font-medium ${
                isActive ? 'text-[#C65D3B]' : 'text-[#5C554E] dark:text-[#B5ADA4]'
              }`
            }
          >
            <Palette className="w-5 h-5" />
            <span className="mt-0.5">Studio</span>
          </NavLink>
          <NavLink
            to="/gallery"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full text-[10px] font-medium ${
                isActive ? 'text-[#C65D3B]' : 'text-[#5C554E] dark:text-[#B5ADA4]'
              }`
            }
          >
            <Images className="w-5 h-5" />
            <span className="mt-0.5">Gallery</span>
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full text-[10px] font-medium ${
                isActive ? 'text-[#C65D3B]' : 'text-[#5C554E] dark:text-[#B5ADA4]'
              }`
            }
          >
            <User className="w-5 h-5" />
            <span className="mt-0.5">Account</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
};
