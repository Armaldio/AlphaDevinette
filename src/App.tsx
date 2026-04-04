/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { EndScreen } from './components/EndScreen';
import { generateGameData, type GameData } from './lib/gemini';
import { Moon, Sun } from 'lucide-react';
import { Toaster, toast } from 'sonner';

type GameState = 'start' | 'playing' | 'won' | 'lost';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('moyen');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleStart = async (selectedCategory: string, selectedDifficulty: string) => {
    setIsLoading(true);
    try {
      const data = await generateGameData(selectedCategory, selectedDifficulty);
      setIsLoading(false);

      if (data) {
        setGameData(data);
        setCategory(selectedCategory);
        setDifficulty(selectedDifficulty);
        setGuesses([]);
        setGameState('playing');
      } else {
        toast.error('Impossible de préparer le jeu pour cette catégorie.');
      }
    } catch (error: any) {
      setIsLoading(false);
      if (error.message === "QUOTA_EXCEEDED") {
        toast.error("Quota API dépassé. Veuillez patienter.");
      } else {
        toast.error("Une erreur est survenue lors de la génération.");
      }
    }
  };

  const handleWin = (finalGuesses: string[]) => {
    setGuesses(finalGuesses);
    setGameState('won');
  };

  const handleGiveUp = () => {
    setGameState('lost');
  };

  const handlePlayAgain = () => {
    setGameState('start');
    setGameData(null);
    setCategory('');
    setGuesses([]);
  };

  return (
    <div className="font-sans antialiased selection:bg-indigo-200 selection:text-indigo-900 min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50 transition-colors duration-300">
      <Toaster position="top-center" richColors />
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {gameState === 'start' && (
        <StartScreen onStart={handleStart} isLoading={isLoading} />
      )}
      
      {gameState === 'playing' && gameData && (
        <GameScreen 
          gameData={gameData}
          category={category}
          difficulty={difficulty}
          onWin={handleWin} 
          onGiveUp={handleGiveUp} 
        />
      )}
      
      {(gameState === 'won' || gameState === 'lost') && gameData && (
        <EndScreen 
          gameData={gameData}
          category={category}
          guesses={guesses} 
          isWin={gameState === 'won'} 
          onPlayAgain={handlePlayAgain} 
        />
      )}
    </div>
  );
}
