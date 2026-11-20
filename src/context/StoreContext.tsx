import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  DEFAULT_SITE_SETTINGS,
  SEED_COUPONS,
  SEED_GALLERY,
  SEED_PRODUCTS,
  SEED_REVIEWS,
} from '../data/seedData';
import type {
  CartItem,
  GalleryItem,
  NotificationItem,
  Product,
  Review,
  SavedDesign,
  SiteSettings,
} from '../types';
import { useAuth } from './AuthContext';

interface StoreContextValue {
  products: Product[];
  galleryItems: GalleryItem[];
  reviews: Review[];
  siteSettings: SiteSettings;
  dataLoading: boolean;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQty: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  wishlistIds: string[];
  savedDesigns: SavedDesign[];
  toggleWishlist: (productId: string) => Promise<void>;
  saveCustomDesign: (design: SavedDesign) => Promise<void>;
  removeSavedDesign: (designId: string) => Promise<void>;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  refreshCatalog: () => Promise<void>;
  seedStudioDatabase: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue>({} as StoreContextValue);

const CART_STORAGE_KEY = 'artworn_cart_v1';
const WISHLIST_STORAGE_KEY = 'artworn_wishlist_v1';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>(
    SEED_PRODUCTS.map((p) => ({ ...p }))
  );
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(
    SEED_GALLERY.map((g) => ({ ...g }))
  );
  const [reviews, setReviews] = useState<Review[]>(
    SEED_REVIEWS.map((r) => ({ ...r }))
  );
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [dataLoading, setDataLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota
    }
  }, [cart]);

  const refreshCatalog = useCallback(async () => {
    setDataLoading(true);
    try {
      const [prodSnap, galSnap, revSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'galleryItems')),
        getDocs(query(collection(db, 'reviews'), where('approved', '==', true))),
        getDoc(doc(db, 'siteSettings', 'main')),
      ]);

      if (!prodSnap.empty) {
        setProducts(prodSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      } else {
        setProducts(SEED_PRODUCTS.map((p) => ({ ...p })));
      }

      if (!galSnap.empty) {
        setGalleryItems(galSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem)));
      } else {
        setGalleryItems(SEED_GALLERY.map((g) => ({ ...g })));
      }

      if (!revSnap.empty) {
        setReviews(revSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
      } else {
        setReviews(SEED_REVIEWS.map((r) => ({ ...r })));
      }

      if (settingsSnap.exists()) {
        setSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...(settingsSnap.data() as Partial<SiteSettings>) });
      }
    } catch (err) {
      // Keep fallback seed data visible if unauthenticated or offline
      console.warn('Using local studio catalog fallback:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  // Seed Firestore automatically when admin first signs in and products collection is empty
  const seedStudioDatabase = useCallback(async () => {
    try {
      for (const prod of SEED_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), {
          ...prod,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const gal of SEED_GALLERY) {
        await setDoc(doc(db, 'galleryItems', gal.id), {
          ...gal,
          createdAt: serverTimestamp(),
        });
      }
      for (const coupon of SEED_COUPONS) {
        await setDoc(doc(db, 'coupons', coupon.id), coupon);
      }
      await setDoc(doc(db, 'siteSettings', 'main'), {
        ...DEFAULT_SITE_SETTINGS,
        updatedAt: serverTimestamp(),
      });
      await refreshCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seedStudioDatabase');
    }
  }, [refreshCatalog]);

  useEffect(() => {
    if (!isAdmin) return;
    getDocs(collection(db, 'products'))
      .then((snap) => {
        if (snap.empty) {
          seedStudioDatabase();
        }
      })
      .catch(() => {});
  }, [isAdmin, seedStudioDatabase]);

  // Sync wishlist & notifications when user is authenticated
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const wishRef = doc(db, 'wishlists', user.uid);
    const unsubWish = onSnapshot(
      wishRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setWishlistIds(Array.isArray(data.productIds) ? data.productIds : []);
          setSavedDesigns(Array.isArray(data.savedDesigns) ? data.savedDesigns : []);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `wishlists/${user.uid}`);
      }
    );

    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubNotif = onSnapshot(
      notifQuery,
      (snap) => {
        setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationItem)));
      },
      () => {
        // Fallback query without composite index if index isn't built yet
        onSnapshot(
          query(collection(db, 'notifications'), where('userId', '==', user.uid)),
          (snap2) => {
            setNotifications(snap2.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationItem)));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
        );
      }
    );

    return () => {
      unsubWish();
      unsubNotif();
    };
  }, [user]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (c) =>
          c.productId === item.productId &&
          c.size === item.size &&
          c.color === item.color &&
          c.customRequestId === item.customRequestId
      );
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
    setCartOpen(true);
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prev) =>
      prev.filter((c) => !(c.productId === productId && c.size === size && c.color === color))
    );
  };

  const updateCartQty = (productId: string, size: string, color: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((c) =>
        c.productId === productId && c.size === size && c.color === color ? { ...c, quantity: qty } : c
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = async (productId: string) => {
    const exists = wishlistIds.includes(productId);
    const next = exists ? wishlistIds.filter((id) => id !== productId) : [...wishlistIds, productId];
    setWishlistIds(next);
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));

    if (user) {
      try {
        await setDoc(
          doc(db, 'wishlists', user.uid),
          {
            userId: user.uid,
            productIds: next,
            savedDesigns,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `wishlists/${user.uid}`);
      }
    }
  };

  const saveCustomDesign = async (design: SavedDesign) => {
    if (!user) throw new Error('Sign in to save custom designs to your account.');
    const nextDesigns = [design, ...savedDesigns].slice(0, 30);
    setSavedDesigns(nextDesigns);
    try {
      await setDoc(
        doc(db, 'wishlists', user.uid),
        {
          userId: user.uid,
          productIds: wishlistIds,
          savedDesigns: nextDesigns,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `wishlists/${user.uid}`);
    }
  };

  const removeSavedDesign = async (designId: string) => {
    if (!user) return;
    const nextDesigns = savedDesigns.filter((d) => d.id !== designId);
    setSavedDesigns(nextDesigns);
    try {
      await setDoc(
        doc(db, 'wishlists', user.uid),
        {
          userId: user.uid,
          productIds: wishlistIds,
          savedDesigns: nextDesigns,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `wishlists/${user.uid}`);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const cartSubtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <StoreContext.Provider
      value={{
        products,
        galleryItems,
        reviews,
        siteSettings,
        dataLoading,
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        cartCount,
        cartSubtotal,
        wishlistIds,
        savedDesigns,
        toggleWishlist,
        saveCustomDesign,
        removeSavedDesign,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        refreshCatalog,
        seedStudioDatabase,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
