import { useState, useEffect } from 'react';
import { dbManager } from '../utils/indexedDB';
import { Task, CalendarEvent, TaskCategory } from '../types';
import { DEFAULT_CATEGORIES } from '../utils/constants';

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
      
      const [loadedTasks, loadedEvents, loadedCategories] = await Promise.all([
        dbManager.getTasks(),
        dbManager.getEvents(),
        dbManager.getCategories()
      ]);

      setTasks(loadedTasks);
      setEvents(loadedEvents);
      
      if (loadedCategories.length > 0) {
        setCategories(loadedCategories);
      } else {
        // Save default categories if none exist
        await Promise.all(DEFAULT_CATEGORIES.map(cat => dbManager.saveCategory(cat)));
      }
    } catch (error) {
      console.error('Failed to load data from IndexedDB:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTask = async (task: Task) => {
    try {
      await dbManager.saveTask(task);
      setTasks(prev => {
        const index = prev.findIndex(t => t.id === task.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = task;
          return updated;
        }
        return [...prev, task];
      });
    } catch (error) {
      console.error('Failed to save task:', error);
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

  const saveEvent = async (event: CalendarEvent) => {
    try {
      await dbManager.saveEvent(event);
      setEvents(prev => {
        const index = prev.findIndex(e => e.id === event.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = event;
          return updated;
        }
        return [...prev, event];
      });
    } catch (error) {
      console.error('Failed to save event:', error);
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