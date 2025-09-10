import React, { useRef, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { CalendarEvent, Task } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Clock, Grid3X3, List, Filter } from "lucide-react";

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date) => void;
  onEventDrop: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onTaskDrop: (task: Task, date: Date) => void;
  theme: "light" | "dark";
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onTaskDrop,
  theme,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents();
    }
  }, [events]);

  const handleDrop = (info: any) => {
    try {
      const taskData = JSON.parse(info.draggedEl.dataset.task || "{}");
      if (taskData.id) {
        onTaskDrop(taskData, info.date);
      }
    } catch (error) {
      console.error("Failed to parse dropped task data:", error);
    }
  };

  const handleEventDrop = (info: any) => {
    const event = events.find((e) => e.id === info.event.id);
    if (event) {
      onEventDrop(event, info.event.start, info.event.end || info.event.start);
    }
  };

  const filteredEvents = events.filter(event => 
    selectedCategories.length === 0 || selectedCategories.includes(event.category.id)
  );

  const calendarEvents = filteredEvents.map((event) => {
    const categoryColor = event.category?.color || '#3B82F6';
    return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: categoryColor,
    borderColor: categoryColor,
    textColor: "#ffffff",
    classNames: ['premium-event'],
    extendedProps: {
      description: event.description,
      category: event.category,
      isGoogleEvent: event.isGoogleEvent,
    },
  };
  });

  const viewButtons = [
    { id: "dayGridMonth", label: "Month", icon: Grid3X3 },
    { id: "timeGridWeek", label: "Week", icon: Calendar },
    { id: "timeGridDay", label: "Day", icon: Clock },
    { id: "listWeek", label: "Agenda", icon: List },
  ];

  const changeView = (viewName: string) => {
    setCurrentView(viewName);
    calendarRef.current?.getApi().changeView(viewName);
  };

  return (
    <motion.div
      className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Enhanced Toolbar */}
      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => calendarRef.current?.getApi().prev()}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-xl transition-all"
              >
                <ChevronLeft size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => calendarRef.current?.getApi().today()}
                className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-x border-gray-200 dark:border-gray-600 transition-colors"
              >
                Today
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => calendarRef.current?.getApi().next()}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl transition-all"
              >
                <ChevronRight size={18} />
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl transition-all ${
                showFilters 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              } shadow-sm border border-gray-200 dark:border-gray-600`}
            >
              <Filter size={18} />
            </motion.button>
          </div>

          {/* View Selector */}
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 p-1">
            {viewButtons.map((view, index) => {
              const Icon = view.icon;
              return (
                <motion.button
                  key={view.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => changeView(view.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    currentView === view.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{view.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600"
            >
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filter by Category</h3>
              <div className="flex flex-wrap gap-2">
                {['work', 'personal', 'health', 'learning', 'social'].map(category => (
                  <motion.button
                    key={category}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategories(prev => 
                        prev.includes(category) 
                          ? prev.filter(c => c !== category)
                          : [...prev, category]
                      );
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    } border border-gray-200 dark:border-gray-600`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </motion.button>
                ))}
                {selectedCategories.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategories([])}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    Clear All
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Calendar Container */}
      <div
        className="h-full calendar-container"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          weekends={true}
          height="100%"
          headerToolbar={false}
          nowIndicator={true}
          scrollTime="08:00:00"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={true}
          eventDisplay="block"
          displayEventTime={true}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            omitZeroMinute: false,
            meridiem: 'short'
          }}
          select={(info) => onDateSelect(info.start)}
          eventClick={(info) => {
            const event = events.find((e) => e.id === info.event.id);
            if (event) {
              onEventClick(event);
            }
          }}
          eventDrop={handleEventDrop}
          eventResize={(info) => {
            const event = events.find((e) => e.id === info.event.id);
            const start = info.event.start ?? new Date();
            const end = info.event.end ?? start;
            if (event) {
              onEventDrop(event, start, end);
            }
          }}
          droppable={true}
          drop={handleDrop}
          eventMouseEnter={(info) => {
            info.el.style.transform = 'scale(1.02)';
            info.el.style.zIndex = '1000';
          }}
          eventMouseLeave={(info) => {
            info.el.style.transform = 'scale(1)';
            info.el.style.zIndex = 'auto';
          }}
          eventDidMount={(info) => {
            // Add premium styling to events
            info.el.classList.add('premium-event-element');
            
            // Add tooltip
            const event = events.find(e => e.id === info.event.id);
            if (event?.description) {
              info.el.title = event.description;
            }
          }}
          dayCellDidMount={(info) => {
            // Add premium styling to day cells
            info.el.classList.add('premium-day-cell');
          }}
        />
      </div>

      <style jsx>{`
        .calendar-container .fc {
          font-family: inherit;
        }
        
        .premium-event-element {
          border-radius: 8px !important;
          border: none !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.2s ease !important;
          cursor: pointer !important;
        }
        
        .premium-event-element:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
        }
        
        .premium-day-cell {
          transition: background-color 0.2s ease !important;
        }
        
        .premium-day-cell:hover {
          background-color: ${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 0.8)'} !important;
        }
        
        .fc-day-today {
          background-color: ${theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 246, 255, 0.8)'} !important;
        }
        
        .fc-col-header-cell {
          background-color: ${theme === 'dark' ? 'rgb(31, 41, 55)' : 'rgb(249, 250, 251)'} !important;
          border-color: ${theme === 'dark' ? 'rgb(75, 85, 99)' : 'rgb(229, 231, 235)'} !important;
        }
        
        .fc-daygrid-day-number {
          color: ${theme === 'dark' ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)'} !important;
          font-weight: 500 !important;
        }
        
        .fc-scrollgrid {
          border-color: ${theme === 'dark' ? 'rgb(75, 85, 99)' : 'rgb(229, 231, 235)'} !important;
        }
        
        .fc-scrollgrid td, .fc-scrollgrid th {
          border-color: ${theme === 'dark' ? 'rgb(75, 85, 99)' : 'rgb(229, 231, 235)'} !important;
        }
      `}</style>
    </motion.div>
  );
};