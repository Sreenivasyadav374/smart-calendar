// useEventsApi.ts (Modified)

import { useState, useEffect } from "react";
import { CalendarEvent, User } from "../types"; // Assuming User type is imported

const API_URL = process.env.NODE_ENV === 'production' 
  ? "/api/events" 
  : "http://localhost:5000/api/events";

// 1. Updated hook to accept user object
export function useEventsApi(user: User | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. CRITICAL: Only fetch if the user is logged in
    if (!user) {
      setLoading(false);
      setEvents([]); // Clear existing events on logout
      return;
    }

    setLoading(true); // Set loading true before starting fetch
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
        setEvents([]); 
      })
      .finally(() => setLoading(false));
  }, [user]); // 3. Added user to dependency array

  async function saveEvent(event: CalendarEvent, isUpdate: boolean = false) {
    if (!user) return; // 4. Block operation if logged out

    const method = isUpdate ? "PUT" : "POST";
    const url = isUpdate ? `${API_URL}/${event.id}` : API_URL;

    // ... rest of saveEvent logic ...
    
    // ...
  }

  async function deleteEvent(id: string) {
    if (!user) return; // 5. Block operation if logged out

    // ... rest of deleteEvent logic ...
    
    // ...
  }

  return { events, loading, saveEvent, deleteEvent };
}