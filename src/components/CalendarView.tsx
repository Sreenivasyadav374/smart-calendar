import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarEvent, Task } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date) => void;
  onEventDrop: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onTaskDrop: (task: Task, date: Date) => void;
  theme: 'light' | 'dark';
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onTaskDrop,
  theme
}) => {
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.refetchEvents();
    }
  }, [events]);

  const handleDrop = (info: any) => {
    try {
      const taskData = JSON.parse(info.draggedEl.dataset.task || '{}');
      if (taskData.id) {
        onTaskDrop(taskData, info.date);
      }
    } catch (error) {
      console.error('Failed to parse dropped task data:', error);
    }
  };

  const handleEventDrop = (info: any) => {
    const event = events.find(e => e.id === info.event.id);
    if (event) {
      onEventDrop(event, info.event.start, info.event.end || info.event.start);
    }
  };

  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: event.category.color,
    borderColor: event.category.color,
    textColor: '#ffffff',
    extendedProps: {
      description: event.description,
      category: event.category,
      isGoogleEvent: event.isGoogleEvent
    }
  }));

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 p-6">
      <div 
        className="h-full"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={calendarEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={(info) => onDateSelect(info.start)}
          eventClick={(info) => {
            const event = events.find(e => e.id === info.event.id);
            if (event) {
              onEventClick(event);
            }
          }}
          eventDrop={handleEventDrop}
          eventResize={(info) => {
            const event = events.find(e => e.id === info.event.id);
            if (event) {
              onEventDrop(event, info.event.start, info.event.end || info.event.start);
            }
          }}
          height="100%"
          themeSystem="standard"
          eventDisplay="block"
          dayHeaderClassNames="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700"
          eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
          dayCellClassNames="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          droppable={true}
          drop={handleDrop}
        />
      </div>
    </div>
  );
};