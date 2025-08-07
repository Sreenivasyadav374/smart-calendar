import { useState, useEffect } from 'react';
import { dbManager } from '../utils/indexedDB';
import { Task, CalendarEvent, TaskCategory } from '../types';
import { DEFAULT_CATEGORIES } from '../utils/constants';
import { authManager } from '../utils/auth'; 

export const useIndexedDB = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  try {
    setLoading(true);
    await dbManager.init();

    const user = authManager.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const [loadedTasks, loadedEvents, loadedCategories] = await Promise.all([
      dbManager.getTasks(),
      dbManager.getEvents(),
      dbManager.getCategories()
    ]);
    console.log('Loaded Tasks:', loadedTasks);
    console.log('Loaded Events:', loadedEvents);

    setTasks(loadedTasks.filter(t => t.userId === user.id));
    setEvents(loadedEvents.filter(e => e.userId === user.id));

    if (loadedCategories.length > 0) {
      setCategories(loadedCategories);
    } else {
      await Promise.all(DEFAULT_CATEGORIES.map(cat => dbManager.saveCategory(cat)));
    }
  } catch (error) {
    console.error('Failed to load data from IndexedDB:', error);
  } finally {
    setLoading(false);
  }
};


  const saveTask = async (task: Task) => {
  const user = authManager.getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const userTask = { ...task, userId: user.id };

  try {
    await dbManager.saveTask(userTask);
    console.log('Task saved:', userTask);
    setTasks(prev => {
      const index = prev.findIndex(t => t.id === task.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = userTask;
        return updated;
      }
      return [...prev, userTask];
    });
  } catch (error) {
    console.error('Failed to save task:', error);
    throw error;
  }
};

const saveEvent = async (event: CalendarEvent) => {
  const user = authManager.getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  const userEvent = { ...event, userId: user.id };

  try {
    await dbManager.saveEvent(userEvent);
    setEvents(prev => {
      const index = prev.findIndex(e => e.id === event.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = userEvent;
        return updated;
      }
      return [...prev, userEvent];
    });
  } catch (error) {
    console.error('Failed to save event:', error);
    throw error;
  }
};


  const deleteTask = async (id: string) => {
    try {
      await dbManager.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  };


  const deleteEvent = async (id: string) => {
    try {
      await dbManager.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  };

  const clearAllData = async () => {
    try {
      await dbManager.clearAll();
      setTasks([]);
      setEvents([]);
      setCategories(DEFAULT_CATEGORIES);
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  };

  return {
    tasks,
    events,
    categories,
    loading,
    saveTask,
    deleteTask,
    saveEvent,
    deleteEvent,
    clearAllData,
    refresh: loadData
  };
};