import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Flag, Check, Trash2 } from 'lucide-react';
import { Task } from '../types';
import { PRIORITY_COLORS } from '../utils/constants';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  draggable?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onDelete,
  onEdit,
  draggable = true
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      draggable={draggable && !task.completed}
      onDragStart={(e) => {
        if (draggable && !task.completed) {
          e.dataTransfer.setData('application/json', JSON.stringify(task));
        }
      }}
      className={`p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer transition-all hover:shadow-md ${
        task.completed ? 'opacity-60' : ''
      } ${draggable && !task.completed ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.category.color }}
            />
            <h3 className={`font-medium text-gray-900 dark:text-gray-100 truncate ${
              task.completed ? 'line-through' : ''
            }`}>
              {task.title}
            </h3>
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
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
            
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {task.category.name}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onComplete(task.id);
            }}
            className={`p-1 rounded-full transition-colors ${
              task.completed
                ? 'text-green-600 bg-green-100 dark:bg-green-900/20'
                : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
          >
            <Check size={16} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};