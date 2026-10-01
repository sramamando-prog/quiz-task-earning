import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs, 
  runTransaction,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, createUserGoogleProvider, isAuthorizedAdmin } from '../firebase';
import { UserProfile, WalletTransaction, ReferralRecord } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, pass: string, phone: string, refCode?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithAdminGoogle: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Generate 6-char referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = 'QZ';
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile when auth state changes and process redirect credentials if returning from redirect
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    // Check if user returned from mobile Google redirect flow
    getRedirectResult(auth).catch((err) => {
      // Suppress or log redirect errors
      console.warn('Redirect auth result warning:', err);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Listen to profile updates in real-time
        unsubscribeProfile = onSnapshot(userDocRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            setProfile(data);
          } else {
            // Profile doc doesn't exist yet (e.g. initial Google login)
            const newCode = generateReferralCode();
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Learner User',
              email: currentUser.email || '',
              phoneNumber: currentUser.phoneNumber || '',
              profileCreatedAt: new Date().toISOString(),
              referralCode: newCode,
              referredBy: null,
              walletBalance: 0,
              totalEarned: 0,
              totalWithdrawn: 0,
              totalReferrals: 0,
              successfulReferrals: 0,
              accountStatus: 'active',
              isAdmin: isAuthorizedAdmin(currentUser.email)
            };
            await setDoc(userDocRef, initialProfile, { merge: true });
            setProfile(initialProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error fetching user profile:', error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signupWithEmail = async (
    name: string, 
    email: string, 
    pass: string, 
    phone: string, 
    refCode?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const newUid = cred.user.uid;
    const newRefCode = generateReferralCode();

    let validReferrerUid: string | null = null;
    let referrerProfile: UserProfile | null = null;

    const trimmedRef = refCode?.trim().toUpperCase();

    // Check if referral code is provided and valid
    if (trimmedRef) {
      const q = query(collection(db, 'users'), where('referralCode', '==', trimmedRef));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const refDoc = querySnap.docs[0];
        if (refDoc.id !== newUid) {
          validReferrerUid = refDoc.id;
          referrerProfile = refDoc.data() as UserProfile;
        }
      }
    }

    const newProfile: UserProfile = {
      uid: newUid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phone.trim(),
      profileCreatedAt: new Date().toISOString(),
      referralCode: newRefCode,
      referredBy: validReferrerUid,
      walletBalance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      totalReferrals: 0,
      successfulReferrals: 0,
      accountStatus: 'active',
      isAdmin: isAuthorizedAdmin(email)
    };

    // Store profile in Firestore
    await setDoc(doc(db, 'users', newUid), newProfile);

    // If there is a valid referrer, process ₹10 referral reward safely inside transaction
    if (validReferrerUid && referrerProfile) {
      try {
        const referrerDocRef = doc(db, 'users', validReferrerUid);
        const referralRecordRef = doc(collection(db, 'referrals'));
        const walletTxRef = doc(collection(db, 'walletTransactions'));

        await runTransaction(db, async (transaction) => {
          const currentRefDoc = await transaction.get(referrerDocRef);
          if (!currentRefDoc.exists()) return;

          const refData = currentRefDoc.data() as UserProfile;
          const updatedBalance = (refData.walletBalance || 0) + 10;
          const updatedEarned = (refData.totalEarned || 0) + 10;
          const updatedTotalRef = (refData.totalReferrals || 0) + 1;
          const updatedSuccessRef = (refData.successfulReferrals || 0) + 1;

          // Update referrer profile
          transaction.update(referrerDocRef, {
            walletBalance: updatedBalance,
            totalEarned: updatedEarned,
            totalReferrals: updatedTotalRef,
            successfulReferrals: updatedSuccessRef
          });

          // Create referral tracking doc
          const referralRecord: ReferralRecord = {
            id: referralRecordRef.id,
            referrerUid: validReferrerUid!,
            referrerName: refData.name,
            referredUid: newUid,
            referredName: name.trim(),
            referredEmail: email.trim().toLowerCase(),
            referredPhone: phone.trim(),
            referralDate: new Date().toISOString(),
            status: 'SUCCESS',
            rewardAmount: 10
          };
          transaction.set(referralRecordRef, referralRecord);

          // Create wallet transaction for referrer
          const rewardTx: WalletTransaction = {
            id: walletTxRef.id,
            userId: validReferrerUid!,
            amount: 10,
            type: 'REFERRAL_REWARD',
            referenceId: referralRecordRef.id,
            description: `Referral reward for inviting ${name.trim()}`,
            status: 'COMPLETED',
            timestamp: new Date().toISOString()
          };
          transaction.set(walletTxRef, rewardTx);
        });
      } catch (err) {
        console.error('Failed to apply referral reward:', err);
      }
    }
  };

  const loginWithGoogle = async () => {
    // Generate fresh provider with select_account to guarantee that normal users
    // are prompted with Google's account chooser and never forced into an existing admin session.
    const provider = createUserGoogleProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (popupErr: any) {
      // If popup is blocked by the mobile browser, automatically fallback to signInWithRedirect
      if (
        popupErr.code === 'auth/popup-blocked' ||
        popupErr.code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw popupErr;
    }
  };

  /**
   * Admin-specific Google Sign-In flow:
   * Opens Google account selector and validates whether the authenticated user
   * possesses verified admin authority. Returns boolean indicating authorization status.
   */
  const loginWithAdminGoogle = async (): Promise<boolean> => {
    const provider = createUserGoogleProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      const authedEmail = cred.user.email;
      const authorized = isAuthorizedAdmin(authedEmail);
      return Boolean(authorized);
    } catch (popupErr: any) {
      if (
        popupErr.code === 'auth/popup-blocked' ||
        popupErr.code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, provider);
        return false;
      }
      throw popupErr;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      setProfile(snap.data() as UserProfile);
    }
  };

  // Secure Admin Authorization Check:
  // Strictly enforce that the user's verified authenticated email matches the authorized admin account.
  // Never grant admin access simply based on an untrusted or client-mutable profile document property.
  const isAdmin = Boolean(isAuthorizedAdmin(user?.email));

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginWithAdminGoogle,
        resetPassword,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
