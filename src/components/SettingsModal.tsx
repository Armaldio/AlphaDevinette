import React from 'react';
import { motion } from 'motion/react';
import { X, Moon, Sun, Settings as SettingsIcon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function SettingsModal({ isOpen, onClose, isDarkMode, onToggleTheme }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm bg-white dark:bg-stone-800 rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-700"
      >
        <div className="p-6 md:p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-stone-900 dark:text-white">
              <SettingsIcon className="w-6 h-6 text-indigo-500" />
              Paramètres
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-stone-500 dark:text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-200 dark:border-stone-700">
              <div className="space-y-0.5">
                <p className="font-semibold text-stone-900 dark:text-white">Mode Sombre</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {isDarkMode ? 'Activé' : 'Désactivé'}
                </p>
              </div>
              <button
                onClick={onToggleTheme}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none
                  ${isDarkMode ? 'bg-indigo-600' : 'bg-stone-300 dark:bg-stone-700'}
                `}
              >
                <span
                  className={`
                    inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform
                    ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}
                    flex items-center justify-center
                  `}
                >
                  {isDarkMode ? (
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </span>
              </button>
            </div>

            {/* Placeholder for future settings */}
            <div className="opacity-40 select-none space-y-4">
              <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-900/50 rounded-2xl border border-stone-200 dark:border-stone-700">
                <p className="font-semibold text-stone-900 dark:text-white">Effets Sonores</p>
                <div className="w-10 h-6 bg-stone-300 dark:bg-stone-700 rounded-full" />
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
