import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Palette, Sparkles } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { STUDIO_IMAGES } from '../data/seedData';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-16">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">
            Born in Dehradun, Uttarakhand
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold leading-tight text-balance">
            Clothing shouldn&apos;t feel mass-produced. It should feel like you.
          </h1>
          <p className="text-base text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
            ArtWorn started at a sunlit wooden desk off Rajpur Road with a thrifted denim jacket, a handful of textile brushes, and an idea: what if campus fashion celebrated slow, personal storytelling instead of disposable trends?
          </p>
          <p className="text-base text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
            Today, our small studio of illustrators and embroiderers turns blank organic cotton tees, canvas totes, and heavyweight denim into wearable heirlooms—one brushstroke and stitch at a time.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/custom-studio"
              className="px-6 py-3 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors"
            >
              Start Your Custom Piece
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-sm font-medium"
            >
              Visit / Contact Studio
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="aspect-[3/4] max-w-md mx-auto rounded-2xl overflow-hidden border border-[#E6DDD0] dark:border-[#332D27] shadow-sm">
            <SafeImage
              src={STUDIO_IMAGES.founderPortrait}
              alt="ArtWorn founder hand-painting denim in our sunlit Dehradun studio"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-[#E6DDD0] dark:border-[#2C2620]">
        <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6">
          <Palette className="w-6 h-6 text-[#C65D3B] mb-3" />
          <h2 className="font-serif text-xl font-semibold">Heat-Cured Archival Pigments</h2>
          <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
            Every painted piece is layered with water-based, non-toxic textile pigments and heat-cured twice so your artwork stays supple and wash-proof.
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6">
          <Leaf className="w-6 h-6 text-[#9CAF88] mb-3" />
          <h2 className="font-serif text-xl font-semibold">Upcycling &amp; Slow Fashion</h2>
          <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
            Send in your own pre-loved denim jacket or jeans to breathe second life into them—reducing textile waste while creating something deeply personal.
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6">
          <Sparkles className="w-6 h-6 text-[#E3A72F] mb-3" />
          <h2 className="font-serif text-xl font-semibold">Small-Batch, Zero Overproduction</h2>
          <p className="mt-2 text-sm text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">
            We never over-manufacture inventory. Every ArtWorn garment is either painted to order or released in numbered micro-batches of 15–25 pieces.
          </p>
        </div>
      </section>
    </div>
  );
};
