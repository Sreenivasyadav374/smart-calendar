export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  dueDate?: Date;
  scheduledDate?: Date;
  estimatedDuration?: number; // in minutes
  userId: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  category: TaskCategory;
  isGoogleEvent?: boolean;
  googleEventId?: string;
  allDay?: boolean;
  userId: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface AITaskSuggestion {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number;
  reasoning: string;
}

export interface AppState {
  user: User | null;
  tasks: Task[];
  events: CalendarEvent[];
  categories: TaskCategory[];
  isOnline: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
}