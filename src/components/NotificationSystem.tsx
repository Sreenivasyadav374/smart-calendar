import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Clock, Calendar, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Task, CalendarEvent } from '../types';

interface Notification {
  id: string;
  type: 'task' | 'event' | 'reminder' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  actionable?: boolean;
  relatedId?: string;
}

interface NotificationSystemProps {
  tasks: Task[];
  events: CalendarEvent[];
  onTaskComplete?: (taskId: string) => void;
  onEventClick?: (eventId: string) => void;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  tasks,
  events,
  onTaskComplete,
  onEventClick
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    checkForNotifications();
    const interval = setInterval(checkForNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks, events]);

  const checkForNotifications = () => {
    const now = new Date();
    const newNotifications: Notification[] = [];

    // Check for upcoming events (15 minutes before)
    events.forEach(event => {
      const eventStart = new Date(event.start);
      const timeDiff = eventStart.getTime() - now.getTime();
      const minutesUntil = Math.floor(timeDiff / (1000 * 60));

      if (minutesUntil === 15 && minutesUntil > 0) {
        newNotifications.push({
          id: `event-${event.id}-15min`,
          type: 'event',
          title: 'Upcoming Event',
          message: `"${event.title}" starts in 15 minutes`,
          timestamp: now,
          priority: 'high',
          actionable: true,
          relatedId: event.id
        });
      }
    });

    // Check for overdue tasks
    tasks.forEach(task => {
      if (!task.completed && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate < now) {
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          newNotifications.push({
            id: `task-overdue-${task.id}`,
            type: 'task',
            title: 'Overdue Task',
            message: `"${task.title}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
            timestamp: now,
            priority: 'high',
            actionable: true,
            relatedId: task.id
          });
        }
      }
    });

    // Check for tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    tasks.forEach(task => {
      if (!task.completed && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate >= today && dueDate < tomorrow) {
          newNotifications.push({
            id: `task-due-today-${task.id}`,
            type: 'task',
            title: 'Due Today',
            message: `"${task.title}" is due today`,
            timestamp: now,
            priority: 'medium',
            actionable: true,
            relatedId: task.id
          });
        }
      }
    });

    // Add productivity insights
    const completedToday = tasks.filter(task => {
      if (!task.completed) return false;
      const completedDate = new Date(task.createdAt);
      return completedDate.toDateString() === now.toDateString();
    });

    if (completedToday.length >= 5) {
      newNotifications.push({
        id: `productivity-${now.getTime()}`,
        type: 'info',
        title: 'Great Progress!',
        message: `You've completed ${completedToday.length} tasks today. Keep it up!`,
        timestamp: now,
        priority: 'low'
      });
    }

    // Filter out existing notifications
    const existingIds = notifications.map(n => n.id);
    const uniqueNewNotifications = newNotifications.filter(n => !existingIds.includes(n.id));

    if (uniqueNewNotifications.length > 0) {
      setNotifications(prev => [...uniqueNewNotifications, ...prev].slice(0, 20)); // Keep last 20
      setHasUnread(true);
      
      // Request permission for browser notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        uniqueNewNotifications.forEach(notification => {
          if (notification.priority === 'high') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/icon-192.png',
              tag: notification.id
            });
          }
        });
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionable && notification.relatedId) {
      if (notification.type === 'task' && onTaskComplete) {
        // For overdue or due tasks, we might want to open the task instead of completing it
        // onTaskComplete(notification.relatedId);
      } else if (notification.type === 'event' && onEventClick) {
        onEventClick(notification.relatedId);
      }
    }
    dismissNotification(notification.id);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setHasUnread(false);
  };

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'task':
        return priority === 'high' ? <AlertTriangle size={20} className="text-red-500" /> : <CheckCircle size={20} className="text-blue-500" />;
      case 'event':
        return <Calendar size={20} className="text-purple-500" />;
      case 'reminder':
        return <Clock size={20} className="text-orange-500" />;
      default:
        return <Info size={20} className="text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      default: return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (hasUnread) setHasUnread(false);
        }}
        className="relative p-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
      >
        <Bell size={20} />
        {(hasUnread || notifications.length > 0) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
          >
            {notifications.length > 9 ? '9+' : notifications.length}
          </motion.div>
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-3 mb-2 rounded-xl border-l-4 ${getPriorityColor(notification.priority)} cursor-pointer hover:shadow-md transition-all`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {notification.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};