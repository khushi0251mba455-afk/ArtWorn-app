# ArtWorn — Wearable Art Studio (Dehradun, India)

> *"Turn your style into art."*

ArtWorn is a mobile-first Progressive Web App (PWA) for a Dehradun-based hand-painted and embroidered wearable-art studio.

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router
- **Backend & Auth:** Firebase Authentication, Cloud Firestore, Cloud Storage, Hosting
- **Charts & PDF:** Recharts (Admin analytics), jsPDF (downloadable customer invoices)
- **PWA:** `vite-plugin-pwa` with offline caching, web manifest, and in-app install prompt

---

## Firebase Setup & Configuration

1. **Firebase Config**
   - `firebase-applet-config.json` is pre-configured for this project.
   - Optionally override any key via `.env` using the `VITE_FIREBASE_*` keys documented in `.env.example`.

2. **Enable Auth Providers in Firebase Console**
   - Go to **Firebase Console → Authentication → Sign-in method**.
   - **Google:** Already enabled.
   - **Email/Password:** Click *Add new provider* → *Email/Password* → Enable (used for registration, email verification, and password reset).
   - **Phone:** Click *Add new provider* → *Phone* → Enable (used for Phone OTP login).

3. **Deploy Firestore & Storage Security Rules**
   - Firestore rules are defined in `firestore.rules` and validated with `@firebase/eslint-plugin-security-rules`.
   - Storage rules (`storage.rules`) enforce image-only uploads under 5 MB.
   - Deploy via Firebase CLI if deploying externally:
     ```bash
     firebase deploy --only firestore:rules,storage
     ```

4. **Make Your First Studio Admin**
   - The studio owner account (`khushi.0251mba455@dgu.ac.in`, email verified) is bootstrapped with admin access in `firestore.rules` and `src/lib/firebase.ts`.
   - To promote another team member to `admin`:
     1. Have them sign in once to create their `/users/{uid}` document.
     2. Open **Firebase Console → Firestore Database → `users` collection → `{uid}`**.
     3. Change `role` from `"customer"` to `"admin"`.
   - When an admin first visits `/admin`, click **Seed Sample Data** (or it runs automatically if `products` is empty) to write the 8 starter products, 6 gallery pieces, coupons (`ART10`, `DEHRADUN15`), and pre-order campaign settings into Firestore.

5. **Plug In Live Razorpay Checkout (Optional)**
   - Set `VITE_RAZORPAY_KEY_ID` in `.env`.
   - Load `https://checkout.razorpay.com/v1/checkout.js` and complete the callback inside `initiateRazorpayPayment()` in `src/pages/CheckoutPage.tsx`.

---

## Local Development & Deployment

```bash
npm install
npm run dev       # Starts on http://localhost:3000
npm run build     # Production build into dist/
```

To deploy to Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting,firestore:rules,storage
```
