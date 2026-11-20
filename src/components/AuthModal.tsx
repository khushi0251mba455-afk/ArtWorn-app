import React, { useState } from 'react';
import { ConfirmationResult } from 'firebase/auth';
import { Lock, Mail, Phone, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type AuthTab = 'login' | 'register' | 'phone' | 'forgot';

export const AuthModal: React.FC = () => {
  const {
    user,
    authModalOpen,
    setAuthModalOpen,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resendVerification,
    resetPassword,
    sendPhoneOtp,
    verifyPhoneOtp,
  } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<AuthTab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  if (!authModalOpen) return null;

  const formatAuthError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : 'Authentication failed.';
    if (msg.includes('auth/operation-not-allowed')) {
      return 'This sign-in provider is not yet enabled in Firebase Console (Authentication → Sign-in method). Google Sign-In is ready immediately, or enable Email/Phone in your Firebase project.';
    }
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
      return 'Incorrect email or password. Try again or reset your password.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in popup was closed before finishing.';
    }
    return msg;
  };

  const handleGoogle = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
      showToast('Welcome to ArtWorn Studio!', 'success');
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    try {
      if (tab === 'login') {
        await signInWithEmail(email, password);
        showToast('Signed in successfully.', 'success');
      } else if (tab === 'register') {
        await registerWithEmail(name, email, password, referralCode);
        setVerificationSent(true);
        showToast('Account created! Please check your inbox to verify your email.', 'success');
      } else if (tab === 'forgot') {
        await resetPassword(email);
        showToast('Password reset link sent to your email.', 'success');
        setTab('login');
      }
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    try {
      const result = await sendPhoneOtp(phone, 'recaptcha-container');
      setConfirmation(result);
      showToast('OTP sent to your phone.', 'success');
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    setBusy(true);
    setErrorMsg('');
    try {
      await verifyPhoneOtp(confirmation, otp, name);
      showToast('Phone verified! Welcome to ArtWorn.', 'success');
    } catch (err) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to ArtWorn"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
      onClick={() => setAuthModalOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#FAF6F0] dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-[#C65D3B]">ArtWorn Dehradun</p>
            <h2 className="font-serif text-2xl font-semibold mt-0.5">
              {tab === 'register'
                ? 'Create Studio Account'
                : tab === 'phone'
                ? 'Phone OTP Sign-In'
                : tab === 'forgot'
                ? 'Reset Password'
                : 'Sign In to ArtWorn'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close sign in dialog"
            className="p-2 rounded-lg hover:bg-[#F3ECE2] dark:hover:bg-[#25211D]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Email verification prompt when freshly registered */}
        {user && !user.emailVerified && verificationSent && (
          <div className="mt-4 rounded-xl bg-[#E3A72F]/15 border border-[#E3A72F]/40 p-3.5 text-xs space-y-2">
            <p className="font-medium text-[#1F1D1B] dark:text-[#F5EFE6]">
              Verification email sent to {user.email}. Verify your email to unlock orders and custom requests.
            </p>
            <button
              type="button"
              onClick={async () => {
                await resendVerification();
                showToast('Verification email resent!', 'success');
              }}
              className="inline-flex items-center gap-1.5 text-[#C65D3B] font-semibold hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resend Verification Email
            </button>
          </div>
        )}

        {/* Google Sign-In primary option */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="mt-5 w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#25211D] border border-[#E6DDD0] dark:border-[#3A332C] text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-[#F3ECE2] dark:hover:bg-[#2E2924] transition-colors disabled:opacity-60"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.6c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.7z" />
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z" />
            <path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z" />
            <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
          </svg>
          Continue with Google
        </button>

        {/* Auth method tabs */}
        <div className="mt-4 grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F3ECE2] dark:bg-[#25211D]">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(''); }}
            className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === 'login' ? 'bg-white dark:bg-[#141210] shadow-xs' : 'text-[#5C554E] dark:text-[#B5ADA4]'
            }`}
          >
            Email Sign-In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(''); }}
            className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === 'register' ? 'bg-white dark:bg-[#141210] shadow-xs' : 'text-[#5C554E] dark:text-[#B5ADA4]'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => { setTab('phone'); setErrorMsg(''); }}
            className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === 'phone' ? 'bg-white dark:bg-[#141210] shadow-xs' : 'text-[#5C554E] dark:text-[#B5ADA4]'
            }`}
          >
            Phone OTP
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-xl bg-[#C65D3B]/10 border border-[#C65D3B]/40 p-3 text-xs text-[#7F2315] dark:text-[#F5B09B]">
            {errorMsg}
          </div>
        )}

        {(tab === 'login' || tab === 'register' || tab === 'forgot') && (
          <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Rawat"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#3A332C] text-sm focus:outline-none focus:ring-2 focus:ring-[#C65D3B]/40"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5C554E] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#3A332C] text-sm focus:outline-none focus:ring-2 focus:ring-[#C65D3B]/40"
                />
              </div>
            </div>

            {tab !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#5C554E] absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#3A332C] text-sm focus:outline-none focus:ring-2 focus:ring-[#C65D3B]/40"
                  />
                </div>
              </div>
            )}

            {tab === 'register' && (
              <div>
                <label className="block text-xs font-medium mb-1">Friend&apos;s Referral Code (Optional)</label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="AW-XXXX"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#3A332C] text-sm focus:outline-none focus:ring-2 focus:ring-[#C65D3B]/40"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors disabled:opacity-60"
            >
              {busy
                ? 'Please wait...'
                : tab === 'register'
                ? 'Create Account & Send Verification'
                : tab === 'forgot'
                ? 'Send Password Reset Email'
                : 'Sign In'}
            </button>

            <div className="flex items-center justify-between text-xs text-[#5C554E] dark:text-[#B5ADA4] pt-1">
              {tab === 'login' ? (
                <button
                  type="button"
                  onClick={() => setTab('forgot')}
                  className="hover:text-[#C65D3B] underline"
                >
                  Forgot password?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="hover:text-[#C65D3B] underline"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </form>
        )}

        {tab === 'phone' && (
          <div className="mt-4">
            <div id="recaptcha-container" />
            {!confirmation ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Optional for existing users"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#3A332C] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Mobile Number (India +91)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#5C554E] absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#3A332C] text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors disabled:opacity-60"
                >
                  {busy ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#3A332C] text-sm tracking-widest text-center tabular-nums"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors disabled:opacity-60"
                >
                  {busy ? 'Verifying...' : 'Verify & Sign In'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
