import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Tag, FileText, MapPin, Users, Repeat, Bell, Video } from 'lucide-react';
import { CalendarEvent, TaskCategory } from '../types';
import { format } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  onDelete?: (id: string) => void;
  event?: CalendarEvent | null;
  categories: TaskCategory[];
  selectedDate?: Date;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  categories,
  selectedDate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    categoryId: 'work',
    allDay: false,
    location: '',
    attendees: '',
    isRecurring: false,
    recurringPattern: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurringEndDate: '',
    recurringCount: 0,
    reminderEnabled: true,
    reminderMinutes: 15,
    meetingLink: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        start: format(event.start, "yyyy-MM-dd'T'HH:mm"),
        end: format(event.end, "yyyy-MM-dd'T'HH:mm"),
        categoryId: event.category.id,
        allDay: event.allDay || false,
        location: '',
        attendees: '',
        isRecurring: false,
        recurringPattern: 'weekly',
        recurringEndDate: '',
        recurringCount: 0,
        reminderEnabled: true,
        reminderMinutes: 15,
        meetingLink: ''
      });
    } else if (selectedDate) {
      const start = new Date(selectedDate);
      const end = new Date(selectedDate);
      end.setHours(start.getHours() + 1);

      setFormData({
        title: '',
        description: '',
        start: format(start, "yyyy-MM-dd'T'HH:mm"),
        end: format(end, "yyyy-MM-dd'T'HH:mm"),
        categoryId: 'work',
        allDay: false,
        location: '',
        attendees: '',
        isRecurring: false,
        recurringPattern: 'weekly',
        recurringEndDate: '',
        recurringCount: 0,
        reminderEnabled: true,
        reminderMinutes: 15,
        meetingLink: ''
      });
    }
  }, [event, selectedDate]);

  const processNaturalLanguage = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    // Extract time patterns
    const timeRegex = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/gi;
    const dateRegex = /(tomorrow|today|next\s+\w+|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi;
    
    let updatedFormData = { ...formData };
    
    // Extract time
    const timeMatch = timeRegex.exec(input);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3];
      
      if (ampm === 'pm' && hour !== 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      
      const startDate = new Date(formData.start || new Date());
      startDate.setHours(hour, minute, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(hour + 1, minute, 0, 0);
      
      updatedFormData.start = format(startDate, "yyyy-MM-dd'T'HH:mm");
      updatedFormData.end = format(endDate, "yyyy-MM-dd'T'HH:mm");
    }
    
    // Extract date
    const dateMatch = dateRegex.exec(input);
    if (dateMatch) {
      const dateStr = dateMatch[0].toLowerCase();
      let targetDate = new Date();
      
      if (dateStr === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (dateStr === 'today') {
        // Keep current date
      } else {
        // Handle day names
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = days.indexOf(dateStr);
        if (targetDay !== -1) {
          const currentDay = targetDate.getDay();
          const daysUntilTarget = (targetDay + 7 - currentDay) % 7;
          targetDate.setDate(targetDate.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        }
      }
      
      const currentTime = formData.start ? new Date(formData.start) : new Date();
      targetDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
      const endDate = new Date(targetDate);
      endDate.setHours(targetDate.getHours() + 1);
      
      updatedFormData.start = format(targetDate, "yyyy-MM-dd'T'HH:mm");
      updatedFormData.end = format(endDate, "yyyy-MM-dd'T'HH:mm");
    }
    
    // Clean title
    const cleanTitle = input
      .replace(timeRegex, '')
      .replace(dateRegex, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanTitle) {
      updatedFormData.title = cleanTitle;
    }
    
    setFormData(updatedFormData);
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({ ...prev, title: value }));
    
    // Trigger NLP processing if input looks like natural language
    if (value.length > 5 && (value.includes(' ') && (value.match(/\d/) || value.includes('tomorrow') || value.includes('today')))) {
      processNaturalLanguage(value);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const category = categories.find(c => c.id === formData.categoryId) || categories[0];
    
    let eventData: Omit<CalendarEvent, 'id'> = {
      title: formData.title,
      description: formData.description,
      start: new Date(formData.start),
      end: new Date(formData.end),
      category,
      allDay: formData.allDay
    };
    
    // Handle recurring events
    if (formData.isRecurring) {
      const events = generateRecurringEvents(eventData, formData.recurringPattern, formData.recurringEndDate, formData.recurringCount);
      events.forEach(event => onSave(event));
    } else {
      onSave(eventData);
    }
    onClose();
  };

  const generateRecurringEvents = (
    baseEvent: Omit<CalendarEvent, 'id'>, 
    pattern: string, 
    endDate: string, 
    count: number
  ): Array<Omit<CalendarEvent, 'id'>> => {
    const events: Array<Omit<CalendarEvent, 'id'>> = [baseEvent];
    const startDate = new Date(baseEvent.start);
    const duration = baseEvent.end.getTime() - baseEvent.start.getTime();
    
    const maxEvents = count > 0 ? count : 52; // Default to 1 year
    const endDateTime = endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    for (let i = 1; i < maxEvents; i++) {
      const nextStart = new Date(startDate);
      
      switch (pattern) {
        case 'daily':
          nextStart.setDate(startDate.getDate() + i);
          break;
        case 'weekly':
          nextStart.setDate(startDate.getDate() + (i * 7));
          break;
        case 'monthly':
          nextStart.setMonth(startDate.getMonth() + i);
          break;
        case 'yearly':
          nextStart.setFullYear(startDate.getFullYear() + i);
          break;
      }
      
      if (nextStart > endDateTime) break;
      
      const nextEnd = new Date(nextStart.getTime() + duration);
      
      events.push({
        ...baseEvent,
        start: nextStart,
        end: nextEnd
      });
    }
    
    return events;
  };
  const handleDelete = () => {
    if (event && onDelete && confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
      onClose();
    }
  };

  const quickTimeSlots = [
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '2 hours', minutes: 120 },
    { label: '4 hours', minutes: 240 },
  ];

  const setQuickDuration = (minutes: number) => {
    if (formData.start) {
      const startDate = new Date(formData.start);
      const endDate = new Date(startDate.getTime() + minutes * 60000);
      setFormData(prev => ({ ...prev, end: format(endDate, "yyyy-MM-dd'T'HH:mm") }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 m-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                  <Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {event ? 'Edit Event' : 'New Event'}
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <FileText size={16} className="inline mr-1" />
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., 'Meeting tomorrow 3pm' or 'Lunch with John Friday 12:30'"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  💡 Try natural language like "Meeting tomorrow 3pm" or "Lunch Friday 12:30"
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add event details, agenda, or notes..."
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Date & Time */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Clock size={16} className="inline mr-1" />
                    Date & Time
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allDay"
                      checked={formData.allDay}
                      onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="allDay" className="text-sm text-gray-700 dark:text-gray-300">
                      All day
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Start
                    </label>
                    <input
                      type={formData.allDay ? "date" : "datetime-local"}
                      value={formData.allDay ? formData.start.split('T')[0] : formData.start}
                      onChange={(e) => setFormData(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      End
                    </label>
                    <input
                      type={formData.allDay ? "date" : "datetime-local"}
                      value={formData.allDay ? formData.end.split('T')[0] : formData.end}
                      onChange={(e) => setFormData(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Quick Duration Buttons */}
                {!formData.allDay && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Quick Duration
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {quickTimeSlots.map((slot) => (
                        <motion.button
                          key={slot.minutes}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setQuickDuration(slot.minutes)}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {slot.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Category & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Tag size={16} className="inline mr-1" />
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Conference Room A, Zoom, etc."
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Attendees & Meeting Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Users size={16} className="inline mr-1" />
                    Attendees
                  </label>
                  <input
                    type="text"
                    value={formData.attendees}
                    onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
                    placeholder="john@example.com, jane@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Video size={16} className="inline mr-1" />
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Advanced Options</h3>
                
                {/* Recurring */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Recurring Event</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer" >
                    <input
                    placeholder='Recurring event?'
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {formData.isRecurring && (
                  <div>
                    <select
                      value={formData.recurringPattern}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurringPattern: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly' }))}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                        <input
                          type="date"
                          value={formData.recurringEndDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                          className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max Count</label>
                        <input
                          type="number"
                          min="0"
                          max="365"
                          value={formData.recurringCount}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurringCount: parseInt(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 text-xs rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Reminders */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Reminder</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.reminderEnabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {formData.reminderEnabled && (
                  <div>
                    <select
                      value={formData.reminderMinutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    >
                      <option value={5}>5 minutes before</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                      <option value={60}>1 hour before</option>
                      <option value={1440}>1 day before</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {event && onDelete && !event.isGoogleEvent && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-3 text-sm font-semibold bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Event
                  </motion.button>
                )}
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 text-sm font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {event ? 'Update Event' : 'Create Event'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};