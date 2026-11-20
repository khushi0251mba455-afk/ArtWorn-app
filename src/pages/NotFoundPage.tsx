import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-[#C65D3B]">404 · Off Canvas</p>
      <h1 className="font-serif text-4xl font-semibold mt-2">This page hasn&apos;t been painted yet</h1>
      <p className="mt-3 text-sm text-[#5C554E] dark:text-[#B5ADA4]">
        The route you followed doesn&apos;t exist. Head back to the studio or explore ready-made pieces.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link to="/" className="px-5 py-2.5 rounded-xl bg-[#C65D3B] text-white text-sm font-medium">
          Back Home
        </Link>
        <Link to="/shop" className="px-5 py-2.5 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-sm font-medium">
          Browse Shop
        </Link>
      </div>
    </div>
  );
};
