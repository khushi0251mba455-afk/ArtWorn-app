import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Instagram, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { db } from '../lib/firebase';
import { checkRateLimit } from '../lib/rateLimit';

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [source, setSource] = useState('Website');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rl = checkRateLimit('contact_form', 20000);
    if (!rl.allowed) {
      showToast(`Please wait ${rl.waitSeconds}s before sending another message.`, 'info');
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, 'leads'), {
        name: name.trim().slice(0, 100),
        contact: contact.trim().slice(0, 150),
        source,
        notes: notes.trim().slice(0, 1000),
        status: 'New',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setName('');
      setContact('');
      setNotes('');
      showToast('Message received! Our Dehradun studio will reply shortly.', 'success');
    } catch {
      showToast('Could not submit right now. Please message us on WhatsApp!', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-24">
      <div className="max-w-2xl mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-[#C65D3B]">Get in Touch</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1">Visit or Message Our Dehradun Studio</h1>
        <p className="mt-2 text-sm sm:text-base text-[#5C554E] dark:text-[#B5ADA4]">
          Questions about sending your own jacket, bulk college fest merch, or gifting timelines? Reach out directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 sm:p-8 space-y-4"
        >
          <h2 className="font-serif text-2xl font-semibold">Send an Enquiry</h2>
          <div>
            <label className="block text-xs font-medium mb-1">Your Name *</label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Bisht"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email or WhatsApp Number *</label>
            <input
              type="text"
              required
              maxLength={150}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="+91 98XXXXXXXX or email"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Where did you hear about us?</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
            >
              <option value="Website">Website / Google</option>
              <option value="Instagram">Instagram</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="College Event">College Event</option>
              <option value="Referral">Friend Referral</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Message *</label>
            <textarea
              rows={4}
              required
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us what you're looking to create..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#141210] border border-[#E6DDD0] dark:border-[#332D27] text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#C65D3B] text-white text-sm font-medium hover:bg-[#B24F30] transition-colors disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-[#1E1B18] border border-[#E6DDD0] dark:border-[#2C2620] p-6 space-y-4">
            <h2 className="font-serif text-xl font-semibold">Direct Studio Channels</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C65D3B] mt-1 shrink-0" />
                <div>
                  <p className="font-medium">ArtWorn Studio · Dehradun</p>
                  <p className="text-[#5C554E] dark:text-[#B5ADA4]">
                    Near Rajpur Road, Jakhan, Dehradun, Uttarakhand 248001
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#C65D3B] shrink-0" />
                <span>hello@artworn.in</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="https://wa.me/919897000000?text=Hi%20ArtWorn%20Dehradun!"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#256D4A] text-white text-xs font-medium hover:bg-[#1F5A3D]"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Click-to-Chat
              </a>
              <a
                href="https://instagram.com/artworn.dehradun"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E6DDD0] dark:border-[#332D27] text-xs font-medium hover:border-[#C65D3B]"
              >
                <Instagram className="w-4 h-4 text-[#C65D3B]" />
                @artworn.dehradun
              </a>
            </div>
          </div>

          {/* Dehradun Studio Location Map */}
          <div className="rounded-2xl overflow-hidden border border-[#E6DDD0] dark:border-[#2C2620] bg-white dark:bg-[#1E1B18]">
            <iframe
              title="ArtWorn Dehradun Studio Map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=78.035%2C30.345%2C78.095%2C30.395&layer=mapnik&marker=30.371%2C78.068"
              className="w-full h-64 border-0"
              loading="lazy"
            />
            <div className="px-4 py-3 flex items-center justify-between text-xs text-[#5C554E] dark:text-[#B5ADA4]">
              <span>Rajpur Road Studio District · Dehradun</span>
              <a
                href="https://maps.google.com/?q=Rajpur+Road+Dehradun+Uttarakhand"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C65D3B] font-medium hover:underline"
              >
                Open Directions →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
