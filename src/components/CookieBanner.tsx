import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'artworn_cookie_consent_v1';

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(CONSENT_KEY);
    } catch {
      return false;
    }
  });

  if (!visible) return null;

  const handleChoice = (choice: 'accepted' | 'essential') => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-18 md:bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-40 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#3A332C] p-4 shadow-lg"
    >
      <p className="text-xs text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
        ArtWorn uses essential cookies to keep your shopping bag, custom drafts, and session secure.{' '}
        <Link to="/legal/privacy" className="underline text-[#C65D3B]">
          Privacy Policy
        </Link>
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleChoice('accepted')}
          className="px-3.5 py-1.5 rounded-lg bg-[#C65D3B] text-white text-xs font-medium hover:bg-[#B24F30] transition-colors"
        >
          Accept All
        </button>
        <button
          type="button"
          onClick={() => handleChoice('essential')}
          className="px-3.5 py-1.5 rounded-lg border border-[#E6DDD0] dark:border-[#3A332C] text-xs font-medium hover:bg-[#F3ECE2] dark:hover:bg-[#25211D] transition-colors"
        >
          Essential Only
        </button>
      </div>
    </div>
  );
};
