import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, auth, isAuthorizedAdmin } from '../firebase';
import { QuizQuestion, EarningTask } from '../types';

export const INITIAL_QUESTIONS: Omit<QuizQuestion, 'id'>[] = [
  {
    question: 'What is the national currency of India? [Sample Question]',
    optionA: 'Indian Dollar',
    optionB: 'Indian Rupee (INR)',
    optionC: 'Dinar',
    optionD: 'Euro',
    correctAnswer: 'B',
    explanation: '[Sample/Demo Question] The official currency of India is the Indian Rupee (₹/INR).',
    category: 'Demo Sample',
    difficulty: 'Easy',
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    question: 'What is the full form of UPI in online payments? [Sample Question]',
    optionA: 'Unified Payments Interface',
    optionB: 'Universal Public Internet',
    optionC: 'United People India',
    optionD: 'Unique Pay Identification',
    correctAnswer: 'A',
    explanation: '[Sample/Demo Question] UPI stands for Unified Payments Interface, developed by NPCI.',
    category: 'Demo Sample',
    difficulty: 'Easy',
    status: 'active',
    createdAt: '2025-01-01T00:01:00.000Z'
  }
];

export const INITIAL_TASKS: Omit<EarningTask, 'id'>[] = [
  {
    title: 'Subscribe to Quiz Channel',
    description: 'Subscribe to our official Telegram/YouTube announcements channel.',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    reward: 5,
    taskType: 'Social',
    instructions: '1. Click open link.\n2. Subscribe and turn on notifications.\n3. Return here and tap "Verify & Claim".',
    externalUrl: 'https://telegram.org',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Rate Quiz App 5 Stars',
    description: 'Leave an honest 5-star review on Google Play Store.',
    logo: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=120&auto=format&fit=crop&q=80',
    reward: 10,
    taskType: 'App Install',
    instructions: '1. Visit the store listing.\n2. Give a positive 5-star rating with feedback.\n3. Return to claim your reward instantly.',
    externalUrl: 'https://play.google.com',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    title: 'Daily Survey & Feedback',
    description: 'Answer 3 quick feedback questions about your quiz experience.',
    logo: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=120&auto=format&fit=crop&q=80',
    reward: 3,
    taskType: 'Survey',
    instructions: 'Complete a brief survey to help us introduce higher prize pools and new quiz topics.',
    externalUrl: 'https://docs.google.com/forms',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

export async function seedInitialDataIfEmpty(forceSeedFromAdmin: boolean = false) {
  try {
    // Only attempt seeding if explicitly triggered by the Admin or if the current session is the authorized admin.
    // In Firestore rules, quizQuestions and tasks collections are strictly writable by Admin only.
    const currentUser = auth.currentUser;
    const isCurrentAdmin = isAuthorizedAdmin(currentUser?.email);

    if (!isCurrentAdmin && !forceSeedFromAdmin) {
      // Normal unauthenticated or non-admin users should not attempt writing to admin-only collections
      return;
    }

    const qSnap = await getDocs(collection(db, 'quizQuestions'));
    if (qSnap.empty) {
      for (const q of INITIAL_QUESTIONS) {
        const docRef = doc(collection(db, 'quizQuestions'));
        await setDoc(docRef, { ...q, id: docRef.id });
      }
    }

    const tSnap = await getDocs(collection(db, 'tasks'));
    if (tSnap.empty) {
      for (const t of INITIAL_TASKS) {
        const docRef = doc(collection(db, 'tasks'));
        await setDoc(docRef, { ...t, id: docRef.id });
      }
    }
  } catch (err: any) {
    // Suppress permission noise gracefully if rules restrict client write
    if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
      return;
    }
    console.error('Seeding initial data error:', err);
  }
}
