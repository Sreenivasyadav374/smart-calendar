import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { AuthButton } from './AuthButton';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onAuthChange: (user: User | null) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onAuthChange,
  theme,
  onThemeToggle,
  isOnline
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 bg-blue-600 rounded-lg">
                <Calendar size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Intelligent Calendar
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  AI-powered task scheduling
                </p>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            {/* Online Status */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi size={16} className="text-green-600" />
              ) : (
                <WifiOff size={16} className="text-red-600" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onThemeToggle}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </motion.button>

            {/* Auth Button */}
            <AuthButton user={user} onAuthChange={onAuthChange} />
          </div>
        </div>
      </div>
    </header>
  );
};