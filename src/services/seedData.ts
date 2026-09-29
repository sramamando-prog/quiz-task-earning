import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { QuizQuestion, EarningTask } from '../types';

export const INITIAL_QUESTIONS: Omit<QuizQuestion, 'id'>[] = [
  {
    question: 'What is the national currency of India?',
    optionA: 'Indian Dollar',
    optionB: 'Indian Rupee (INR)',
    optionC: 'Dinar',
    optionD: 'Euro',
    correctAnswer: 'B',
    explanation: 'The official currency of India is the Indian Rupee (₹/INR).',
    category: 'Finance & General',
    difficulty: 'Easy',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    question: 'Which is the largest planet in our Solar System?',
    optionA: 'Earth',
    optionB: 'Mars',
    optionC: 'Jupiter',
    optionD: 'Saturn',
    correctAnswer: 'C',
    explanation: 'Jupiter is by far the largest planet, having more mass than all other planets combined.',
    category: 'Science',
    difficulty: 'Easy',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    question: 'What is the full form of UPI in online payments?',
    optionA: 'Unified Payments Interface',
    optionB: 'Universal Public Internet',
    optionC: 'United People India',
    optionD: 'Unique Pay Identification',
    correctAnswer: 'A',
    explanation: 'UPI stands for Unified Payments Interface, developed by NPCI.',
    category: 'Technology & Banking',
    difficulty: 'Easy',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    question: 'Which Indian city is known as the "Silicon Valley of India"?',
    optionA: 'Mumbai',
    optionB: 'Hyderabad',
    optionC: 'Bengaluru',
    optionD: 'Pune',
    correctAnswer: 'C',
    explanation: 'Bengaluru is renowned as the Silicon Valley of India due to its tech ecosystem.',
    category: 'General Knowledge',
    difficulty: 'Easy',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    question: 'How many bytes are there in one Kilobyte (KB)?',
    optionA: '512 bytes',
    optionB: '1000 bytes',
    optionC: '1024 bytes',
    optionD: '2048 bytes',
    correctAnswer: 'C',
    explanation: 'In binary measurement, 1 Kilobyte equals 1024 bytes.',
    category: 'Computers',
    difficulty: 'Medium',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    question: 'Who is known as the Father of the Indian Constitution?',
    optionA: 'Mahatma Gandhi',
    optionB: 'Dr. B. R. Ambedkar',
    optionC: 'Jawaharlal Nehru',
    optionD: 'Sardar Vallabhbhai Patel',
    correctAnswer: 'B',
    explanation: 'Dr. Bhimrao Ramji Ambedkar served as the chairman of the Drafting Committee.',
    category: 'History',
    difficulty: 'Easy',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    question: 'Which gas is most abundant in the Earth’s atmosphere?',
    optionA: 'Oxygen',
    optionB: 'Carbon Dioxide',
    optionC: 'Nitrogen',
    optionD: 'Argon',
    correctAnswer: 'C',
    explanation: 'Nitrogen accounts for approximately 78% of Earth’s atmosphere.',
    category: 'Science',
    difficulty: 'Medium',
    status: 'active',
    createdAt: new Date().toISOString()
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

export async function seedInitialDataIfEmpty() {
  try {
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
  } catch (err) {
    console.error('Seeding initial data error:', err);
  }
}
