import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Tag, FileText, Flag, Repeat, Bell, Sparkles } from 'lucide-react';
import { Task, TaskCategory } from '../types';
import { format } from 'date-fns';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  task?: Task | null;
  categories: TaskCategory[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  categories
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: 'work',
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedDuration: 30,
    dueDate: '',
    scheduledDate: '',
    completed: false,
    isRecurring: false,
    recurringPattern: 'daily' as 'daily' | 'weekly' | 'monthly',
    reminderEnabled: false,
    reminderMinutes: 15
  });

  const [isProcessingNLP, setIsProcessingNLP] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        categoryId: task.category.id,
        priority: task.priority,
        estimatedDuration: task.estimatedDuration || 30,
        dueDate: task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '',
        scheduledDate: task.scheduledDate ? format(task.scheduledDate, "yyyy-MM-dd'T'HH:mm") : '',
        completed: task.completed,
        isRecurring: false,
        recurringPattern: 'daily',
        reminderEnabled: false,
        reminderMinutes: 15
      });
    } else {
      setFormData({
        title: '',
        description: '',
        categoryId: 'work',
        priority: 'medium',
        estimatedDuration: 30,
        dueDate: '',
        scheduledDate: '',
        completed: false,
        isRecurring: false,
        recurringPattern: 'daily',
        reminderEnabled: false,
        reminderMinutes: 15
      });
    }
  }, [task]);

  const processNaturalLanguage = async (input: string) => {
    setIsProcessingNLP(true);
    try {
      // Simple NLP processing - in a real app, you'd use a more sophisticated service
      const lowerInput = input.toLowerCase();
      
      // Extract time patterns
      const timePatterns = {
        'tomorrow': () => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow;
        },
        'next week': () => {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          return nextWeek;
        },
        'monday': () => {
          const date = new Date();
          const day = date.getDay();
          const diff = (1 + 7 - day) % 7;
          date.setDate(date.getDate() + diff);
          return date;
        }
      };

      // Extract priority
      let priority: 'low' | 'medium' | 'high' = 'medium';
      if (lowerInput.includes('urgent') || lowerInput.includes('important') || lowerInput.includes('asap')) {
        priority = 'high';
      } else if (lowerInput.includes('low priority') || lowerInput.includes('when possible')) {
        priority = 'low';
      }

      // Extract category
      let categoryId = 'work';
      if (lowerInput.includes('personal') || lowerInput.includes('home')) categoryId = 'personal';
      if (lowerInput.includes('health') || lowerInput.includes('exercise') || lowerInput.includes('doctor')) categoryId = 'health';
      if (lowerInput.includes('learn') || lowerInput.includes('study') || lowerInput.includes('course')) categoryId = 'learning';
      if (lowerInput.includes('meeting') || lowerInput.includes('call') || lowerInput.includes('social')) categoryId = 'social';

      // Extract duration
      const durationMatch = lowerInput.match(/(\d+)\s*(hour|hr|minute|min)/);
      let estimatedDuration = 30;
      if (durationMatch) {
        const value = parseInt(durationMatch[1]);
        const unit = durationMatch[2];
        estimatedDuration = unit.includes('hour') || unit.includes('hr') ? value * 60 : value;
      }

      // Extract date
      let dueDate = '';
      for (const [pattern, dateFunc] of Object.entries(timePatterns)) {
        if (lowerInput.includes(pattern)) {
          dueDate = format(dateFunc(), 'yyyy-MM-dd');
          break;
        }
      }

      // Clean title (remove time/priority indicators)
      let cleanTitle = input
        .replace(/\b(tomorrow|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
        .replace(/\b(urgent|important|asap|low priority|when possible)\b/gi, '')
        .replace(/\b\d+\s*(hour|hr|minute|min)s?\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      setFormData(prev => ({
        ...prev,
        title: cleanTitle || prev.title,
        priority,
        categoryId,
        estimatedDuration,
        dueDate
      }));

    } catch (error) {
      console.error('NLP processing failed:', error);
    } finally {
      setIsProcessingNLP(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({ ...prev, title: value }));
    
    // Trigger NLP processing if the input looks like natural language
    if (value.length > 10 && (value.includes(' ') && (value.includes('tomorrow') || value.includes('urgent') || value.includes('meeting')))) {
      processNaturalLanguage(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const category = categories.find(c => c.id === formData.categoryId) || categories[0];

    const taskData: Omit<Task, 'id' | 'createdAt'> = {
      title: formData.title,
      description: formData.description,
      category,
      priority: formData.priority,
      estimatedDuration: formData.estimatedDuration,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : undefined,
      completed: formData.completed
    };

    onSave(taskData);
    onClose();
  };

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
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 m-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {task ? 'Edit Task' : 'Create Task'}
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Smart Title Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    Task Title
                    {isProcessingNLP && (
                      <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <Sparkles size={14} />
                        <span className="text-xs">Processing...</span>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., 'Meeting with John tomorrow 3pm' or 'Urgent: Review project docs'"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  💡 Try natural language like "Call dentist tomorrow" or "Urgent meeting next week"
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Add more details about this task..."
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Tag size={16} className="inline mr-1" />
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Flag size={16} className="inline mr-1" />
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Clock size={16} className="inline mr-1" />
                  Estimated Duration (minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="480"
                    step="5"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
                    {formData.estimatedDuration}m
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 min</span>
                  <span>8 hours</span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Scheduled Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Advanced Options</h3>
                
                {/* Recurring */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Recurring Task</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {formData.isRecurring && (
                  <div>
                    <select
                      value={formData.recurringPattern}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurringPattern: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}

                {/* Reminders */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Reminder</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.reminderEnabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {formData.reminderEnabled && (
                  <div>
                    <select
                      value={formData.reminderMinutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    >
                      <option value={5}>5 minutes before</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                      <option value={60}>1 hour before</option>
                      <option value={1440}>1 day before</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Completed Checkbox for Edit Mode */}
              {task && (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <input
                    type="checkbox"
                    id="completed"
                    checked={formData.completed}
                    onChange={(e) => setFormData(prev => ({ ...prev, completed: e.target.checked }))}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="completed" className="text-sm font-medium text-green-700 dark:text-green-300">
                    Mark as completed
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 text-sm font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {task ? 'Update Task' : 'Create Task'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};