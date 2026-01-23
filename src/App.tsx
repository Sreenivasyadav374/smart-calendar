import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { Header } from "./components/Header";
import { TaskSidebar } from "./components/TaskSidebar";
import { CalendarView } from "./components/CalendarView";
import { TaskModal } from "./components/TaskModal";
import { EventModal } from "./components/EventModal";
import { NotificationSystem } from "./components/NotificationSystem";
import { WeeklySummary } from "./components/WeeklySummary";
import { useIndexedDB } from "./hooks/useIndexedDB";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useTheme } from "./hooks/useTheme";
import { authManager } from "./utils/auth";
import { googleCalendarAPI } from "./utils/googleCalendar";
import { openaiService } from "./utils/openai";
import { Task, CalendarEvent, User, AITaskSuggestion, Notification } from "./types";
import { format } from "date-fns";
import { useTasksApi } from "./hooks/useTasksApi";
import { useEventsApi } from "./hooks/useEventsApi";
import { useCategoriesApi } from "./hooks/useCategoriesApi";
import { BarChart3 } from "lucide-react";
import { aiService as geminiService } from "./utils/llmModel";


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isWeeklySummaryOpen, setIsWeeklySummaryOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AITaskSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const { theme, toggleTheme } = useTheme();
  const isOnline = useOnlineStatus();
  const { clearAllData } = useIndexedDB(user);

// Inside function App() { ... }

// Before:
// const { tasks, loading: tasksLoading, saveTask, deleteTask } = useTasksApi();
// const { events, loading: eventsLoading, saveEvent, deleteEvent } = useEventsApi();
// const { categories, loading: categoriesLoading, saveCategory, deleteCategory } = useCategoriesApi();

// After:
const { tasks, loading: tasksLoading, saveTask, deleteTask } = useTasksApi(user);
const { events, loading: eventsLoading, saveEvent, deleteEvent } = useEventsApi(user);
const { categories, loading: categoriesLoading, saveCategory, deleteCategory } = useCategoriesApi(user);

  const loading = tasksLoading || eventsLoading || categoriesLoading;

  useEffect(() => {
    const existingUser = authManager.getCurrentUser();
    if (existingUser && authManager.isAuthenticated()) {
      setUser(existingUser);
      syncWithGoogleCalendar();
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  useEffect(() => {
    if (user && isOnline && !syncing && shouldSync()) {
      syncWithGoogleCalendar();
    }
  }, [user, isOnline]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
    };
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const shouldSync = (): boolean => {
    if (!lastSyncTime) return true;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSyncTime < fiveMinutesAgo;
  };
  const syncWithGoogleCalendar = async () => {
    if (!user || !isOnline || syncing) return;

    try {
      setSyncing(true);
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthAhead = new Date(now.getFullYear(), now.getMonth() + 2, 0);

      // Enhanced sync with bidirectional support
      const syncResult = await googleCalendarAPI.syncEvents(events);
      
      // Process sync results
      await Promise.all([
        ...syncResult.created.map(event => saveEvent(event)),
        ...syncResult.updated.map(event => saveEvent(event))
      ]);
      
      // Handle deleted events
      for (const deletedId of syncResult.deleted) {
        await deleteEvent(deletedId);
      }
      
      setLastSyncTime(new Date());
      console.log(`Sync completed: ${syncResult.created.length} created, ${syncResult.updated.length} updated, ${syncResult.deleted.length} deleted`);
    } catch (error) {
      console.error("Failed to sync with Google Calendar:", error);
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('Authentication expired')) {
        // Could trigger re-authentication flow
        console.warn('Google Calendar authentication expired');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleAuthChange = async (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      await syncWithGoogleCalendar();
    } else {
      await clearAllData();
    }
  };

  const handleTaskSave = async (taskData: Omit<Task, "id" | "createdAt" | "userId">) => {
    if (!user) return;

    const isNew = !selectedTask;
    const defaultCategory = categories[0] || { id: "social", name: "Social" };

    const task: Task = {
      ...taskData,
      id: isNew ? uuidv4() : selectedTask.id,
      createdAt: isNew ? new Date() : selectedTask.createdAt,
      category: taskData.category || defaultCategory, // <-- always send a category
      userId: user.id,
    };

    await saveTask(task, isNew);
    setSelectedTask(null);
    setIsTaskModalOpen(false);
  };


const handleEventSave = async (eventData: Omit<CalendarEvent, "id" | "userId">) => {
  if (!user) return;

  const isUpdate = !!selectedEvent?.id;

  // Create/Update a single DB event first
  const event: CalendarEvent = {
    ...eventData,
    id: isUpdate ? selectedEvent!.id : uuidv4(),
    userId: user.id,
    isGoogleEvent: false,
  };

  // Save once
  const saved = await saveEvent(event, isUpdate);

  // Sync to Google (then UPDATE the same event)
  if (user && isOnline && !event.isGoogleEvent) {
    try {
      const googleEvent = await googleCalendarAPI.createEvent(eventData);

      // Update the same DB record with googleEventId
      await saveEvent(
        {
          ...(saved ?? event),                // if saveEvent returns saved event; else fallback
          googleEventId: googleEvent.id,      // map correctly based on your google response
          isGoogleEvent: true,                // or syncedToGoogle: true
        },
        true                                  // <-- UPDATE, not CREATE
      );
    } catch (error) {
      console.error("Failed to sync event with Google Calendar:", error);
    }
  }

  setSelectedEvent(null);
  setIsEventModalOpen(false);
};

  // const handleTaskComplete = async (taskId: string) => {
  //   const task = tasks.find((t) => t.id === taskId);
  //   if (task) {
  //     await saveTask({ ...task, completed: !task.completed },false);
  //   }
  // };

  const handleTaskDrop = async (task: Task, date: Date) => {
    if (!user) return;

    const scheduledDate = new Date(date);
    scheduledDate.setHours(9, 0, 0, 0);

    const event: CalendarEvent = {
      id: uuidv4(),
      title: task.title,
      description: task.description,
      start: scheduledDate,
      end: new Date(scheduledDate.getTime() + (task.estimatedDuration || 60) * 60000),
      category: task.category,
      userId: user.id,
    };

    await saveEvent(event);
    await saveTask({ ...task, scheduledDate, userId: user.id },false);
  };

  const handleEventDrop = async (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    if (!user) return; // ADDED CHECK: Block if logged out

    const updatedEvent = { ...event, start: newStart, end: newEnd };
    await saveEvent(updatedEvent, true);

    // Sync with Google Calendar if it's a Google event
    if (event.isGoogleEvent && event.googleEventId && user && isOnline) {
      try {
        await googleCalendarAPI.updateEvent(updatedEvent);
      } catch (error) {
        console.error("Failed to update Google Calendar event:", error);
        // Revert the change if Google sync fails
        await saveEvent(event, true);
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return; // ADDED CHECK: Block if logged out

    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    
    await deleteEvent(eventId);

    if (event?.isGoogleEvent && event.googleEventId && user && isOnline) {
      try {
        await googleCalendarAPI.deleteEvent(event.googleEventId);
      } catch (error) {
        console.error("Failed to delete Google Calendar event:", error);
        // Could show user notification about partial failure
      }
    }
  };

  const handleGetTaskSuggestions = async () => {
    if (!user) return; // ADDED CHECK: Block if logged out

    setIsLoadingSuggestions(true);
    try {
      const recentTasks = tasks.slice(-20); // Get more recent context
      const currentDay = format(new Date(), "EEEE");
      const userGoals = ['productivity', 'health', 'learning']; // Could be user-configurable
      const suggestions = await geminiService.generateTaskSuggestions(recentTasks, currentDay, userGoals);
      console.log("AI Suggestions:", suggestions);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("Failed to get AI suggestions:", error);
      // Show user-friendly error message
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: AITaskSuggestion) => {
    if (!user) return;

    const category = categories.find((c) => c.id === suggestion.category) || categories[0];

    const task: Task = {
      id: uuidv4(),
      title: suggestion.title,
      description: suggestion.description,
      category,
      priority: suggestion.priority,
      estimatedDuration: suggestion.estimatedDuration,
      completed: false,
      createdAt: new Date(),
      userId: user.id,
    };

    await saveTask(task,true);
    setAiSuggestions((prev) => prev.filter((s) => s !== suggestion));
  };

  const handleClearSuggestions = () => {
    setAiSuggestions([]);
  };

  const openTaskModal = (task?: Task) => {
    setSelectedTask(task || null);
    setIsTaskModalOpen(true);
  };

  const openEventModal = (event?: CalendarEvent, date?: Date) => {
    setSelectedEvent(event || null);
    setSelectedDate(date || null);
    setIsEventModalOpen(true);
  };

  // Add if (!user) return; to handleTaskComplete
const handleTaskComplete = async (taskId: string) => {
    if (!user) return; // ADDED CHECK: Block if logged out

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await saveTask({ ...task, completed: !task.completed },false);
    }
};

// // Add if (!user) return; to handleDeleteEvent
// const handleDeleteEvent = async (eventId: string) => {
//     if (!user) return; // ADDED CHECK: Block if logged out

//     const event = events.find((e) => e.id === eventId);
//     if (!event) return;
    
//     await deleteEvent(eventId);

//     // ... rest of the Google Calendar sync logic
// };

// // Add if (!user) return; to handleEventDrop
// const handleEventDrop = async (event: CalendarEvent, newStart: Date, newEnd: Date) => {
//     if (!user) return; // ADDED CHECK: Block if logged out

//     const updatedEvent = { ...event, start: newStart, end: newEnd };
//     await saveEvent(updatedEvent, true);

//     // ... rest of the Google Calendar sync logic
// };

// Add if (!user) return; to handleGetTaskSuggestions
// const handleGetTaskSuggestions = async () => {
//     if (!user) return; // ADDED CHECK: Block if logged out

//     setIsLoadingSuggestions(true);
//     // ... rest of the AI logic
// };

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            openTaskModal();
            break;
          case 'e':
            e.preventDefault();
            openEventModal(undefined, new Date());
            break;
          case 's':
            e.preventDefault();
            if (user && isOnline) {
              syncWithGoogleCalendar();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [user, isOnline]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"
          />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Loading Smart Calendar
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Preparing your intelligent workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500">
      <Header
        user={user}
        onAuthChange={handleAuthChange}
        theme={theme}
        onThemeToggle={toggleTheme}
        isOnline={isOnline}
      />

      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden px-4 py-4 gap-4">
        {/* Task Sidebar */}
        <div className="flex-none lg:basis-1/3 xl:basis-1/4 min-w-[320px] max-w-md h-full overflow-hidden">
          <TaskSidebar
            tasks={user ? tasks : []}       
            categories={user ? categories : []} 
            onTaskComplete={handleTaskComplete}
            onTaskDelete={deleteTask}
            onTaskEdit={openTaskModal}
            onNewTask={() => openTaskModal()}
            onTaskSuggestions={handleGetTaskSuggestions}
            suggestions={aiSuggestions}
            onAcceptSuggestion={handleAcceptSuggestion}
            onClearSuggestions={handleClearSuggestions}
            isLoadingSuggestions={isLoadingSuggestions}
          />
        </div>

        {/* Calendar View */}
        <div className="flex-grow lg:basis-2/3 xl:basis-3/4 h-full overflow-hidden flex flex-col">
          <CalendarView
            events={events}
            onEventClick={(event) => openEventModal(event)}
            onDateSelect={(date) => openEventModal(undefined, date)}
            onEventDrop={handleEventDrop}
            onTaskDrop={handleTaskDrop}
            theme={theme}
          />
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsWeeklySummaryOpen(true)}
          className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          title="Weekly Summary"
        >
          <BarChart3 size={24} />
        </motion.button>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleTaskSave}
        task={selectedTask}
        categories={categories}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleEventSave}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        categories={categories}
        selectedDate={selectedDate || new Date()}
      />

      <WeeklySummary
        isOpen={isWeeklySummaryOpen}
        onClose={() => setIsWeeklySummaryOpen(false)}
        tasks={tasks}
        events={events}
      />

      {/* Notification System */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationSystem
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>

      {/* Sync Status */}
      <AnimatePresence>
        {syncing && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3"
          >
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Syncing with Google Calendar...</span>
          </motion.div>
        )}
        
        {/* Last Sync Indicator */}
        {lastSyncTime && !syncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-4 left-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-4 py-2 rounded-xl text-sm"
          >
            Last sync: {lastSyncTime.toLocaleTimeString()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;