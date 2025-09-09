import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, CheckCircle, Clock, Target, Sparkles, X } from 'lucide-react';
import { Task, CalendarEvent } from '../types';
import { openaiService } from '../utils/openai';
import { startOfWeek, endOfWeek, format, isWithinInterval } from 'date-fns';

interface WeeklySummaryProps {
  tasks: Task[];
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({
  tasks,
  events,
  isOpen,
  onClose
}) => {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [weekStats, setWeekStats] = useState({
    completedTasks: 0,
    totalTasks: 0,
    totalEvents: 0,
    productiveHours: 0,
    topCategory: '',
    completionRate: 0
  });

  useEffect(() => {
    if (isOpen) {
      calculateWeekStats();
      generateSummary();
    }
  }, [isOpen, tasks, events]);

  const calculateWeekStats = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const weekTasks = tasks.filter(task => 
      isWithinInterval(new Date(task.createdAt), { start: weekStart, end: weekEnd })
    );

    const weekEvents = events.filter(event =>
      isWithinInterval(new Date(event.start), { start: weekStart, end: weekEnd })
    );

    const completedTasks = weekTasks.filter(task => task.completed);
    const completionRate = weekTasks.length > 0 ? Math.round((completedTasks.length / weekTasks.length) * 100) : 0;

    // Calculate productive hours (estimated from completed tasks)
    const productiveHours = Math.round(
      completedTasks.reduce((total, task) => total + (task.estimatedDuration || 30), 0) / 60
    );

    // Find top category
    const categoryCount: Record<string, number> = {};
    completedTasks.forEach(task => {
      categoryCount[task.category.name] = (categoryCount[task.category.name] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    setWeekStats({
      completedTasks: completedTasks.length,
      totalTasks: weekTasks.length,
      totalEvents: weekEvents.length,
      productiveHours,
      topCategory,
      completionRate
    });
  };

  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const aiSummary = await openaiService.generateWeeklySummary(tasks, events);
      setSummary(aiSummary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setSummary('Unable to generate AI summary at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    value: string | number; 
    color: string;
    trend?: string;
  }> = ({ icon, label, value, color, trend }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {label}
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 m-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <BarChart3 size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Weekly Summary
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </motion.button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<CheckCircle size={20} className="text-green-600" />}
                  label="Tasks Completed"
                  value={weekStats.completedTasks}
                  color="bg-green-100 dark:bg-green-900/20"
                  trend={weekStats.completionRate > 70 ? '+12%' : undefined}
                />
                <StatCard
                  icon={<Target size={20} className="text-blue-600" />}
                  label="Completion Rate"
                  value={`${weekStats.completionRate}%`}
                  color="bg-blue-100 dark:bg-blue-900/20"
                />
                <StatCard
                  icon={<Calendar size={20} className="text-purple-600" />}
                  label="Events Attended"
                  value={weekStats.totalEvents}
                  color="bg-purple-100 dark:bg-purple-900/20"
                />
                <StatCard
                  icon={<Clock size={20} className="text-orange-600" />}
                  label="Productive Hours"
                  value={weekStats.productiveHours}
                  color="bg-orange-100 dark:bg-orange-900/20"
                />
              </div>

              {/* AI Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    AI Insights
                  </h3>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 dark:text-gray-400">Analyzing your week...</span>
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {summary}
                  </p>
                )}
              </div>

              {/* Category Breakdown */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Category Breakdown
                </h3>
                <div className="space-y-3">
                  {Object.entries(
                    tasks
                      .filter(task => task.completed)
                      .reduce((acc, task) => {
                        acc[task.category.name] = (acc[task.category.name] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                  )
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([category, count]) => {
                      const percentage = Math.round((count / weekStats.completedTasks) * 100);
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {category}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem]">
                              {count} ({percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Productivity Tips */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl p-6 border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Next Week Goals
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Recommendations:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Focus on {weekStats.topCategory.toLowerCase()} tasks early in the day</li>
                      <li>• Try time-blocking for better focus</li>
                      <li>• Schedule regular breaks between tasks</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Targets:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Complete {Math.max(weekStats.completedTasks + 2, 10)} tasks</li>
                      <li>• Maintain {Math.min(weekStats.completionRate + 5, 95)}% completion rate</li>
                      <li>• Add 2 hours of learning time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};