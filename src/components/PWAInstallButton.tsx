import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'footer' }> = ({ variant = 'footer' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'compact'
            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6DDD0] dark:border-[#3A332C] text-xs font-medium text-[#1F1D1B] dark:text-[#F5EFE6] hover:bg-[#F3ECE2] dark:hover:bg-[#25211D] transition-colors whitespace-nowrap shrink-0'
            : 'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1F1D1B] dark:bg-[#F5EFE6] text-[#FAF6F0] dark:text-[#141210] text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap shrink-0'
        }
      >
        <Download className="w-3.5 h-3.5" />
        Install ArtWorn App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E6DDD0] dark:border-[#3A332C] text-xs font-medium text-[#1F1D1B] dark:text-[#F5EFE6] hover:bg-[#F3ECE2] dark:hover:bg-[#25211D] transition-colors whitespace-nowrap shrink-0"
        >
          <Share2 className="w-3.5 h-3.5 text-[#C65D3B]" />
          Add to Home Screen
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#332D27] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold">Install ArtWorn on iOS</h3>
                <button onClick={() => setShowIOSGuide(false)} aria-label="Close" className="p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-[#5C554E] dark:text-[#B5ADA4] list-decimal list-inside">
                <li>Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.</li>
                <li>Scroll down and choose <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> for instant studio access.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
