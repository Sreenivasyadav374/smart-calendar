export const DEFAULT_CATEGORIES = [
  {
    id: 'work',
    name: 'Work',
    color: '#3B82F6',
    icon: 'briefcase'
  },
  {
    id: 'personal',
    name: 'Personal',
    color: '#10B981',
    icon: 'user'
  },
  {
    id: 'health',
    name: 'Health',
    color: '#F59E0B',
    icon: 'heart'
  },
  {
    id: 'learning',
    name: 'Learning',
    color: '#8B5CF6',
    icon: 'book'
  },
  {
    id: 'social',
    name: 'Social',
    color: '#EF4444',
    icon: 'users'
  }
];

export const PRIORITY_COLORS = {
  low: '#6B7280',
  medium: '#F59E0B',
  high: '#EF4444'
};

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');