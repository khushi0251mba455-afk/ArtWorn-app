import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MapPin } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#E6DDD0] dark:border-[#2C2620] bg-[#F3ECE2]/60 dark:bg-[#1A1714] pt-14 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Link to="/" className="font-serif text-2xl font-bold text-[#1F1D1B] dark:text-[#F5EFE6]">
            ArtWorn
          </Link>
          <p className="mt-2.5 text-sm text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
            Turn your style into art. Hand-painted &amp; embroidered clothing crafted slowly in our Dehradun studio.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#5C554E] dark:text-[#B5ADA4]">
            <MapPin className="w-3.5 h-3.5 text-[#C65D3B] shrink-0" />
            <span>Rajpur Road, Dehradun, Uttarakhand 248001</span>
          </div>
          <div className="mt-4">
            <PWAInstallButton variant="footer" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F5EFE6]">Studio</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#5C554E] dark:text-[#B5ADA4]">
            <li><Link to="/shop" className="hover:text-[#C65D3B]">Shop Ready-Made</Link></li>
            <li><Link to="/custom-studio" className="hover:text-[#C65D3B]">Custom Order Studio</Link></li>
            <li><Link to="/pre-order" className="hover:text-[#C65D3B]">Limited Pre-Order Drop</Link></li>
            <li><Link to="/gallery" className="hover:text-[#C65D3B]">Commission Gallery</Link></li>
            <li><Link to="/survey" className="hover:text-[#C65D3B]">Style Validation Survey</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F5EFE6]">Help &amp; Policies</h3>
          <ul className="mt-3 space-y-2 text-sm text-[#5C554E] dark:text-[#B5ADA4]">
            <li><Link to="/about" className="hover:text-[#C65D3B]">Our Story &amp; Wash Care</Link></li>
            <li><Link to="/contact" className="hover:text-[#C65D3B]">Contact Dehradun Studio</Link></li>
            <li><Link to="/legal/shipping" className="hover:text-[#C65D3B]">Shipping &amp; Returns</Link></li>
            <li><Link to="/legal/custom-policy" className="hover:text-[#C65D3B]">Custom Order Policy</Link></li>
            <li><Link to="/legal/privacy" className="hover:text-[#C65D3B]">Privacy &amp; Terms</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#1F1D1B] dark:text-[#F5EFE6]">Community</h3>
          <p className="mt-3 text-sm text-[#5C554E] dark:text-[#B5ADA4]">
            Behind-the-scenes brush strokes, campus pop-ups, and custom reveals on Instagram.
          </p>
          <a
            href="https://instagram.com/artworn.dehradun"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#C65D3B] hover:underline"
          >
            <Instagram className="w-4 h-4" />
            @artworn.dehradun
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-6 border-t border-[#E6DDD0] dark:border-[#2C2620] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5C554E] dark:text-[#B5ADA4]">
        <p>© {new Date().getFullYear()} ArtWorn Studio · Dehradun, India.</p>
        <div className="flex items-center gap-4">
          <Link to="/legal/terms" className="hover:text-[#C65D3B]">Terms</Link>
          <Link to="/legal/privacy" className="hover:text-[#C65D3B]">Privacy</Link>
        </div>
      </div>
    </footer>
  );
};
