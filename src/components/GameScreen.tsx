import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, ArrowDown, Send, CheckCircle2, Loader2, XCircle, Lightbulb } from 'lucide-react';
import { validateGuessWithGemini, type GameData } from '../lib/gemini';

function getEditDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function isCloseEnough(guess: string, secret: string): boolean {
  const cleanGuess = guess.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '').toLowerCase();
  const cleanSecret = secret.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '').toLowerCase();
  
  if (cleanGuess === cleanSecret) return true;
  
  const distance = getEditDistance(cleanGuess, cleanSecret);
  // Allow 1 typo for words > 4 chars, 2 typos for words > 8 chars
  const maxDistance = cleanSecret.length > 8 ? 2 : (cleanSecret.length > 4 ? 1 : 0);
  
  return distance <= maxDistance;
}

interface GameScreenProps {
  gameData: GameData;
  category: string;
  difficulty: string;
  onWin: (guesses: string[]) => void;
  onGiveUp: () => void;
}

interface GuessRecord {
  word: string;
  relation: 'before' | 'after' | 'exact' | 'pending' | 'invalid' | 'hint';
}

export function GameScreen({ gameData, category, difficulty, onWin, onGiveUp }: GameScreenProps) {
  const { word: secretWord, hints } = gameData;
  const [input, setInput] = useState('');
  const [guesses, setGuesses] = useState<GuessRecord[]>([]);
  const [error, setError] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const endOfListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    endOfListRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [guesses]);

  const lowerBound = guesses
    .filter(g => g.relation === 'before')
    .map(g => g.word)
    .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
    .pop();

  const upperBound = guesses
    .filter(g => g.relation === 'after')
    .map(g => g.word)
    .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))[0];

  const getLetterValue = (word: string | undefined) => {
    if (!word) return null;
    const char = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().charCodeAt(0);
    return Math.max(0, Math.min(25, char - 65));
  };

  const minVal = lowerBound ? getLetterValue(lowerBound) ?? 0 : 0;
  const maxVal = upperBound ? getLetterValue(upperBound) ?? 25 : 25;
  const leftPercent = (minVal / 25) * 100;
  const widthPercent = Math.max(2, ((maxVal - minVal) / 25) * 100);

  const handleHint = () => {
    if (hintsUsed >= 3) return;
    const nextLevel = hintsUsed + 1;
    const hintText = hints[nextLevel - 1];
    setHintsUsed(nextLevel);
    setGuesses(prev => [...prev, { word: hintText, relation: 'hint' }]);
    setTimeout(() => endOfListRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guess = input.trim();

    if (!guess) return;
    
    if (guesses.some(g => g.relation !== 'hint' && g.word.toLowerCase() === guess.toLowerCase())) {
      setError('Vous avez déjà proposé ce mot !');
      return;
    }

    setError('');
    setInput(''); 
    
    if (isCloseEnough(guess, secretWord)) {
      const newGuess: GuessRecord = { word: guess, relation: 'exact' };
      setGuesses(prev => {
        const updated = [...prev, newGuess];
        setTimeout(() => onWin(updated.filter(g => g.relation !== 'pending' && g.relation !== 'invalid' && g.relation !== 'hint').map(g => g.relation === 'exact' ? secretWord : g.word)), 600);
        return updated;
      });
      return;
    }

    const newGuess: GuessRecord = { word: guess, relation: 'pending' };
    setGuesses(prev => [...prev, newGuess]);

    // Simplified: No validWords pool, rely on AI-only validation
    const isValid = await validateGuessWithGemini(guess, category);
    
    if (!isValid) {
      setGuesses(prev => prev.map(g => 
        g.word === guess ? { ...g, relation: 'invalid' } : g
      ));
      setTimeout(() => {
        setGuesses(prev => prev.filter(g => g.word !== guess || g.relation !== 'invalid'));
      }, 3000);
      return;
    }

    const comparison = guess.localeCompare(secretWord, 'fr', { sensitivity: 'base' });
    const relation = comparison < 0 ? 'before' : 'after';
    
    setGuesses(prev => prev.map(g => g.word === guess ? { ...g, relation } : g));
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* Header / Bounds Display */}
      <div className="sticky top-0 z-20 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 py-4 sm:px-6 sm:py-6 shadow-md inter-container">
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center space-y-4 sm:space-y-6">
          <h2 className="text-xs sm:text-sm font-bold tracking-widest text-stone-600 dark:text-stone-400 uppercase flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="opacity-70">Catégorie :</span>
            <span className="text-stone-900 dark:text-white">{category}</span>
            <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600"></span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black
              ${difficulty === 'facile' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : ''}
              ${difficulty === 'moyen' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : ''}
              ${difficulty === 'difficile' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : ''}
            `}>
              {difficulty}
            </span>
          </h2>
          
          <div className="w-full max-w-md mx-auto">
            <div className="flex justify-between text-xs font-bold text-stone-400 dark:text-stone-500 mb-2 px-1">
              <span className={lowerBound ? 'text-indigo-600 dark:text-indigo-400' : ''}>
                {lowerBound ? lowerBound.toUpperCase() : 'A'}
              </span>
              <span className={upperBound ? 'text-rose-600 dark:text-rose-400' : ''}>
                {upperBound ? upperBound.toUpperCase() : 'Z'}
              </span>
            </div>
            <div className="h-3 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute top-0 bottom-0 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                initial={false}
                animate={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Guesses List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto space-y-3">
          <AnimatePresence initial={false}>
            {guesses.map((g, index) => (
              <motion.div
                key={`${g.word}-${index}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`
                  flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-colors duration-300
                  ${g.relation === 'exact' 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300' 
                    : g.relation === 'invalid'
                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-300'
                    : g.relation === 'pending'
                    ? 'bg-stone-100 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400'
                    : g.relation === 'hint'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30 text-amber-900 dark:text-amber-300'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 shadow-sm'
                  }
                `}
              >
                {g.relation === 'hint' ? (
                  <div className="flex items-start space-x-3 w-full">
                    <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-base font-medium leading-relaxed">
                      {g.word}
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="text-base sm:text-lg font-medium tracking-wide uppercase">
                      {g.relation === 'exact' ? secretWord : g.word}
                    </span>
                    <div className="flex items-center space-x-2 text-[10px] sm:text-sm font-medium">
                      {g.relation === 'pending' && (
                        <span className="flex items-center text-stone-500 dark:text-stone-400 bg-stone-200/50 dark:bg-stone-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                          Vérification... <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 animate-spin" />
                        </span>
                      )}
                      {g.relation === 'invalid' && (
                        <span className="flex items-center text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                          Hors catégorie <XCircle className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                        </span>
                      )}
                      {g.relation === 'before' && (
                        <span className="flex items-center text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                          Le mot est après <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                        </span>
                      )}
                      {g.relation === 'after' && (
                        <span className="flex items-center text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/40 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                          Le mot est avant <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                        </span>
                      )}
                      {g.relation === 'exact' && (
                        <span className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                          Trouvé ! <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                        </span>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={endOfListRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 p-4 sm:p-6 inter-container">
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre proposition..."
              className="w-full pl-4 pr-12 py-3 text-base sm:pl-6 sm:pr-16 sm:py-4 sm:text-lg bg-stone-100 dark:bg-stone-800 border-2 border-transparent rounded-full focus:bg-white dark:focus:bg-stone-900 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-0 transition-all outline-none uppercase tracking-wide text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
            </button>
          </form>
          
          <div className="flex items-center justify-between mt-4 px-4">
            <span className="text-sm text-rose-500 dark:text-rose-400 font-medium h-5">
              {error}
            </span>
            <div className="flex items-center space-x-6">
              <button
                type="button"
                onClick={handleHint}
                disabled={hintsUsed >= 3}
                className="flex items-center text-sm text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lightbulb className="w-4 h-4 mr-1.5" />
                Indice ({3 - hintsUsed})
              </button>
              <button
                type="button"
                onClick={onGiveUp}
                className="text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors font-medium"
              >
                Abandonner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
