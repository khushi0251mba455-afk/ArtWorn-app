import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#1F1D1B] text-[#FAF6F0] border border-[#E3A72F]/50 px-3.5 py-2 text-xs font-medium shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#E3A72F]" />
      <span>Offline mode · Viewing cached studio pieces</span>
    </div>
  );
};
