import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Filter, Search, Sparkles } from "lucide-react";
import { Task, TaskCategory, AITaskSuggestion } from "../types";
import { TaskCard } from "./TaskCard";

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
  const [showCompleted, setShowCompleted] = useState(false);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || task.category.id === selectedCategory;
    const matchesCompleted = showCompleted || !task.completed;

    return matchesSearch && matchesCategory && matchesCompleted;
  });

  const incompleteTasks = filteredTasks.filter((task) => !task.completed);
  const completedTasks = filteredTasks.filter((task) => task.completed);

  return (
    <div className="rounded-xl shadow-lg w-full h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col text-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tasks</h2>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onTaskSuggestions}
              disabled={isLoadingSuggestions}
              className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50"
              title="Get AI task suggestions"
            >
              {isLoadingSuggestions ? (
                <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewTask}
              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Plus size={14} />
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <label htmlFor="category-select" className="sr-only">Select category</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              showCompleted
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {showCompleted ? "Hide" : "Show"} Done
          </button>
        </div>
      </div>

      {/* AI Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/10"
          >
            <div className="px-3 py-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={14} className="text-purple-600" />
                <h3 className="font-medium text-sm text-purple-900 dark:text-purple-300">AI Suggestions</h3>
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-2 bg-white dark:bg-gray-800 rounded-md border border-purple-200 dark:border-purple-700"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-xs">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {suggestion.title}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">{suggestion.description}</p>
                        <p className="text-purple-600 dark:text-purple-400 mt-1">{suggestion.reasoning}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onAcceptSuggestion(suggestion)}
                        className="px-2 py-0.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
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
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2">
        {incompleteTasks.length > 0 && (
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Todo ({incompleteTasks.length})
            </h3>
            <AnimatePresence>
              {incompleteTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={onTaskComplete}
                  onDelete={onTaskDelete}
                  onEdit={onTaskEdit}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {completedTasks.length > 0 && showCompleted && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Completed ({completedTasks.length})
            </h3>
            <AnimatePresence>
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={onTaskComplete}
                  onDelete={onTaskDelete}
                  onEdit={onTaskEdit}
                  draggable={false}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-6 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex justify-center mb-2">
              <Filter size={28} className="text-gray-400" />
            </div>
            {searchTerm || selectedCategory !== "all"
              ? "No tasks match your filters"
              : "No tasks yet. Add one!"}
          </div>
        )}
      </div>
    </div>
  );
};
