/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { EndScreen } from './components/EndScreen';
import { generateSecretWords } from './lib/gemini';
import { Moon, Sun } from 'lucide-react';

type GameState = 'start' | 'playing' | 'won' | 'lost';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [secretWord, setSecretWord] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('moyen');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [validWords, setValidWords] = useState<string[]>([]);
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
      const words = await generateSecretWords(selectedCategory, selectedDifficulty);
      setIsLoading(false);

      if (words.length > 0) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        setSecretWord(randomWord);
        setCategory(selectedCategory);
        setDifficulty(selectedDifficulty);
        setValidWords(words);
        setGuesses([]);
        setGameState('playing');
      } else {
        alert('Impossible de générer des mots pour cette catégorie. Veuillez en essayer une autre.');
      }
    } catch (error: any) {
      setIsLoading(false);
      if (error.message === "QUOTA_EXCEEDED") {
        alert("Le quota de l'API est dépassé. Veuillez patienter un instant avant de réessayer.");
      } else {
        alert("Une erreur est survenue lors de la génération des mots. Veuillez réessayer.");
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
    setSecretWord('');
    setCategory('');
    setGuesses([]);
    setValidWords([]);
  };

  return (
    <div className="font-sans antialiased selection:bg-indigo-200 selection:text-indigo-900 min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50 transition-colors duration-300">
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
      {gameState === 'playing' && (
        <GameScreen 
          secretWord={secretWord} 
          category={category}
          difficulty={difficulty}
          validWords={validWords}
          onWin={handleWin} 
          onGiveUp={handleGiveUp} 
        />
      )}
      {(gameState === 'won' || gameState === 'lost') && (
        <EndScreen 
          secretWord={secretWord} 
          category={category}
          guesses={guesses} 
          isWin={gameState === 'won'} 
          onPlayAgain={handlePlayAgain} 
        />
      )}
    </div>
  );
}
