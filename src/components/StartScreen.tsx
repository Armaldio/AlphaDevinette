import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, RefreshCw, Sparkles } from 'lucide-react';
import { generateRandomCategories, generateCrazyCategory } from '../lib/gemini';

interface StartScreenProps {
  onStart: (category: string, difficulty: string) => void;
  isLoading: boolean;
}

export function StartScreen({ onStart, isLoading }: StartScreenProps) {
  const [categoryInput, setCategoryInput] = useState('');
  const [difficulty, setDifficulty] = useState<'facile' | 'moyen' | 'difficile'>('moyen');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [isGeneratingCrazy, setIsGeneratingCrazy] = useState(false);

  const loadSuggestions = async () => {
    setIsLoadingSuggestions(true);
    const newSuggestions = await generateRandomCategories();
    setSuggestions(newSuggestions);
    setIsLoadingSuggestions(false);
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleStart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cat = categoryInput.trim();
    if (cat) {
      onStart(cat, difficulty);
    }
  };

  const handleSurprise = async () => {
    setIsGeneratingCrazy(true);
    const crazyCategory = await generateCrazyCategory();
    setCategoryInput(crazyCategory);
    setIsGeneratingCrazy(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-12"
      >
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-stone-900 dark:text-white">
            AlphaDevinette
          </h1>
          <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
            Trouvez le mot secret en devinant par ordre alphabétique. 
            Nous vous dirons si votre proposition se trouve avant ou après le mot secret dans le dictionnaire.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-center tracking-tight text-stone-900 dark:text-stone-100">
            Choisissez une Catégorie
          </h2>
          
          <form onSubmit={handleStart} className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              placeholder="Ex: Titres de films, Garniture de pizza..."
              disabled={isLoading}
              className="w-full pl-6 pr-16 py-4 text-lg bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-full focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-0 transition-all outline-none shadow-sm text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500"
            />
            <button
              type="submit"
              disabled={!categoryInput.trim() || isLoading}
              className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          <div className="flex flex-col items-center space-y-4">
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto min-h-[80px] items-start">
              {isLoadingSuggestions ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-9 w-32 bg-stone-200 dark:bg-stone-800 animate-pulse rounded-full"></div>
                ))
              ) : (
                suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setCategoryInput(suggestion)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-full text-sm font-medium hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              <button 
                onClick={loadSuggestions} 
                disabled={isLoadingSuggestions || isLoading}
                className="flex items-center text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors font-medium"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
                Nouvelles suggestions
              </button>
              <button 
                onClick={handleSurprise} 
                disabled={isGeneratingCrazy || isLoading}
                className="flex items-center text-sm text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-medium"
              >
                <Sparkles className={`w-4 h-4 mr-2 ${isGeneratingCrazy ? 'animate-pulse' : ''}`} />
                Surprenez-moi !
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-3 pt-4">
          <span className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Niveau de difficulté</span>
          <div className="flex bg-stone-200 dark:bg-stone-800 p-1 rounded-full">
            {['facile', 'moyen', 'difficile'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level as any)}
                disabled={isLoading}
                className={`px-6 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                  difficulty === level 
                    ? 'bg-white dark:bg-stone-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => handleStart()}
            disabled={!categoryInput.trim() || isLoading}
            className={`
              px-12 py-4 rounded-full text-lg font-semibold tracking-wide transition-all
              ${!categoryInput.trim() || isLoading
                ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1'
              }
            `}
          >
            {isLoading ? 'Génération des mots...' : 'Commencer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
