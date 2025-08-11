import { useState, useEffect } from "react";
import { CalendarEvent } from "../types";

const API_URL = "http://localhost:5000/api/events";

export function useEventsApi() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then((data: CalendarEvent[]) => setEvents(data))
      .catch(err => console.error("Failed to fetch events", err))
      .finally(() => setLoading(false));
  }, []);

  async function saveEvent(event: CalendarEvent) {
    const isUpdate = !!event.id;
    const method = isUpdate ? "PUT" : "POST";
    const url = isUpdate ? `${API_URL}/${event.id}` : API_URL;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      throw new Error("Failed to save event");
    }

    const saved: CalendarEvent = await res.json();
    setEvents(prev =>
      isUpdate ? prev.map(e => (e.id === saved.id ? saved : e)) : [...prev, saved]
    );
  }

  async function deleteEvent(id: string) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  return { events, loading, saveEvent, deleteEvent };
}
