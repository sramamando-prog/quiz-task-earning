import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { QuizQuestion } from '../types';
import { submitQuizAnswer, QuizSubmitResult } from '../services/walletService';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  AlertTriangle, 
  ChevronRight,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizScreenProps {
  onBack: () => void;
  onOpenWallet: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ onBack, onOpenWallet }) => {
  const { profile, user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load active questions
  useEffect(() => {
    async function loadQuizQuestions() {
      try {
        setLoading(true);
        const q = query(collection(db, 'quizQuestions'), where('status', '==', 'active'));
        const snap = await getDocs(q);
        const list: QuizQuestion[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as any) });
        });
        
        // Shuffle questions for freshness
        const shuffled = list.sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      } catch (err: any) {
        console.error('Failed to load questions:', err);
        setErrorMessage('Failed to load quiz questions. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    loadQuizQuestions();
  }, []);

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (result || submitting) return; // Prevent change after submit
    setSelectedOption(opt);
  };

  const handleConfirmAnswer = async () => {
    if (!selectedOption || !currentQuestion || !user || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitQuizAnswer(user.uid, currentQuestion.id, selectedOption);
      setResult(res);

      if (res.isCorrect) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setResult(null);
    setErrorMessage(null);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Re-shuffle when reached end
      setQuestions((prev) => [...prev].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <h3 className="font-semibold text-slate-800 text-base">Loading Quiz Questions...</h3>
        <p className="text-xs text-slate-400 mt-1">Fetching live questions from Quiz Database</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No Quiz Available Right Now</h3>
        <p className="text-sm text-slate-500 mt-2">
          New questions are published regularly by administrators. Please check back shortly or explore other tasks!
        </p>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = [
    { key: 'A', text: currentQuestion.optionA },
    { key: 'B', text: currentQuestion.optionB },
    { key: 'C', text: currentQuestion.optionC },
    { key: 'D', text: currentQuestion.optionD }
  ];

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between py-3 mb-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Live Wallet Pill */}
        <button
          onClick={onOpenWallet}
          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100/80 px-3.5 py-1.5 rounded-full border border-indigo-100 transition"
        >
          <span className="text-xs text-indigo-600 font-medium">Wallet:</span>
          <span className="text-xs font-bold text-indigo-900">₹{profile?.walletBalance ?? 0}</span>
        </button>
      </div>

      {/* Rules Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-100/70 rounded-2xl p-3.5 mb-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-semibold text-emerald-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Correct Answer: +₹1</span>
        </div>
        <div className="text-slate-300 font-bold">|</div>
        <div className="flex items-center gap-2 font-semibold text-rose-700">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Wrong Answer: -₹1</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-medium text-slate-600">
            {currentQuestion.category || 'General Knowledge'}
          </span>
          <span className="font-semibold text-slate-500">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-5">
          {currentQuestion.question}
        </h2>

        {/* Options List */}
        <div className="space-y-2.5 mb-5">
          {options.map((opt) => {
            let optionStyles = 'border-slate-200 bg-slate-50 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/30';

            if (selectedOption === opt.key && !result) {
              optionStyles = 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20';
            }

            if (result) {
              if (opt.key === result.correctAnswer) {
                optionStyles = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20';
              } else if (selectedOption === opt.key && !result.isCorrect) {
                optionStyles = 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20';
              } else {
                optionStyles = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={opt.key}
                type="button"
                disabled={Boolean(result || submitting)}
                onClick={() => handleSelectOption(opt.key)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between text-sm font-medium ${optionStyles}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    selectedOption === opt.key 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}>
                    {opt.key}
                  </span>
                  <span>{opt.text}</span>
                </div>

                {result && opt.key === result.correctAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {result && selectedOption === opt.key && !result.isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl mb-4 flex items-center gap-2 border border-rose-200">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit or Next Button */}
        {!result ? (
          <button
            onClick={handleConfirmAnswer}
            disabled={!selectedOption || submitting}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Lock Answer & Submit</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            {/* Result banner */}
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              result.isCorrect 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                {result.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Brilliant! {result.message}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Oops! {result.message}</span>
                  </>
                )}
              </div>
              
              {result.explanation && (
                <p className="mt-2 text-slate-700 text-xs bg-white/70 p-2.5 rounded-xl border border-black/5">
                  <span className="font-semibold">Explanation:</span> {result.explanation}
                </p>
              )}
            </div>

            <button
              onClick={handleNextQuestion}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div className="mt-4 p-3 bg-slate-100/80 rounded-2xl text-[11px] text-slate-500 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          Balance never becomes negative. If you give a wrong answer at ₹0, your balance remains safe at ₹0.
        </span>
      </div>
    </div>
  );
};
