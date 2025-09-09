import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Moon, Sun, Wifi, WifiOff, Sparkles, Bell } from 'lucide-react';
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
      className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg transition-all h-16"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between h-full">
        {/* Logo & Title */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-4"
        >
          <div className="relative">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl shadow-lg">
              <Calendar size={24} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
              Smart Calendar
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug hidden sm:block">
              AI-powered productivity suite
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Assistant Button */}
          <motion.button
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.96 }}
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all"
            title="AI Assistant"
          >
            <Sparkles size={16} />
            <span className="hidden md:inline">AI</span>
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            className="relative p-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            title="Notifications"
          >
            <Bell size={20} />
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          </motion.button>

          {/* Online Status */}
          <motion.div
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            whileHover={{ scale: 1.04 }}
          >
            {isOnline ? (
              <>
                <Wifi size={16} className="text-green-500" />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  Online
                </span>
              </>
            ) : (
              <>
                <WifiOff size={16} className="text-red-500" />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                  Offline
                </span>
              </>
            )}
          </motion.div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.08, rotate: 180 }}
            whileTap={{ scale: 0.96 }}
            onClick={onThemeToggle}
            className="p-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </motion.button>

          {/* Auth Button */}
          <motion.div whileHover={{ scale: 1.02 }}>
            <AuthButton user={user} onAuthChange={onAuthChange} />
          </motion.div>
        </div>
      </div>

      {/* Gradient Border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
    </motion.header>
  );
};