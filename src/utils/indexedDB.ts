import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Task, CalendarEvent, TaskCategory } from '../types';

interface CalendarDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
  };
  events: {
    key: string;
    value: CalendarEvent;
  };
  categories: {
    key: string;
    value: TaskCategory;
  };
  sync: {
    key: string;
    value: {
      id: string;
      lastSync: Date;
      pendingChanges: any[];
    };
  };
}

class IndexedDBManager {
  private db: IDBPDatabase<CalendarDB> | null = null;

  async init() {
    this.db = await openDB<CalendarDB>('CalendarDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync')) {
          db.createObjectStore('sync', { keyPath: 'id' });
        }
      },
    });
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    if (!this.db) await this.init();
    return (await this.db!.getAll('tasks')).map(task => ({
      ...task,
      createdAt: new Date(task.createdAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : undefined,
    }));
  }

  async saveTask(task: Task): Promise<void> {
  if (!this.db) await this.init();

  if (!task.id) task.id = crypto.randomUUID();

  console.log("Saving task:", task);

  await this.db.put('tasks', task);

  const tasks = await this.db.getAll('tasks');
  console.log("Current tasks in DB:", tasks);
}


  async deleteTask(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('tasks', id);
  }

  // Events
  async getEvents(): Promise<CalendarEvent[]> {
    if (!this.db) await this.init();
    return (await this.db!.getAll('events')).map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    }));
  }

  async saveEvent(event: CalendarEvent): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('events', event);
  }

  async deleteEvent(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('events', id);
  }

  // Categories
  async getCategories(): Promise<TaskCategory[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('categories');
  }

  async saveCategory(category: TaskCategory): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('categories', category);
  }

  // Sync
  async getLastSync(): Promise<Date | null> {
    if (!this.db) await this.init();
    const sync = await this.db!.get('sync', 'lastSync');
    return sync ? new Date(sync.lastSync) : null;
  }

  async updateLastSync(): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('sync', {
      id: 'lastSync',
      lastSync: new Date(),
      pendingChanges: []
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction(['tasks', 'events', 'categories', 'sync'], 'readwrite');
    await Promise.all([
      tx.objectStore('tasks').clear(),
      tx.objectStore('events').clear(),
      tx.objectStore('categories').clear(),
      tx.objectStore('sync').clear()
    ]);
  }
}

export const dbManager = new IndexedDBManager();