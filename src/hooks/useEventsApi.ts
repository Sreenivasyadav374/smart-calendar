import { useState, useEffect } from "react";
import { CalendarEvent } from "../types";

const API_URL = "http://localhost:5000/api/events";

export function useEventsApi() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then((data: CalendarEvent[]) => {
        // Ensure dates are properly converted
        const eventsWithDates = data.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));
        setEvents(eventsWithDates);
      })
      .catch(err => {
        console.error("Failed to fetch events", err);
        setEvents([]); // Set empty array on error to prevent blank page
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveEvent(event: CalendarEvent, isUpdate: boolean = false) {
    const method = isUpdate ? "PUT" : "POST";
    const url = isUpdate ? `${API_URL}/${event.id}` : API_URL;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to save event: ${res.status} - ${errorText}`);
      }

      const saved: CalendarEvent = await res.json();
      
      // Ensure dates are properly converted
      const savedWithDates = {
        ...saved,
        start: new Date(saved.start),
        end: new Date(saved.end),
      };
      
      setEvents(prev =>
        isUpdate 
          ? prev.map(e => (e.id === savedWithDates.id ? savedWithDates : e)) 
          : [...prev, savedWithDates]
      );
    } catch (error) {
      console.error("Save event error:", error);
      throw error;
    }
  }

  async function deleteEvent(id: string) {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete event: ${res.status} - ${errorText}`);
      }
      
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error("Delete event error:", error);
      throw error;
    }
  }

  return { events, loading, saveEvent, deleteEvent };
}
