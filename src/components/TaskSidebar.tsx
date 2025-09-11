import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Filter, Search, Sparkles, Calendar, Clock, Flag, CheckCircle2, Circle, Trash2, Edit3, SortAsc, SortDesc } from "lucide-react";
import { Task, TaskCategory, AITaskSuggestion } from "../types";
import { PRIORITY_COLORS } from "../utils/constants";

interface TaskSidebarProps {
  tasks: Task[];
  categories: TaskCategory[];
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onTaskEdit: (task: Task) => void;
  onNewTask: () => void;
  onTaskSuggestions: () => void;
  suggestions: AITaskSuggestion[];
  onAcceptSuggestion: (suggestion: AITaskSuggestion) => void;
  isLoadingSuggestions: boolean;
}

export const TaskSidebar: React.FC<TaskSidebarProps> = ({
  tasks,
  categories,
  onTaskComplete,
  onTaskDelete,
  onTaskEdit,
  onNewTask,
  onTaskSuggestions,
  suggestions,
  onAcceptSuggestion,
  isLoadingSuggestions,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || task.category.id === selectedCategory;
    const matchesPriority =
      selectedPriority === "all" || task.priority === selectedPriority;
    const matchesCompleted = showCompleted || !task.completed;

    return matchesSearch && matchesCategory && matchesPriority && matchesCompleted;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'dueDate':
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = aDate - bDate;
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
        break;
      case 'created':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const incompleteTasks = filteredAndSortedTasks.filter((task) => !task.completed);
  const completedTasks = filteredAndSortedTasks.filter((task) => task.completed);

  const toggleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };
  const TaskCard: React.FC<{ task: Task; draggable?: boolean }> = ({ task, draggable = true }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02, y: -2 }}
      draggable={draggable && !task.completed}
      onDragStart={(e) => {
        if (draggable && !task.completed) {
          e.dataTransfer.setData('application/json', JSON.stringify(task));
          (e.target as HTMLElement).dataset.task = JSON.stringify(task);
        }
      }}
      className={`group relative p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${
        task.completed ? 'opacity-60' : ''
      } ${draggable && !task.completed ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={() => onTaskEdit(task)}
    >
      {/* Priority Indicator */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      />

      <div className="flex items-start gap-3">
        {/* Completion Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onTaskComplete(task.id);
          }}
          className={`mt-0.5 transition-colors ${
            task.completed
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-400 hover:text-green-600 dark:hover:text-green-400'
          }`}
        >
          {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </motion.button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.category.color }}
            />
            <h3 className={`font-semibold text-gray-900 dark:text-gray-100 truncate ${
              task.completed ? 'line-through' : ''
            }`}>
              {task.title}
            </h3>
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Flag size={12} style={{ color: PRIORITY_COLORS[task.priority] }} />
                <span className="capitalize">{task.priority}</span>
              </div>
              
              {task.estimatedDuration && (
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{task.estimatedDuration}m</span>
                </div>
              )}
              
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span className={`${
                    new Date(task.dueDate) < new Date() && !task.completed 
                      ? 'text-red-500 font-medium' 
                      : ''
                  }`}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskEdit(task);
                }}
                className="p-1 rounded-full text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Edit3 size={14} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskDelete(task.id);
                }}
                className="p-1 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={14} />
              </motion.button>
            </div>
          </div>

          {/* Category Badge */}
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
              {task.category.name}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tasks</h2>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onTaskSuggestions}
              disabled={isLoadingSuggestions}
              className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors disabled:opacity-50"
              title="Get AI task suggestions"
            >
              {isLoadingSuggestions ? (
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewTask}
              className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors shadow-lg"
            >
              <Plus size={20} />
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              showFilters 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Filter size={16} />
            Filters
          </motion.button>

          {/* Sort Controls */}
          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created">Created</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            </button>
          </div>

          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              showCompleted
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {showCompleted ? "Hide" : "Show"} Completed
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-300">AI Suggestions</h3>
              </div>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700 shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                          {suggestion.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{suggestion.description}</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 italic">{suggestion.reasoning}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            suggestion.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {suggestion.priority}
                          </span>
                          <span className="text-xs text-gray-500">{suggestion.estimatedDuration}m</span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onAcceptSuggestion(suggestion)}
                        className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                      >
                        Add
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {incompleteTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
              <Circle size={16} />
              Todo ({incompleteTasks.length})
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {incompleteTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {completedTasks.length > 0 && showCompleted && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} />
              Completed ({completedTasks.length})
            </h3>
            <div className="space-y-3">
              <AnimatePresence>
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} draggable={false} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {filteredAndSortedTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Filter size={24} className="text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No tasks found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || selectedCategory !== "all" || selectedPriority !== "all"
                ? "Try adjusting your filters or search terms"
                : "Create your first task to get started"}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewTask}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Task
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};