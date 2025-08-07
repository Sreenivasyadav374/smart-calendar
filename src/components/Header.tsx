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
    <motion.header
      className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 shadow-md transition-all h-14"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="px-4 sm:px-6 py-2 flex items-center justify-between h-full">
        {/* Logo & Title */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg shadow">
            <Calendar size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
              Calendar
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug hidden sm:block">
              AI-powered task scheduling
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online Status */}
          <motion.div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800"
            whileHover={{ scale: 1.04 }}
          >
            {isOnline ? (
              <Wifi size={16} className="text-green-500" />
            ) : (
              <WifiOff size={16} className="text-red-500" />
            )}
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </motion.div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            onClick={onThemeToggle}
            className="p-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </motion.button>

          {/* Auth Button */}
          <motion.div whileHover={{ scale: 1.04 }}>
            <AuthButton user={user} onAuthChange={onAuthChange} />
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};
