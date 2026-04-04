import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, RotateCcw, Frown, Sparkles } from 'lucide-react';
import { generateFunFact } from '../lib/gemini';

interface EndScreenProps {
  secretWord: string;
  category: string;
  guesses: string[];
  isWin: boolean;
  onPlayAgain: () => void;
}

export function EndScreen({ secretWord, category, guesses, isWin, onPlayAgain }: EndScreenProps) {
  const [funFact, setFunFact] = useState<string>('');
  const [isLoadingFact, setIsLoadingFact] = useState(true);

  useEffect(() => {
    const fetchFact = async () => {
      setIsLoadingFact(true);
      const fact = await generateFunFact(secretWord, category);
      setFunFact(fact);
      setIsLoadingFact(false);
    };
    fetchFact();
  }, [secretWord, category]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-stone-800 rounded-3xl p-8 md:p-12 text-center shadow-2xl border border-stone-200 dark:border-stone-700"
      >
        <div className="flex justify-center mb-6">
          {isWin ? (
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center">
              <Frown className="w-10 h-10" />
            </div>
          )}
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mb-2 text-stone-900 dark:text-white">
          {isWin ? 'Bravo !' : 'Partie terminée'}
        </h2>
        
        <p className="text-stone-500 dark:text-stone-400 mb-8 text-lg">
          {isWin ? (
            <>Vous avez trouvé le mot en <span className="text-stone-900 dark:text-white font-bold">{guesses.length}</span> essais.</>
          ) : (
            <>Plus de chance la prochaine fois !</>
          )}
        </p>

        <div className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-6 mb-6 border border-stone-200 dark:border-stone-700">
          <p className="text-sm text-stone-500 dark:text-stone-400 uppercase tracking-widest font-semibold mb-2">
            Le mot secret était
          </p>
          <p className="text-4xl font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
            {secretWord}
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 mb-8 border border-amber-200 dark:border-amber-800/30 text-left">
          <div className="flex items-center space-x-2 mb-2 text-amber-700 dark:text-amber-400 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm uppercase tracking-wider">Le saviez-vous ?</span>
          </div>
          {isLoadingFact ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-amber-200/50 dark:bg-amber-800/30 rounded w-full"></div>
              <div className="h-4 bg-amber-200/50 dark:bg-amber-800/30 rounded w-5/6"></div>
            </div>
          ) : (
            <p className="text-sm text-amber-900 dark:text-amber-200/80 leading-relaxed">
              {funFact}
            </p>
          )}
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full flex items-center justify-center space-x-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-4 rounded-xl font-bold text-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Rejouer</span>
        </button>
      </motion.div>
    </div>
  );
}
