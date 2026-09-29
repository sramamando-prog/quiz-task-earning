import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  QuizQuestion, 
  EarningTask, 
  WithdrawalRequest, 
  UserProfile, 
  ReferralRecord,
  DepositRequest
} from '../types';
import { approveWithdrawal, rejectWithdrawal, confirmDeposit, rejectDeposit } from '../services/walletService';
import { 
  Users, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Award,
  ListOrdered,
  LogOut,
  ChevronRight,
  Send,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface AdminPanelProps {
  onBackToApp: () => void;
}

type AdminTab = 'overview' | 'deposits' | 'withdrawals' | 'questions' | 'tasks' | 'users' | 'referrals';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToApp }) => {
  const { user, profile, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Real-time collections
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [tasks, setTasks] = useState<EarningTask[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);

  // Processing state
  const [processingDepositId, setProcessingDepositId] = useState<string | null>(null);
  const [rejectDepositPromptId, setRejectDepositPromptId] = useState<string | null>(null);
  const [rejectDepositReason, setRejectDepositReason] = useState('Invalid or unverified UTR number.');

  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);
  const [rejectPromptId, setRejectPromptId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Invalid UPI ID provided.');

  // Question modal / form state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [qText, setQText] = useState('');
  const [qA, setQA] = useState('');
  const [qB, setQB] = useState('');
  const [qC, setQC] = useState('');
  const [qD, setQD] = useState('');
  const [qCorrect, setQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [qCategory, setQCategory] = useState('General');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [qExplanation, setQExplanation] = useState('');

  // Task modal / form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<EarningTask | null>(null);
  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tReward, setTReward] = useState(5);
  const [tType, setTType] = useState<EarningTask['taskType']>('Social');
  const [tInstructions, setTInstructions] = useState('');
  const [tUrl, setTUrl] = useState('');
  const [tLogo, setTLogo] = useState('');

  // User search/filter
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Real-time subscribers
  useEffect(() => {
    if (!isAdmin) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setUsers(list);
    });

    const unsubDeposits = onSnapshot(collection(db, 'deposits'), (snap) => {
      const list: DepositRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setDeposits(list);
    });

    const unsubWithdrawals = onSnapshot(collection(db, 'withdrawals'), (snap) => {
      const list: WithdrawalRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setWithdrawals(list);
    });

    const unsubQuestions = onSnapshot(collection(db, 'quizQuestions'), (snap) => {
      const list: QuizQuestion[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setQuestions(list);
    });

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      const list: EarningTask[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setTasks(list);
    });

    const unsubReferrals = onSnapshot(collection(db, 'referrals'), (snap) => {
      const list: ReferralRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime());
      setReferrals(list);
    });

    return () => {
      unsubUsers();
      unsubDeposits();
      unsubWithdrawals();
      unsubQuestions();
      unsubTasks();
      unsubReferrals();
    };
  }, [isAdmin]);

  // Security barrier
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-rose-100 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl mx-auto flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            This account ({user?.email || 'Guest'}) is not authorized as an administrator.
            Only verified owner credentials have administrative clearance.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onBackToApp}
              className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Return to App
            </button>
            <button
              onClick={() => logout()}
              className="px-4 py-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Confirm Deposit
  const handleConfirmDeposit = async (dId: string) => {
    if (!user?.email) return;
    setProcessingDepositId(dId);
    try {
      await confirmDeposit(dId, user.email, 'Payment verified and credited to wallet');
    } catch (err: any) {
      alert(`Confirm error: ${err.message}`);
    } finally {
      setProcessingDepositId(null);
    }
  };

  // Handle Reject Deposit
  const handleRejectDeposit = async (dId: string) => {
    if (!user?.email) return;
    setProcessingDepositId(dId);
    try {
      await rejectDeposit(dId, user.email, rejectDepositReason);
      setRejectDepositPromptId(null);
      setRejectDepositReason('Invalid or unverified UTR number.');
    } catch (err: any) {
      alert(`Reject error: ${err.message}`);
    } finally {
      setProcessingDepositId(null);
    }
  };

  // Handle Approve Withdrawal
  const handleApprove = async (wId: string) => {
    if (!user?.email) return;
    setProcessingWithdrawalId(wId);
    try {
      await approveWithdrawal(wId, user.email, 'Payout transferred successfully via UPI');
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  // Handle Reject Withdrawal (Safe Refund)
  const handleReject = async (wId: string) => {
    if (!user?.email) return;
    setProcessingWithdrawalId(wId);
    try {
      await rejectWithdrawal(wId, user.email, rejectReason);
      setRejectPromptId(null);
      setRejectReason('Invalid UPI ID provided.');
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  // Question CRUD
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !qA || !qB || !qC || !qD) {
      alert('Please fill out question and all 4 options.');
      return;
    }

    try {
      const qId = editingQuestion ? editingQuestion.id : doc(collection(db, 'quizQuestions')).id;
      const questionData: QuizQuestion = {
        id: qId,
        question: qText.trim(),
        optionA: qA.trim(),
        optionB: qB.trim(),
        optionC: qC.trim(),
        optionD: qD.trim(),
        correctAnswer: qCorrect,
        category: qCategory.trim() || 'General',
        difficulty: qDifficulty,
        explanation: qExplanation.trim(),
        status: editingQuestion ? editingQuestion.status : 'active',
        createdAt: editingQuestion ? editingQuestion.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'quizQuestions', qId), questionData, { merge: true });
      setShowQuestionModal(false);
      setEditingQuestion(null);
      resetQuestionForm();
    } catch (err: any) {
      alert(`Error saving question: ${err.message}`);
    }
  };

  const resetQuestionForm = () => {
    setQText('');
    setQA('');
    setQB('');
    setQC('');
    setQD('');
    setQCorrect('A');
    setQCategory('General');
    setQDifficulty('Easy');
    setQExplanation('');
  };

  const handleEditQuestion = (q: QuizQuestion) => {
    setEditingQuestion(q);
    setQText(q.question);
    setQA(q.optionA);
    setQB(q.optionB);
    setQC(q.optionC);
    setQD(q.optionD);
    setQCorrect(q.correctAnswer);
    setQCategory(q.category);
    setQDifficulty(q.difficulty);
    setQExplanation(q.explanation || '');
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      await deleteDoc(doc(db, 'quizQuestions', id));
    }
  };

  const handleToggleQuestionStatus = async (q: QuizQuestion) => {
    const newStatus = q.status === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, 'quizQuestions', q.id), { status: newStatus });
  };

  // Task CRUD
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim() || !tDesc.trim()) {
      alert('Please fill out task title and description.');
      return;
    }

    try {
      const taskId = editingTask ? editingTask.id : doc(collection(db, 'tasks')).id;
      const taskData: EarningTask = {
        id: taskId,
        title: tTitle.trim(),
        description: tDesc.trim(),
        reward: Number(tReward) || 5,
        taskType: tType,
        instructions: tInstructions.trim(),
        externalUrl: tUrl.trim(),
        logo: tLogo.trim() || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120',
        status: editingTask ? editingTask.status : 'active',
        createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'tasks', taskId), taskData, { merge: true });
      setShowTaskModal(false);
      setEditingTask(null);
      resetTaskForm();
    } catch (err: any) {
      alert(`Error saving task: ${err.message}`);
    }
  };

  const resetTaskForm = () => {
    setTTitle('');
    setTDesc('');
    setTReward(5);
    setTType('Social');
    setTInstructions('');
    setTUrl('');
    setTLogo('');
  };

  const handleEditTask = (t: EarningTask) => {
    setEditingTask(t);
    setTTitle(t.title);
    setTDesc(t.description);
    setTReward(t.reward);
    setTType(t.taskType);
    setTInstructions(t.instructions || '');
    setTUrl(t.externalUrl || '');
    setTLogo(t.logo || '');
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Delete this task?')) {
      await deleteDoc(doc(db, 'tasks', id));
    }
  };

  const handleToggleTaskStatus = async (t: EarningTask) => {
    const newStatus = t.status === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, 'tasks', t.id), { status: newStatus });
  };

  // Toggle user suspension
  const handleToggleUserStatus = async (u: UserProfile) => {
    const newStatus = u.accountStatus === 'active' ? 'suspended' : 'active';
    await updateDoc(doc(db, 'users', u.uid), { accountStatus: newStatus });
  };

  // Dashboard Aggregates
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.accountStatus === 'active').length;
  const pendingDeposits = deposits.filter((d) => d.status === 'PENDING');
  const confirmedDeposits = deposits.filter((d) => d.status === 'CONFIRMED');
  const totalDepositedAmount = confirmedDeposits.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingDepositsAmount = pendingDeposits.reduce((acc, curr) => acc + curr.amount, 0);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'PENDING');
  const successWithdrawals = withdrawals.filter((w) => w.status === 'SUCCESS');
  const rejectedWithdrawals = withdrawals.filter((w) => w.status === 'REJECTED');
  const totalPaidAmount = successWithdrawals.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingAmount = pendingWithdrawals.reduce((acc, curr) => acc + curr.amount, 0);
  const totalEarningsDistributed = users.reduce((acc, curr) => acc + (curr.totalEarned || 0), 0);
  const totalReferralRewards = referrals.reduce((acc, curr) => acc + (curr.rewardAmount || 10), 0);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phoneNumber?.includes(userSearch) ||
      u.referralCode?.toLowerCase().includes(userSearch.toLowerCase());
    const matchFilter = userFilter === 'all' || u.accountStatus === userFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToApp}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>Quiz Earning Task</span>
                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-md">
                  ADMIN
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Authorized: {user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Live</span>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-slate-200">
          {[
            { id: 'overview', label: 'Overview & Stats', count: null },
            { id: 'deposits', label: 'User Deposits', count: pendingDeposits.length },
            { id: 'withdrawals', label: 'Withdrawal Requests', count: pendingWithdrawals.length },
            { id: 'questions', label: 'Quiz Questions', count: questions.length },
            { id: 'tasks', label: 'Tasks', count: tasks.length },
            { id: 'users', label: 'Users', count: users.length },
            { id: 'referrals', label: 'Referrals Live', count: referrals.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : (tab.id === 'withdrawals' || tab.id === 'deposits') && tab.count > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 1. OVERVIEW & STATS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Total Users</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  {activeUsers} active accounts
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Pending Withdrawals</span>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  ₹{pendingAmount}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {pendingWithdrawals.length} requests awaiting payout
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Total User Deposits</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  ₹{totalDepositedAmount}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {confirmedDeposits.length} confirmed • {pendingDeposits.length} pending (₹{pendingDepositsAmount})
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Total Payouts Made</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  ₹{totalPaidAmount}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {successWithdrawals.length} completed UPI payouts
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Earnings Distributed</span>
                <div className="text-2xl font-black text-indigo-600 mt-1">
                  ₹{totalEarningsDistributed}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Quizzes, Tasks & Referrals
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Quiz Content</span>
                <div className="text-xl font-bold text-slate-900 mt-1">{questions.length} Questions</div>
                <div className="text-xs text-slate-400 mt-1">
                  {questions.filter((q) => q.status === 'active').length} active in quiz rotation
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Active Tasks</span>
                <div className="text-xl font-bold text-slate-900 mt-1">{tasks.length} Tasks</div>
                <div className="text-xs text-slate-400 mt-1">
                  {tasks.filter((t) => t.status === 'active').length} published for users
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Referrals Tracked</span>
                <div className="text-xl font-bold text-slate-900 mt-1">{referrals.length} Invites</div>
                <div className="text-xs text-slate-400 mt-1">
                  ₹{totalReferralRewards} total referral payouts credited
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 p-6 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base">Quick Administration Actions</h3>
                <p className="text-xs text-indigo-200 mt-1">
                  Add quiz questions, approve pending UPI withdrawals, or create new earning tasks.
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => { setActiveTab('withdrawals'); }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Review Withdrawals ({pendingWithdrawals.length})
                </button>
                <button
                  onClick={() => { setActiveTab('questions'); setShowQuestionModal(true); }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-white text-indigo-900 font-bold rounded-xl text-xs hover:bg-indigo-50 transition cursor-pointer"
                >
                  + Add Question
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. USER DEPOSITS */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">User Deposits Management</h2>
                <p className="text-xs text-slate-500">
                  Verify user 12-digit UTR on your receiving UPI app (9335255724@ptyes), then click CONFIRM to credit wallet.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                {pendingDeposits.length} Pending Deposits (₹{pendingDepositsAmount})
              </span>
            </div>

            {deposits.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
                No deposit requests yet.
              </div>
            ) : (
              <div className="space-y-3">
                {deposits.map((d) => {
                  const isProcessing = processingDepositId === d.id;
                  const isRejecting = rejectDepositPromptId === d.id;

                  return (
                    <div
                      key={d.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-900">₹{d.amount}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              d.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {d.status}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-semibold rounded-md">
                            {d.paymentMethod}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 font-medium">
                          User: <span className="font-bold text-slate-900">{d.userName}</span> • Phone: {d.phoneNumber || 'N/A'}
                        </div>

                        <div className="text-xs flex items-center gap-2">
                          <span className="text-slate-500">12-Digit UTR:</span>
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 select-all tracking-wider">
                            {d.utrNumber}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          Submitted: {new Date(d.requestedAt).toLocaleString()}
                          {d.processedAt && (
                            <span className="ml-2">• Processed: {new Date(d.processedAt).toLocaleString()}</span>
                          )}
                          {d.adminNote && (
                            <span className="ml-2 font-medium text-slate-600">• Note: {d.adminNote}</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      {d.status === 'PENDING' && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                          {isRejecting ? (
                            <div className="flex items-center gap-2 bg-rose-50 p-2 rounded-2xl border border-rose-200">
                              <input
                                type="text"
                                placeholder="Rejection reason..."
                                value={rejectDepositReason}
                                onChange={(e) => setRejectDepositReason(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-xs focus:outline-none"
                              />
                              <button
                                onClick={() => handleRejectDeposit(d.id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                              >
                                Confirm Reject
                              </button>
                              <button
                                onClick={() => setRejectDepositPromptId(null)}
                                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleConfirmDeposit(d.id)}
                                disabled={isProcessing}
                                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>CONFIRM & Credit (₹{d.amount})</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  setRejectDepositPromptId(d.id);
                                  setRejectDepositReason('UTR verification failed / invalid reference number.');
                                }}
                                disabled={isProcessing}
                                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>REJECT</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. WITHDRAWAL REQUESTS */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Withdrawal Management</h2>
                <p className="text-xs text-slate-500">
                  Verify user UPI details, transfer payment via your UPI app, then mark as SUCCESS.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                {pendingWithdrawals.length} Pending Actions
              </span>
            </div>

            {withdrawals.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
                No withdrawal requests have been placed yet.
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => {
                  const isProcessing = processingWithdrawalId === w.id;
                  const isRejectingThis = rejectPromptId === w.id;

                  return (
                    <div
                      key={w.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-900">₹{w.amount}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              w.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : w.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 font-medium">
                          User: <span className="font-bold text-slate-900">{w.userName}</span> • Phone: {w.phoneNumber}
                        </div>

                        <div className="text-xs flex items-center gap-2">
                          <span className="text-slate-500">UPI Address:</span>
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 select-all">
                            {w.upiId}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          Requested: {new Date(w.requestedAt).toLocaleString()}
                          {w.adminNote && <span className="ml-2 font-medium text-slate-600">• Note: {w.adminNote}</span>}
                        </div>
                      </div>

                      {/* Action buttons */}
                      {w.status === 'PENDING' && (
                        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                          {isRejectingThis ? (
                            <div className="flex items-center gap-2 bg-rose-50 p-2 rounded-2xl border border-rose-200">
                              <input
                                type="text"
                                placeholder="Rejection reason..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-xs focus:outline-none"
                              />
                              <button
                                onClick={() => handleReject(w.id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                              >
                                Confirm Reject & Refund
                              </button>
                              <button
                                onClick={() => setRejectPromptId(null)}
                                className="text-xs text-slate-500 hover:text-slate-800"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApprove(w.id)}
                                disabled={isProcessing}
                                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Mark SUCCESS (Paid)</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => { setRejectPromptId(w.id); setRejectReason('Invalid UPI Address.'); }}
                                disabled={isProcessing}
                                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>REJECT (Refund Money)</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. QUIZ QUESTIONS MANAGEMENT */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Quiz Questions ({questions.length})</h2>
                <p className="text-xs text-slate-500">
                  Manage questions shown to users. Correct answers reward ₹1, wrong answers deduct ₹1.
                </p>
              </div>
              <button
                onClick={() => { resetQuestionForm(); setEditingQuestion(null); setShowQuestionModal(true); }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {q.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {q.difficulty}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          q.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{q.question}</h3>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded-xl border ${q.correctAnswer === 'A' ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        A: {q.optionA}
                      </div>
                      <div className={`p-2 rounded-xl border ${q.correctAnswer === 'B' ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        B: {q.optionB}
                      </div>
                      <div className={`p-2 rounded-xl border ${q.correctAnswer === 'C' ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        C: {q.optionC}
                      </div>
                      <div className={`p-2 rounded-xl border ${q.correctAnswer === 'D' ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        D: {q.optionD}
                      </div>
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 italic">
                        Explanation: {q.explanation}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleToggleQuestionStatus(q)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                    >
                      {q.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEditQuestion(q)}
                      className="p-2 rounded-xl border border-slate-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. TASKS MANAGEMENT */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Task Management ({tasks.length})</h2>
                <p className="text-xs text-slate-500">
                  Publish earning tasks with custom rewards and instructions for users.
                </p>
              </div>
              <button
                onClick={() => { resetTaskForm(); setEditingTask(null); setShowTaskModal(true); }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={t.logo}
                      alt={t.title}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-100"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{t.title}</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                          +₹{t.reward}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                          {t.taskType}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            t.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                      {t.externalUrl && (
                        <a
                          href={t.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 mt-1 font-medium"
                        >
                          <span>{t.externalUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleToggleTaskStatus(t)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                    >
                      {t.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEditTask(t)}
                      className="p-2 rounded-xl border border-slate-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">User Management ({filteredUsers.length})</h2>
                <p className="text-xs text-slate-500">
                  Audited view of registered user wallets, referrals, and account status.
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, email, phone..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <select
                  value={userFilter}
                  onChange={(e: any) => setUserFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="all">All Accounts</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Wallet</th>
                      <th className="px-4 py-3">Lifetime Earned</th>
                      <th className="px-4 py-3">Withdrawn</th>
                      <th className="px-4 py-3">Referrals</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 font-medium">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                          <div className="text-[10px] text-indigo-600 font-mono">Ref: {u.referralCode}</div>
                        </td>
                        <td className="px-4 py-3">{u.phoneNumber || '—'}</td>
                        <td className="px-4 py-3 font-black text-indigo-900">₹{u.walletBalance ?? 0}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">₹{u.totalEarned ?? 0}</td>
                        <td className="px-4 py-3 font-semibold text-slate-500">₹{u.totalWithdrawn ?? 0}</td>
                        <td className="px-4 py-3">{u.successfulReferrals ?? 0}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.accountStatus === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {u.accountStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                              u.accountStatus === 'active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. REFERRALS LIVE TRACKING */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Live Referral Activity ({referrals.length})</h2>
              <p className="text-xs text-slate-500">
                Audited stream of new user registrations initiated via referral links. ₹10 credited per invite.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Referrer</th>
                      <th className="px-4 py-3">Referred New User</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {referrals.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900">{r.referrerName}</span>
                          <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                            {r.referrerUid}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{r.referredName}</div>
                          <div className="text-[11px] text-slate-400">{r.referredEmail}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(r.referralDate).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            SUCCESS
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600">
                          +₹{r.rewardAmount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* QUESTION MODAL */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-slate-900 mb-4">
              {editingQuestion ? 'Edit Quiz Question' : 'Add New Quiz Question'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Text</label>
                <textarea
                  required
                  rows={2}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. Which planet is closest to the Sun?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Option A</label>
                  <input
                    type="text"
                    required
                    value={qA}
                    onChange={(e) => setQA(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Option B</label>
                  <input
                    type="text"
                    required
                    value={qB}
                    onChange={(e) => setQB(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Option C</label>
                  <input
                    type="text"
                    required
                    value={qC}
                    onChange={(e) => setQC(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Option D</label>
                  <input
                    type="text"
                    required
                    value={qD}
                    onChange={(e) => setQD(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Correct Answer</label>
                  <select
                    value={qCorrect}
                    onChange={(e: any) => setQCorrect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={qCategory}
                    onChange={(e) => setQCategory(e.target.value)}
                    placeholder="General / Science"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={qDifficulty}
                    onChange={(e: any) => setQDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Why is this answer correct? (Shown to user after submitting)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Save Question
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-5 py-3 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-slate-900 mb-4">
              {editingTask ? 'Edit Task' : 'Add New Earning Task'}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)}
                  placeholder="e.g. Join Official Telegram Channel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reward (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={tReward}
                    onChange={(e) => setTReward(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Task Type</label>
                  <select
                    value={tType}
                    onChange={(e: any) => setTType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Social">Social</option>
                    <option value="App Install">App Install</option>
                    <option value="Survey">Survey</option>
                    <option value="Visit">Website Visit</option>
                    <option value="Video">Video</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={tDesc}
                  onChange={(e) => setTDesc(e.target.value)}
                  placeholder="Short overview of what the user needs to do..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions (Step-by-step)</label>
                <textarea
                  rows={3}
                  value={tInstructions}
                  onChange={(e) => setTInstructions(e.target.value)}
                  placeholder="1. Open link&#10;2. Subscribe&#10;3. Return to claim"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">External Target URL</label>
                <input
                  type="url"
                  value={tUrl}
                  onChange={(e) => setTUrl(e.target.value)}
                  placeholder="https://t.me/yourchannel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Logo Image URL</label>
                <input
                  type="url"
                  value={tLogo}
                  onChange={(e) => setTLogo(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Save Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-5 py-3 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
