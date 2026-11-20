import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppFloat: React.FC = () => {
  const message = encodeURIComponent(
    "Hi ArtWorn Dehradun! I'd love to discuss a custom hand-painted or embroidered piece."
  );

  return (
    <a
      href={`https://wa.me/919897000000?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with ArtWorn on WhatsApp"
      className="fixed bottom-20 md:bottom-6 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-[#256D4A] text-white px-4 py-3 shadow-lg hover:bg-[#1F5A3D] active:scale-[0.98] transition-all text-xs font-medium"
    >
      <MessageCircle className="w-4 h-4" />
      <span className="hidden sm:inline">WhatsApp Studio</span>
    </a>
  );
};
