import React from 'react';
import { Link, useParams } from 'react-router-dom';

const DOCS: Record<string, { title: string; updated: string; sections: { heading: string; body: string }[] }> = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'November 2026',
    sections: [
      {
        heading: '1. Data We Collect',
        body: 'ArtWorn collects your name, email, phone number, delivery address, and custom artwork reference photos solely to craft, quote, and ship your orders from our Dehradun studio.',
      },
      {
        heading: '2. Storage & Security',
        body: 'Authentication and database storage are powered by Google Firebase with strict owner-only access rules. Uploaded images are stored privately for your custom commission.',
      },
      {
        heading: '3. Account Deletion',
        body: 'You may permanently delete your account, saved addresses, and wishlist anytime from the Settings section of your Account dashboard.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: 'November 2026',
    sections: [
      {
        heading: '1. Handmade Nature',
        body: 'Every ArtWorn piece is painted or embroidered by hand in Dehradun. Subtle variations in brushwork and stitch texture are marks of authentic craftsmanship.',
      },
      {
        heading: '2. Intellectual Property',
        body: 'Customers confirm they hold rights to reference photos submitted for commissions. ArtWorn reserves the right to showcase finished pieces in our portfolio unless you request a private gift commission.',
      },
    ],
  },
  shipping: {
    title: 'Shipping & Returns Policy',
    updated: 'November 2026',
    sections: [
      {
        heading: '1. Dispatch & Courier Timelines',
        body: 'Ready-made studio pieces dispatch within 3–5 business days. Custom orders dispatch in 7–12 studio days after quote approval. Free insured shipping applies across India on orders of ₹1,999 or more.',
      },
      {
        heading: '2. Exchanges & Returns',
        body: 'Ready-made items can be exchanged within 7 days of delivery if unworn, unwashed, and tagged. Because custom pieces are tailored one-of-one to your idea, custom orders are final sale.',
      },
    ],
  },
  'custom-policy': {
    title: 'Custom Order Policy',
    updated: 'November 2026',
    sections: [
      {
        heading: '1. Quotes & 50% Advance',
        body: 'Submitting a custom idea is free. After our artist sends your quote, a 50% advance confirms your slot in our painting queue. The remaining 50% is paid once we send final photos prior to dispatch.',
      },
      {
        heading: '2. Revisions & Cancellations',
        body: 'You can chat directly with our artist on your request thread to tweak colours or placement at the sketch stage. Once painting begins, cancellations forfeit the 50% studio slot advance.',
      },
      {
        heading: '3. Sending Your Own Garment',
        body: 'Clean, freshly washed denim jackets or jeans can be couriered to our Rajpur Road studio. Garment base cost is excluded from your quote.',
      },
    ],
  },
};

export const LegalPage: React.FC = () => {
  const { docType = 'privacy' } = useParams<{ docType: string }>();
  const docData = DOCS[docType] || DOCS.privacy;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24">
      <div className="flex flex-wrap gap-2 mb-8">
        {Object.entries(DOCS).map(([key, val]) => (
          <Link
            key={key}
            to={`/legal/${key}`}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              docType === key
                ? 'bg-[#C65D3B] text-white'
                : 'bg-[#F3ECE2] dark:bg-[#1E1B18] text-[#5C554E] dark:text-[#B5ADA4]'
            }`}
          >
            {val.title}
          </Link>
        ))}
      </div>

      <article className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 sm:p-10 space-y-6">
        <header className="pb-6 border-b border-[#E6DDD0] dark:border-[#2C2620]">
          <p className="text-xs text-[#C65D3B] font-medium">ArtWorn Studio Policy · Updated {docData.updated}</p>
          <h1 className="font-serif text-3xl font-semibold mt-1">{docData.title}</h1>
        </header>

        <div className="space-y-6">
          {docData.sections.map((sec) => (
            <section key={sec.heading}>
              <h2 className="text-base font-semibold">{sec.heading}</h2>
              <p className="mt-1.5 text-sm text-[#5C554E] dark:text-[#B5ADA4] leading-relaxed">{sec.body}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
};
