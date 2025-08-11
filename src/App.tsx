import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { Header } from "./components/Header";
import { TaskSidebar } from "./components/TaskSidebar";
import { CalendarView } from "./components/CalendarView";
import { TaskModal } from "./components/TaskModal";
import { EventModal } from "./components/EventModal";
import { useIndexedDB } from "./hooks/useIndexedDB";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useTheme } from "./hooks/useTheme";
import { authManager } from "./utils/auth";
import { googleCalendarAPI } from "./utils/googleCalendar";
import { openaiService } from "./utils/openai";
import { Task, CalendarEvent, User, AITaskSuggestion } from "./types";
import { format } from "date-fns";
import { useTasksApi } from "./hooks/useTasksApi";
import { useEventsApi } from "./hooks/useEventsApi";
import { useCategoriesApi } from "./hooks/useCategoriesApi";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AITaskSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const isOnline = useOnlineStatus();
   const {
  //   tasks,
  //   events,
  //   categories,
  //   loading,
  //   saveTask,
  //   deleteTask,
  //   saveEvent,
  //   deleteEvent,
     clearAllData,
  //   refresh,
  } = useIndexedDB();

  const { tasks, loading: tasksLoading, saveTask, deleteTask } = useTasksApi();
  const {
    events,
    loading: eventsLoading,
    saveEvent,
    deleteEvent,
  } = useEventsApi();
  const {
    categories,
    loading: categoriesLoading,
    saveCategory,
    deleteCategory,
  } = useCategoriesApi();

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
    if (user && isOnline && !syncing) {
      syncWithGoogleCalendar();
    }
  }, [user, isOnline]);

  const syncWithGoogleCalendar = async () => {
    if (!user || !isOnline || syncing) return;

    try {
      setSyncing(true);
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthAhead = new Date(now.getFullYear(), now.getMonth() + 2, 0);

      const googleEvents = await googleCalendarAPI.getEvents(
        monthAgo,
        monthAhead
      );
      await Promise.all(googleEvents.map((event) => saveEvent(event)));
      console.log(`Synced ${googleEvents.length} events from Google Calendar`);
    } catch (error) {
      console.error("Failed to sync with Google Calendar:", error);
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

  const handleTaskSave = async (
    taskData: Omit<Task, "id" | "createdAt" | "userId">
  ) => {
    if (!user) return;

    const task: Task = {
      ...taskData,
      id: selectedTask?.id || uuidv4(),
      createdAt: selectedTask?.createdAt || new Date(),
      userId: user.id,
    };

    await saveTask(task);
    setSelectedTask(null);
  };

  const handleEventSave = async (
    eventData: Omit<CalendarEvent, "id" | "userId">
  ) => {
    if (!user) return;

    const event: CalendarEvent = {
      ...eventData,
      id: selectedEvent?.id || uuidv4(),
      userId: user.id,
    };

    await saveEvent(event);

    if (user && isOnline && !selectedEvent) {
      try {
        const googleEvent = await googleCalendarAPI.createEvent(eventData);
        await saveEvent({ ...googleEvent, userId: user.id });
      } catch (error) {
        console.error("Failed to sync event with Google Calendar:", error);
      }
    }

    setSelectedEvent(null);
  };

  const handleTaskComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await saveTask({ ...task, completed: !task.completed });
    }
  };

  const handleTaskDrop = async (task: Task, date: Date) => {
    if (!user) return;

    const scheduledDate = new Date(date);
    scheduledDate.setHours(9, 0, 0, 0);

    const event: CalendarEvent = {
      id: uuidv4(),
      title: task.title,
      description: task.description,
      start: scheduledDate,
      end: new Date(
        scheduledDate.getTime() + (task.estimatedDuration || 60) * 60000
      ),
      category: task.category,
      userId: user.id,
    };

    await saveEvent(event);
    await saveTask({ ...task, scheduledDate, userId: user.id });
  };

  const handleEventDrop = async (
    event: CalendarEvent,
    newStart: Date,
    newEnd: Date
  ) => {
    const updatedEvent = { ...event, start: newStart, end: newEnd };
    await saveEvent(updatedEvent);

    if (event.isGoogleEvent && user && isOnline) {
      try {
        await googleCalendarAPI.updateEvent(updatedEvent);
      } catch (error) {
        console.error("Failed to update Google Calendar event:", error);
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    await deleteEvent(eventId);

    if (event?.isGoogleEvent && event.googleEventId && user && isOnline) {
      try {
        await googleCalendarAPI.deleteEvent(event.googleEventId);
      } catch (error) {
        console.error("Failed to delete Google Calendar event:", error);
      }
    }
  };

  const handleGetTaskSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const completedTasks = tasks.filter((t) => t.completed);
      const currentDay = format(new Date(), "EEEE");
      const suggestions = await openaiService.generateTaskSuggestions(
        completedTasks,
        currentDay
      );
      console.log("AI Suggestions:", suggestions);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("Failed to get AI suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: AITaskSuggestion) => {
    if (!user) return;

    const category =
      categories.find((c) => c.id === suggestion.category) || categories[0];

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

    await saveTask(task);
    setAiSuggestions((prev) => prev.filter((s) => s !== suggestion));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading your calendar...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-lg min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header
        user={user}
        onAuthChange={handleAuthChange}
        theme={theme}
        onThemeToggle={toggleTheme}
        isOnline={isOnline}
      />

      <div className="flex flex-col sm:flex-row h-[calc(100vh-80px)] overflow-hidden px-2 sm:px-4 py-2 gap-2">
        <div className="flex-none sm:basis-1/4 min-w-[280px] max-w-sm h-full overflow-hidden">
          <TaskSidebar
            tasks={tasks}
            categories={categories}
            onTaskComplete={handleTaskComplete}
            onTaskDelete={deleteTask}
            onTaskEdit={openTaskModal}
            onNewTask={() => openTaskModal()}
            onTaskSuggestions={handleGetTaskSuggestions}
            suggestions={aiSuggestions}
            onAcceptSuggestion={handleAcceptSuggestion}
            isLoadingSuggestions={isLoadingSuggestions}
          />
        </div>

        <div className="rounded-xl shadow-lg flex-grow sm:basis-3/4 h-full overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
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
      </div>

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

      <AnimatePresence>
        {syncing && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Syncing with Google Calendar...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
