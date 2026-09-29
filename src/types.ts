export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
  profileCreatedAt: string; // ISO string
  referralCode: string;
  referredBy: string | null;
  walletBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalReferrals: number;
  successfulReferrals: number;
  accountStatus: 'active' | 'suspended';
  isAdmin?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  result: 'CORRECT' | 'WRONG';
  amount: number; // +1 or -1 or 0
  transactionType: 'QUIZ_CORRECT' | 'QUIZ_WRONG';
  timestamp: string;
}

export type TransactionType =
  | 'QUIZ_CORRECT'
  | 'QUIZ_WRONG'
  | 'REFERRAL_REWARD'
  | 'TASK_REWARD'
  | 'DEPOSIT_CREDIT'
  | 'WITHDRAWAL_LOCK'
  | 'WITHDRAWAL_SUCCESS'
  | 'WITHDRAWAL_REJECT_REFUND';

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number; // Positive or negative
  type: TransactionType;
  referenceId: string;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  timestamp: string;
}

export type DepositStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';
export type PaymentMethodType = 'Google Pay' | 'PhonePe' | 'Paytm' | 'Other UPI';

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  phoneNumber: string;
  amount: number;
  utrNumber: string;
  paymentMethod: PaymentMethodType;
  status: DepositStatus;
  requestedAt: string;
  processedAt?: string;
  adminNote?: string;
}

export type WithdrawalStatus = 'PENDING' | 'SUCCESS' | 'REJECTED';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  phoneNumber: string;
  upiId: string;
  amount: number;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
  adminNote?: string;
}

export interface ReferralRecord {
  id: string;
  referrerUid: string;
  referrerName: string;
  referredUid: string;
  referredName: string;
  referredEmail: string;
  referredPhone: string;
  referralDate: string;
  status: 'SUCCESS' | 'PENDING';
  rewardAmount: number;
}

export interface EarningTask {
  id: string;
  title: string;
  description: string;
  logo: string;
  reward: number;
  taskType: 'App Install' | 'Survey' | 'Social' | 'Visit' | 'Video' | 'Special';
  instructions: string;
  externalUrl: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface TaskCompletion {
  id: string;
  userId: string;
  taskId: string;
  reward: number;
  completedAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  targetId: string;
  details: string;
  timestamp: string;
}
