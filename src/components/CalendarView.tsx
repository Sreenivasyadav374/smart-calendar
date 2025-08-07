import React, { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarEvent, Task } from "../types";
import { motion } from "framer-motion";

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

  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: event.category.color,
    borderColor: event.category.color,
    textColor: "#ffffff",
    extendedProps: {
      description: event.description,
      category: event.category,
      isGoogleEvent: event.isGoogleEvent,
    },
  }));

  return (
    <motion.div
      className="flex-1 bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-gray-950 p-3 sm:p-4 rounded-xl shadow-lg transition-all duration-500"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Floating Toolbar */}
      <motion.div
        className="sticky top-4 z-20 mb-3 flex flex-wrap items-center justify-between gap-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-2 rounded-lg shadow border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => calendarRef.current?.getApi().prev()}
            className="px-2.5 py-1 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Prev
          </button>
          <button
            onClick={() => calendarRef.current?.getApi().next()}
            className="px-2.5 py-1 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Next
          </button>
          <button
            onClick={() => calendarRef.current?.getApi().today()}
            className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            Today
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              calendarRef.current?.getApi().changeView("dayGridMonth")
            }
            className="px-2.5 py-1 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Month
          </button>
          <button
            onClick={() =>
              calendarRef.current?.getApi().changeView("timeGridWeek")
            }
            className="px-2.5 py-1 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Week
          </button>
          <button
            onClick={() =>
              calendarRef.current?.getApi().changeView("timeGridDay")
            }
            className="px-2.5 py-1 text-sm rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Day
          </button>
        </div>
      </motion.div>

      {/* Calendar Container */}
      <div
        className="h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
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
          contentHeight="auto"
          expandRows={true}// 👈 this helps calendar auto-expand rows to fit
          themeSystem="standard"
          eventDisplay="block"
          dayHeaderClassNames="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 font-semibold text-xs"
          eventClassNames="cursor-pointer rounded-md shadow-sm hover:scale-[1.015] transform transition-all duration-300 ease-in-out px-1 py-0.5 text-xs tracking-tight"
          dayCellClassNames="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          droppable={true}
          drop={handleDrop}
        />
      </div>
    </motion.div>
  );
};
