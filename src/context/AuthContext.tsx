import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ConfirmationResult,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  ADMIN_BOOTSTRAP_EMAIL,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import type { UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string, referredByCode?: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendPhoneOtp: (phoneNumber: string, recaptchaContainerId: string) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (confirmation: ConfirmationResult, otp: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  deleteAccountAndData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

function makeReferralCode(name: string, uid: string): string {
  const prefix = (name || 'ART')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(3, 'X');
  const suffix = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  return `AW-${prefix}${suffix}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const ensureUserProfile = async (firebaseUser: User, overrideName?: string, referredByCode?: string) => {
    const userPath = `users/${firebaseUser.uid}`;
    const userRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const displayName =
          (overrideName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'ArtWorn Patron').slice(0, 100);
        const refCode = makeReferralCode(displayName, firebaseUser.uid);
        const isBootstrappedAdmin =
          firebaseUser.email === ADMIN_BOOTSTRAP_EMAIL && firebaseUser.emailVerified;

        const newDoc = {
          uid: firebaseUser.uid,
          displayName,
          ...(firebaseUser.email ? { email: firebaseUser.email } : {}),
          ...(firebaseUser.phoneNumber ? { phone: firebaseUser.phoneNumber } : {}),
          role: 'customer' as const,
          referralCode: refCode,
          ...(referredByCode ? { referredBy: referredByCode.trim().toUpperCase().slice(0, 32) } : {}),
          referralCredits: referredByCode ? 150 : 0,
          stylePreferences: [],
          addresses: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(userRef, newDoc);

        // Register PII-free referral code pointer
        try {
          await setDoc(doc(db, 'referralCodes', refCode), {
            code: refCode,
            ownerId: firebaseUser.uid,
            active: true,
          });
        } catch (err) {
          console.warn('Referral code registration skipped:', err);
        }

        setProfile({
          ...newDoc,
          role: isBootstrappedAdmin ? 'admin' : 'customer',
        });
      } else {
        const data = snap.data() as UserProfile;
        setProfile(data);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, userPath);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          await ensureUserProfile(firebaseUser);
        } catch (err) {
          console.error('Failed loading user profile:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(cred.user);
    setAuthModalOpen(false);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    await ensureUserProfile(cred.user);
    setAuthModalOpen(false);
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    password: string,
    referredByCode?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name.trim() });
    await sendEmailVerification(cred.user);
    await ensureUserProfile(cred.user, name.trim(), referredByCode);
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const sendPhoneOtp = async (phoneNumber: string, recaptchaContainerId: string) => {
    const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/\D/g, '')}`;
    const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
    });
    return await signInWithPhoneNumber(auth, formatted, verifier);
  };

  const verifyPhoneOtp = async (confirmation: ConfirmationResult, otp: string, displayName?: string) => {
    const cred = await confirmation.confirm(otp.trim());
    if (displayName?.trim() && !cred.user.displayName) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    await ensureUserProfile(cred.user, displayName);
    setAuthModalOpen(false);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Please sign in first.');
    const path = `users/${user.uid}`;
    try {
      const sanitized: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (updates.displayName !== undefined) sanitized.displayName = updates.displayName.slice(0, 100);
      if (updates.email !== undefined) sanitized.email = updates.email.slice(0, 200);
      if (updates.phone !== undefined) sanitized.phone = updates.phone.slice(0, 25);
      if (updates.stylePreferences !== undefined) sanitized.stylePreferences = updates.stylePreferences.slice(0, 10);
      if (updates.addresses !== undefined) sanitized.addresses = updates.addresses.slice(0, 5);
      if (updates.referredBy !== undefined) sanitized.referredBy = updates.referredBy.slice(0, 32);

      await updateDoc(doc(db, 'users', user.uid), sanitized);
      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteAccountAndData = async () => {
    if (!user) return;
    try {
      if (profile?.referralCode) {
        try {
          await deleteDoc(doc(db, 'referralCodes', profile.referralCode));
        } catch {
          // ignore if missing
        }
      }
      try {
        await deleteDoc(doc(db, 'wishlists', user.uid));
      } catch {
        // ignore if missing
      }
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      setProfile(null);
    } catch (error) {
      if (error instanceof Error && error.message.includes('requires-recent-login')) {
        throw new Error('For security, please sign out and sign back in right before deleting your account.');
      }
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
    }
  };

  const isAdmin = Boolean(
    user &&
      ((user.email === ADMIN_BOOTSTRAP_EMAIL && user.emailVerified) || profile?.role === 'admin')
  );

  const isVerified = Boolean(
    user &&
      (user.emailVerified || user.providerData?.some((p) => p.providerId === 'phone'))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isVerified,
        authModalOpen,
        setAuthModalOpen,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        resendVerification,
        resetPassword,
        sendPhoneOtp,
        verifyPhoneOtp,
        logout,
        updateUserProfile,
        deleteAccountAndData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
