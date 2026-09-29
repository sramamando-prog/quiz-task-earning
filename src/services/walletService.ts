import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  runTransaction, 
  addDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  QuizQuestion, 
  QuizAttempt, 
  WalletTransaction, 
  WithdrawalRequest, 
  UserProfile,
  EarningTask,
  TaskCompletion,
  DepositRequest,
  PaymentMethodType
} from '../types';

export interface QuizSubmitResult {
  isCorrect: boolean;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  amountChanged: number;
  message: string;
  explanation?: string;
  newBalance: number;
}

/**
 * Validates quiz answer securely against Firestore question document.
 * Applies +₹1 for correct or -₹1 for wrong answer (preventing negative balance).
 * Records atomic QuizAttempt and WalletTransaction within Firestore Transaction.
 */
export async function submitQuizAnswer(
  userId: string,
  questionId: string,
  selectedAnswer: 'A' | 'B' | 'C' | 'D'
): Promise<QuizSubmitResult> {
  const userRef = doc(db, 'users', userId);
  const questionRef = doc(db, 'quizQuestions', questionId);
  const attemptRef = doc(collection(db, 'quizAttempts'));
  const txRef = doc(collection(db, 'walletTransactions'));

  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error('User account not found.');
    }
    const userData = userDoc.data() as UserProfile;

    const qDoc = await transaction.get(questionRef);
    if (!qDoc.exists()) {
      throw new Error('Question not found or removed.');
    }
    const questionData = qDoc.data() as QuizQuestion;

    const currentBalance = userData.walletBalance || 0;
    const currentEarned = userData.totalEarned || 0;
    const isCorrect = selectedAnswer === questionData.correctAnswer;

    let amountChanged = 0;
    let message = '';
    let updatedBalance = currentBalance;
    let updatedEarned = currentEarned;
    let txType: 'QUIZ_CORRECT' | 'QUIZ_WRONG';

    if (isCorrect) {
      amountChanged = 1;
      updatedBalance = currentBalance + 1;
      updatedEarned = currentEarned + 1;
      message = 'Correct Answer! ₹1 added to your wallet.';
      txType = 'QUIZ_CORRECT';
    } else {
      if (currentBalance >= 1) {
        amountChanged = -1;
        updatedBalance = currentBalance - 1;
        message = 'Wrong answer! ₹1 deducted from your wallet.';
      } else {
        amountChanged = 0;
        updatedBalance = 0;
        message = 'Wrong answer! Insufficient wallet balance for this penalty (Balance stays ₹0).';
      }
      txType = 'QUIZ_WRONG';
    }

    // 1. Update user profile balance
    transaction.update(userRef, {
      walletBalance: updatedBalance,
      totalEarned: updatedEarned
    });

    // 2. Save quiz attempt
    const attempt: QuizAttempt = {
      id: attemptRef.id,
      userId,
      questionId,
      selectedAnswer,
      correctAnswer: questionData.correctAnswer,
      result: isCorrect ? 'CORRECT' : 'WRONG',
      amount: amountChanged,
      transactionType: txType,
      timestamp: new Date().toISOString()
    };
    transaction.set(attemptRef, attempt);

    // 3. Save wallet transaction
    if (amountChanged !== 0) {
      const walletTx: WalletTransaction = {
        id: txRef.id,
        userId,
        amount: amountChanged,
        type: txType,
        referenceId: attemptRef.id,
        description: isCorrect ? `Earned ₹1 for Quiz: ${questionData.category || 'General'}` : `Penalty ₹1 for Wrong Quiz Answer`,
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      };
      transaction.set(txRef, walletTx);
    }

    return {
      isCorrect,
      selectedAnswer,
      correctAnswer: questionData.correctAnswer,
      amountChanged,
      message,
      explanation: questionData.explanation,
      newBalance: updatedBalance
    };
  });
}

/**
 * Requests withdrawal with safe balance reservation.
 * Deducts amount immediately into locked state (status: PENDING).
 * If rejected by admin, the amount is refunded safely via refundWithdrawal().
 */
export async function requestWithdrawal(
  userId: string,
  userName: string,
  phoneNumber: string,
  upiId: string,
  amount: number
): Promise<{ success: boolean; message: string; withdrawalId: string }> {
  if (amount < 10) {
    throw new Error('Minimum withdrawal amount is ₹10.');
  }

  const userRef = doc(db, 'users', userId);
  const withdrawalRef = doc(collection(db, 'withdrawals'));
  const txRef = doc(collection(db, 'walletTransactions'));

  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found.');
    }
    const userData = userDoc.data() as UserProfile;
    const currentBalance = userData.walletBalance || 0;

    if (currentBalance < amount) {
      throw new Error(`Insufficient wallet balance. You have ₹${currentBalance}, but requested ₹${amount}.`);
    }

    const updatedBalance = currentBalance - amount;

    // Deduct & lock amount
    transaction.update(userRef, {
      walletBalance: updatedBalance
    });

    const withdrawalRequest: WithdrawalRequest = {
      id: withdrawalRef.id,
      userId,
      userName: userName.trim(),
      phoneNumber: phoneNumber.trim(),
      upiId: upiId.trim(),
      amount,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };
    transaction.set(withdrawalRef, withdrawalRequest);

    const walletTx: WalletTransaction = {
      id: txRef.id,
      userId,
      amount: -amount,
      type: 'WITHDRAWAL_LOCK',
      referenceId: withdrawalRef.id,
      description: `Withdrawal request for ₹${amount} to UPI: ${upiId.trim()} (Pending Processing)`,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };
    transaction.set(txRef, walletTx);

    return {
      success: true,
      message: `Withdrawal request for ₹${amount} submitted successfully! Admin will process your payout.`,
      withdrawalId: withdrawalRef.id
    };
  });
}

/**
 * Admin action: Mark withdrawal as SUCCESS.
 * Increases user's totalWithdrawn field.
 */
export async function approveWithdrawal(
  withdrawalId: string,
  adminEmail: string,
  adminNote?: string
) {
  const withdrawalRef = doc(db, 'withdrawals', withdrawalId);

  return await runTransaction(db, async (transaction) => {
    const wDoc = await transaction.get(withdrawalRef);
    if (!wDoc.exists()) {
      throw new Error('Withdrawal request not found.');
    }
    const wData = wDoc.data() as WithdrawalRequest;
    if (wData.status !== 'PENDING') {
      throw new Error(`Withdrawal is already marked as ${wData.status}`);
    }

    const userRef = doc(db, 'users', wData.userId);
    const userDoc = await transaction.get(userRef);
    if (userDoc.exists()) {
      const uData = userDoc.data() as UserProfile;
      transaction.update(userRef, {
        totalWithdrawn: (uData.totalWithdrawn || 0) + wData.amount
      });
    }

    transaction.update(withdrawalRef, {
      status: 'SUCCESS',
      processedAt: new Date().toISOString(),
      adminNote: adminNote || 'Paid via UPI successfully'
    });

    // Record audit log
    const auditRef = doc(collection(db, 'adminAuditLogs'));
    transaction.set(auditRef, {
      adminEmail,
      action: 'APPROVE_WITHDRAWAL',
      targetId: withdrawalId,
      details: `Approved payout of ₹${wData.amount} to UPI ${wData.upiId} for ${wData.userName}`,
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Admin action: Reject withdrawal.
 * Safely refunds the reserved balance to the user's wallet.
 */
export async function rejectWithdrawal(
  withdrawalId: string,
  adminEmail: string,
  rejectionReason: string
) {
  const withdrawalRef = doc(db, 'withdrawals', withdrawalId);

  return await runTransaction(db, async (transaction) => {
    const wDoc = await transaction.get(withdrawalRef);
    if (!wDoc.exists()) {
      throw new Error('Withdrawal request not found.');
    }
    const wData = wDoc.data() as WithdrawalRequest;
    if (wData.status !== 'PENDING') {
      throw new Error(`Withdrawal is already ${wData.status}`);
    }

    const userRef = doc(db, 'users', wData.userId);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error('User associated with withdrawal does not exist.');
    }
    const uData = userDoc.data() as UserProfile;

    // Refund locked balance
    const restoredBalance = (uData.walletBalance || 0) + wData.amount;
    transaction.update(userRef, {
      walletBalance: restoredBalance
    });

    transaction.update(withdrawalRef, {
      status: 'REJECTED',
      processedAt: new Date().toISOString(),
      adminNote: rejectionReason || 'Rejected by administrator'
    });

    // Create refund transaction log
    const txRef = doc(collection(db, 'walletTransactions'));
    const refundTx: WalletTransaction = {
      id: txRef.id,
      userId: wData.userId,
      amount: wData.amount,
      type: 'WITHDRAWAL_REJECT_REFUND',
      referenceId: withdrawalId,
      description: `Refund ₹${wData.amount} for rejected withdrawal (${rejectionReason || 'UPI invalid/verification issue'})`,
      status: 'COMPLETED',
      timestamp: new Date().toISOString()
    };
    transaction.set(txRef, refundTx);

    // Audit log
    const auditRef = doc(collection(db, 'adminAuditLogs'));
    transaction.set(auditRef, {
      adminEmail,
      action: 'REJECT_WITHDRAWAL',
      targetId: withdrawalId,
      details: `Rejected ₹${wData.amount} for UPI ${wData.upiId}. Reason: ${rejectionReason}`,
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * User completes an earning task.
 * Awards task reward securely to wallet balance and records transaction.
 */
export async function completeTask(
  userId: string,
  taskId: string
): Promise<{ success: boolean; reward: number; message: string }> {
  const userRef = doc(db, 'users', userId);
  const taskRef = doc(db, 'tasks', taskId);
  const completionRef = doc(collection(db, 'taskCompletions'));
  const txRef = doc(collection(db, 'walletTransactions'));

  return await runTransaction(db, async (transaction) => {
    const taskDoc = await transaction.get(taskRef);
    if (!taskDoc.exists()) {
      throw new Error('Task not found.');
    }
    const taskData = taskDoc.data() as EarningTask;
    if (taskData.status !== 'active') {
      throw new Error('Task is not active.');
    }

    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found.');
    }
    const userData = userDoc.data() as UserProfile;

    const reward = taskData.reward || 5;
    const newBalance = (userData.walletBalance || 0) + reward;
    const newTotal = (userData.totalEarned || 0) + reward;

    transaction.update(userRef, {
      walletBalance: newBalance,
      totalEarned: newTotal
    });

    const completion: TaskCompletion = {
      id: completionRef.id,
      userId,
      taskId,
      reward,
      completedAt: new Date().toISOString()
    };
    transaction.set(completionRef, completion);

    const walletTx: WalletTransaction = {
      id: txRef.id,
      userId,
      amount: reward,
      type: 'TASK_REWARD',
      referenceId: taskId,
      description: `Completed Task: ${taskData.title}`,
      status: 'COMPLETED',
      timestamp: new Date().toISOString()
    };
    transaction.set(txRef, walletTx);

    return {
      success: true,
      reward,
      message: `Congratulations! ₹${reward} added to your wallet for completing '${taskData.title}'.`
    };
  });
}

/**
 * User submits a deposit request.
 * Validates:
 * - Amount between ₹1 and ₹50
 * - UTR is exactly 12 digits
 * - UTR is unique (prevent duplicate submission)
 */
export async function submitDepositRequest(
  userId: string,
  userName: string,
  phoneNumber: string,
  amount: number,
  paymentMethod: PaymentMethodType,
  utrNumber: string
): Promise<{ success: boolean; message: string; depositId: string }> {
  const cleanUtr = utrNumber.trim();
  const cleanAmount = Number(amount);

  if (isNaN(cleanAmount) || cleanAmount < 1 || cleanAmount > 50) {
    throw new Error('Deposit amount must be between ₹1 and ₹50.');
  }

  if (!/^\d{12}$/.test(cleanUtr)) {
    throw new Error('UTR Number must be exactly 12 digits from your UPI payment receipt.');
  }

  if (!paymentMethod) {
    throw new Error('Please select a payment method (Google Pay, PhonePe, Paytm, or Other UPI).');
  }

  // Check for duplicate UTR in deposits collection
  const qDuplicate = query(collection(db, 'deposits'), where('utrNumber', '==', cleanUtr));
  const snapDuplicate = await getDocs(qDuplicate);
  if (!snapDuplicate.empty) {
    throw new Error('This UTR Number has already been submitted. Please check your transaction details.');
  }

  const depositRef = doc(collection(db, 'deposits'));
  const depositRecord: DepositRequest = {
    id: depositRef.id,
    userId,
    userName: userName.trim(),
    phoneNumber: phoneNumber.trim(),
    amount: cleanAmount,
    utrNumber: cleanUtr,
    paymentMethod,
    status: 'PENDING',
    requestedAt: new Date().toISOString()
  };

  await setDoc(depositRef, depositRecord);

  return {
    success: true,
    message: `Deposit request of ₹${cleanAmount} submitted successfully! Admin will verify and credit your wallet shortly.`,
    depositId: depositRef.id
  };
}

/**
 * Admin action: CONFIRM deposit.
 * Uses atomic Firestore transaction to:
 * 1. Verify deposit is PENDING (prevent double credit)
 * 2. Add deposit amount to user's walletBalance and totalEarned
 * 3. Create DEPOSIT_CREDIT transaction in walletTransactions
 * 4. Update deposit status to CONFIRMED
 * 5. Log in adminAuditLogs
 */
export async function confirmDeposit(
  depositId: string,
  adminEmail: string,
  adminNote?: string
) {
  const depositRef = doc(db, 'deposits', depositId);

  return await runTransaction(db, async (transaction) => {
    const dDoc = await transaction.get(depositRef);
    if (!dDoc.exists()) {
      throw new Error('Deposit request not found.');
    }
    const dData = dDoc.data() as DepositRequest;
    if (dData.status !== 'PENDING') {
      throw new Error(`Deposit has already been marked as ${dData.status}.`);
    }

    const userRef = doc(db, 'users', dData.userId);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error('User associated with this deposit does not exist.');
    }
    const uData = userDoc.data() as UserProfile;

    const newBalance = (uData.walletBalance || 0) + dData.amount;
    const newTotalEarned = (uData.totalEarned || 0) + dData.amount;

    // Credit user's wallet
    transaction.update(userRef, {
      walletBalance: newBalance,
      totalEarned: newTotalEarned
    });

    // Mark deposit as CONFIRMED
    transaction.update(depositRef, {
      status: 'CONFIRMED',
      processedAt: new Date().toISOString(),
      adminNote: adminNote || 'Payment verified and credited to wallet'
    });

    // Create wallet transaction record
    const txRef = doc(collection(db, 'walletTransactions'));
    const walletTx: WalletTransaction = {
      id: txRef.id,
      userId: dData.userId,
      amount: dData.amount,
      type: 'DEPOSIT_CREDIT',
      referenceId: depositId,
      description: `Deposit via ${dData.paymentMethod} (UTR: ${dData.utrNumber})`,
      status: 'COMPLETED',
      timestamp: new Date().toISOString()
    };
    transaction.set(txRef, walletTx);

    // Record audit log
    const auditRef = doc(collection(db, 'adminAuditLogs'));
    transaction.set(auditRef, {
      adminEmail,
      action: 'CONFIRM_DEPOSIT',
      targetId: depositId,
      details: `Confirmed deposit of ₹${dData.amount} for user ${dData.userName} (UTR: ${dData.utrNumber})`,
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Admin action: REJECT deposit.
 * Marks deposit as REJECTED with rejection note.
 */
export async function rejectDeposit(
  depositId: string,
  adminEmail: string,
  rejectionReason: string
) {
  const depositRef = doc(db, 'deposits', depositId);

  return await runTransaction(db, async (transaction) => {
    const dDoc = await transaction.get(depositRef);
    if (!dDoc.exists()) {
      throw new Error('Deposit request not found.');
    }
    const dData = dDoc.data() as DepositRequest;
    if (dData.status !== 'PENDING') {
      throw new Error(`Deposit has already been processed as ${dData.status}.`);
    }

    transaction.update(depositRef, {
      status: 'REJECTED',
      processedAt: new Date().toISOString(),
      adminNote: rejectionReason || 'Payment verification failed'
    });

    const auditRef = doc(collection(db, 'adminAuditLogs'));
    transaction.set(auditRef, {
      adminEmail,
      action: 'REJECT_DEPOSIT',
      targetId: depositId,
      details: `Rejected deposit of ₹${dData.amount} for user ${dData.userName}. Reason: ${rejectionReason}`,
      timestamp: new Date().toISOString()
    });
  });
}

