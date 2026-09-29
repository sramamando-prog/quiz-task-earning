# Quiz Earning Task 🚀

A production-ready, mobile-first Quiz & Task Earning web application built with **React**, **TypeScript**, **Tailwind CSS**, and **Google Firebase (Authentication & Firestore)**.

---

## 🌟 Key Features

1. **User Authentication**:
   - Email/Password sign up & login
   - Google Sign-In with popup
   - Password reset via email
   - Unique UID & referral code generation
2. **Quiz Earning System**:
   - ₹1 earned for each correct answer (+₹1)
   - ₹1 deducted for wrong answers (-₹1)
   - Non-negative wallet protection: Balance is guaranteed never to drop below ₹0
   - Instant transaction logging & celebratory confetti
3. **Tasks Earning System**:
   - Partner tasks (social media follows, reviews, surveys)
   - Single-claim protection
4. **Refer & Earn (₹10 / Referral)**:
   - Unique referral codes & shareable link (`?ref=CODE`)
   - Auto-filling referral input on registration
   - ₹10 credited automatically to referrer upon successful registration
   - Self-referral protection
5. **Wallet & UPI Withdrawal**:
   - Minimum withdrawal amount: ₹10
   - Reserved balance mechanism: Deducted & locked upon request
   - Admin approves (SUCCESS) or rejects (REJECTED) with refund to wallet balance
   - Full passbook & transaction history
6. **Dedicated Admin Panel**:
   - Protected by email allowlist & Firestore Security Rules
   - Real-time dashboard stats (Users, Pending payouts, Quiz content, Referrals)
   - Questions manager (Create, Edit, Delete, Toggle active)
   - Tasks manager
   - Withdrawal processor (Mark SUCCESS or REJECT with reason)
   - User account search and suspension

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas-Confetti
- **Backend / Database**: Firebase Authentication, Cloud Firestore
- **Security**: Server-grade Firestore Security Rules, Atomic Firestore Transactions for wallet balance calculations

---

## 🔒 Admin Configuration

The authorized administrator Gmail address is configured in:
`src/firebase.ts` & `firestore.rules`

Look for:
```typescript
export const AUTHORIZED_ADMIN_EMAILS = [
  'sramamando@gmail.com', // Your primary admin Gmail
  'ADMIN_EMAIL_HERE'     // Replace with any secondary authorized Gmail
];
```

---

## 📦 GitHub Deployment & Hosting

### Option 1: Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

### Option 2: Netlify / Vercel
1. Connect your GitHub repository.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy!
