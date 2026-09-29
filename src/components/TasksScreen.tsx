import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { EarningTask, TaskCompletion } from '../types';
import { completeTask } from '../services/walletService';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  Coins, 
  Sparkles, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TasksScreenProps {
  onBack: () => void;
  onOpenWallet: () => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({ onBack, onOpenWallet }) => {
  const { profile, user } = useAuth();
  const [tasks, setTasks] = useState<EarningTask[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<EarningTask | null>(null);
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTasks() {
      if (!user) return;
      try {
        setLoading(true);
        // Load active tasks
        const tQ = query(collection(db, 'tasks'), where('status', '==', 'active'));
        const tSnap = await getDocs(tQ);
        const list: EarningTask[] = [];
        tSnap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setTasks(list);

        // Load user's already completed tasks
        const cQ = query(collection(db, 'taskCompletions'), where('userId', '==', user.uid));
        const cSnap = await getDocs(cQ);
        const compSet = new Set<string>();
        cSnap.forEach((d) => compSet.add(d.data().taskId));
        setCompletedTaskIds(compSet);
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [user]);

  const handleStartTask = (task: EarningTask) => {
    setActiveTask(task);
    setMessage(null);
    setError(null);
    if (task.externalUrl) {
      window.open(task.externalUrl, '_blank');
    }
  };

  const handleClaimReward = async (taskId: string) => {
    if (!user || completing) return;
    setCompleting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await completeTask(user.uid, taskId);
      setMessage(res.message);
      setCompletedTaskIds((prev) => new Set([...prev, taskId]));
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to claim task reward.');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Top Header */}
      <div className="flex items-center justify-between py-3 mb-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={onOpenWallet}
          className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 text-xs font-bold text-indigo-900"
        >
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span>₹{profile?.walletBalance ?? 0}</span>
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 rounded-3xl p-6 text-white shadow-xl mb-4 relative overflow-hidden">
        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
          <Sparkles className="w-5 h-5 text-amber-300" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">Available Earning Tasks</h2>
        <p className="text-xs text-indigo-100 mt-1">
          Complete easy surveys, partner apps & channel follows to earn bonus money directly in your wallet.
        </p>
      </div>

      {/* Alerts */}
      {message && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-slate-400">Loading tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <h4 className="font-bold text-slate-700 text-sm">No Task Available Right Now</h4>
            <p className="text-xs text-slate-400 mt-1">
              New tasks will be published shortly by our admin team. Check back soon!
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const isCompleted = completedTaskIds.has(task.id);
            const isCurrentlySelected = activeTask?.id === task.id;

            return (
              <div
                key={task.id}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={task.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120'}
                    alt={task.title}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{task.title}</h4>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full shrink-0">
                        +₹{task.reward}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold">
                      {task.taskType}
                    </span>
                  </div>
                </div>

                {/* Instructions if user started task */}
                {isCurrentlySelected && !isCompleted && (
                  <div className="mt-3 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs space-y-2">
                    <p className="font-semibold text-indigo-950">Instructions:</p>
                    <p className="text-slate-700 whitespace-pre-line text-[11px] leading-relaxed">
                      {task.instructions || 'Follow the link, complete the requirements and click claim reward below.'}
                    </p>
                    <button
                      onClick={() => handleClaimReward(task.id)}
                      disabled={completing}
                      className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {completing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Claim ₹{task.reward}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Button Action */}
                {!isCurrentlySelected && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isCompleted ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Completed & Claimed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleStartTask(task)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <span>Start Task & Earn ₹{task.reward}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
