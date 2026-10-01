# Quiz Earning Task — Project File Manifest & Native Android AdMob Guide

Current Deployed Web Domain: `https://quiz-earning.netlify.app`
Native Android Package ID: `com.quizearning.app`
Firebase Project ID: `gen-lang-client-0219310736`
Firestore Custom Database ID: `ai-studio-quizearningtask-bf5dca6b-941d-42d2-bbd2-ad406f79150f`

---

## 📱 Google AdMob Native Android Configuration

### 1. Ad Unit IDs (Integrated in Native Code)
- **Banner Ad Unit ID**: `ca-app-pub-9895846279260256/3710345919`
- **Interstitial Ad Unit ID**: `ca-app-pub-9895846279260256/2564785204`

### 2. AdMob Android App ID Requirement (Crucial)
AdMob App ID (format: `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`) must be present in the Android configuration before running on devices.

Configured locations:
1. `android/app/src/main/AndroidManifest.xml` (Line 41):
   ```xml
   <meta-data
       android:name="com.google.android.gms.ads.APPLICATION_ID"
       android:value="ca-app-pub-9895846279260256~XXXXXXXXXX"/>
   ```
   *Replace `ca-app-pub-9895846279260256~XXXXXXXXXX` with your exact AdMob Android App ID from your AdMob Console (Apps → App settings).*

2. `capacitor.config.ts`:
   ```typescript
   plugins: {
     AdMob: {
       appId: 'ca-app-pub-9895846279260256~XXXXXXXXXX'
     }
   }
   ```

---

## 🛠️ How to Build Native Android APK

1. **Prerequisites**:
   - Install **Android Studio** (Koala or newer) and Android SDK (API 34/35).
   - Node.js & npm.

2. **Sync Project**:
   ```bash
   npm run build
   npx cap sync android
   ```

3. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```
   *Or open the `/android` directory directly in Android Studio.*

4. **Build APK / Bundle**:
   - In Android Studio menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - For Play Store: **Build → Generate Signed Bundle / APK...**

---

## 📁 Manifest of Project Files

### 1. Native Android & Capacitor Files
| File Path | Type | Purpose |
| :--- | :--- | :--- |
| `capacitor.config.ts` | Capacitor Config | Configures `appId: com.quizearning.app`, Android web directory, and AdMob plugin settings. |
| `android/` | Android Studio Project | Complete native Android wrapper project with Gradle build scripts, AndroidManifest, and native dependencies. |
| `android/app/src/main/AndroidManifest.xml` | Native Manifest | Internet permissions and Google Mobile Ads `APPLICATION_ID` metadata. |
| `android/app/build.gradle` | Gradle Config | Android compilation SDK, min SDK, applicationId, and plugin linkages. |
| `android/app/capacitor.build.gradle` | Generated Gradle | Automatically links `:capacitor-community-admob`. |
| `src/services/admobService.ts` | Native AdMob Bridge | Official `@capacitor-community/admob` wrapper handling SDK initialization, native banner show/hide, and natural transition interstitials with 45s cooldown. |
| `src/components/AdMobBanner.tsx` | Native Ad Banner Component | Native banner lifecycle controller (only activates real Google Mobile Ads on native Android; 0 fake boxes on web). |

### 2. Root Configuration & Build Files
| File Path | Type | Purpose |
| :--- | :--- | :--- |
| `package.json` | Config / Dependencies | Lists dependencies including `@capacitor/core`, `@capacitor/android`, `@capacitor-community/admob`, `react`, `firebase`. |
| `bun.lock` | Dependency Lock | Exact dependency version lockfile. |
| `vite.config.ts` | Build Tool Config | Vite setup with React plugin and dev server options. |
| `tsconfig.json` | TypeScript Config | TypeScript compiler configuration (JSX, module resolution, target). |
| `index.html` | HTML Entry Point | HTML template, viewport meta tags, fonts, and React root mount container `#root`. |
| `.env.example` | Env Var Template | Safe environment variable documentation template without private secrets. |
| `.gitignore` | Git Config | Git ignore rules (`node_modules`, `dist`, logs). |
| `metadata.json` | Project Meta | App title, description, and permissions config. |
| `README.md` | Documentation | High-level guide and overview of the application. |

### 3. Firebase Rules & Client Configuration
| File Path | Type | Purpose |
| :--- | :--- | :--- |
| `firebase-applet-config.json` | Firebase Client Config | Client-side Firebase credentials (`projectId`, `appId`, `apiKey`, `authDomain`, `firestoreDatabaseId`, `oAuthClientId`). |
| `firestore.rules` | Security Rules | Complete Firestore database security rules. |
| `storage.rules` | Security Rules | Firebase Cloud Storage security rules. |

### 4. Core Firebase & Context Providers
| File Path | Type | Purpose |
| :--- | :--- | :--- |
| `src/firebase.ts` | Firebase Initialization | Initializes Firebase app (`initializeApp`), Auth (`getAuth`), Google Provider, Firestore custom database instance, admin check. |
| `src/context/AuthContext.tsx` | Authentication State & Services | Full User Auth controller: `onAuthStateChanged`, email/password login/signup, Google popup, password reset, session restore. |
| `src/types.ts` | TypeScript Interfaces | Data contracts for all user and transaction entities. |

### 5. Application Shell & Screens
| File Path | Type | Purpose |
| :--- | :--- | :--- |
| `src/main.tsx` | React Entry Point | Boots the React root and wraps the app with `AuthProvider`. |
| `src/App.tsx` | Screen Router & Auth Gate | Enforces strict authentication gate, initializes native AdMob for authenticated users, removes ads from Admin Panel, routes between screens. |
| `src/index.css` | Styling | Global Tailwind CSS imports. |
| `src/components/BottomNav.tsx` | Navigation | Fixed bottom tab bar for mobile navigation (`Home`, `Deposit`, `Refer`, `Withdraw`, `Help`). |
| `src/components/AuthModal.tsx` | User Authentication UI | Sign In, Create New Account, Google Sign-In, Forgot Password forms with error handling. |
| `src/components/HomeScreen.tsx` | Dashboard / Home | User overview with native AdMob banner integration below summary card. |
| `src/components/QuizScreen.tsx` | Quiz Earning Engine | Quiz questions with natural transition interstitial trigger on question advancement. |
| `src/components/TasksScreen.tsx` | Task Earning Engine | Shows earning tasks with natural transition interstitial trigger on reward claim. |
| `src/components/WalletScreen.tsx` | Wallet & Passbook | Full transaction ledger with status badges and quick action shortcuts. |
| `src/components/DepositScreen.tsx` | UPI Deposit System | Displays official receiver UPI ID (`9335255724@ptyes`), UTR input and verification. |
| `src/components/WithdrawScreen.tsx` | UPI Withdrawal System | UPI payout request screen enforcing minimum ₹100 threshold. |
| `src/components/ReferScreen.tsx` | Refer & Earn | User's unique referral link, ₹10/referral reward tracker, and invited friends list. |
| `src/components/HelpScreen.tsx` | Help & Support | FAQ accordion, support contact methods, payment guide. |
| `src/components/AdminPanel.tsx` | Admin Dashboard | **Completely untouched** administration dashboard for `sramamando@gmail.com` (100% ad-free). |
| `src/services/walletService.ts` | Firestore Wallet Operations | Atomic Firestore transactions for balances, deposits, and payouts. |
| `src/services/seedData.ts` | Initial Data Seeding | Seeds initial demo quiz questions and earning tasks into Firestore. |

---
*All native and web files are packaged within `quiz-earning-task-complete-source.zip`.*
