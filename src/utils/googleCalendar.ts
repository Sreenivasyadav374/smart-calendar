import { CalendarEvent } from '../types';
import { authManager } from './auth';

class GoogleCalendarAPI {
  async getEvents(timeMin?: Date, timeMax?: Date): Promise<CalendarEvent[]> {
    const accessToken = authManager.getAccessToken();
    if (!accessToken) throw new Error('Not authenticated');

    const params = new URLSearchParams({
      access_token: accessToken,
      singleEvents: 'true',
      orderBy: 'startTime',
      ...(timeMin && { timeMin: timeMin.toISOString() }),
      ...(timeMax && { timeMax: timeMax.toISOString() })
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google Calendar events');
    }

    const data = await response.json();
    return data.items?.map((item: any) => ({
      id: `google-${item.id}`,
      title: item.summary || 'Untitled Event',
      start: new Date(item.start.dateTime || item.start.date),
      end: new Date(item.end.dateTime || item.end.date),
      description: item.description,
      category: { id: 'work', name: 'Work', color: '#3B82F6', icon: 'briefcase' },
      isGoogleEvent: true,
      googleEventId: item.id,
      allDay: !item.start.dateTime
    })) || [];
  }

async createEvent(event: Omit<CalendarEvent, 'id' | 'isGoogleEvent' | 'googleEventId' | 'userId'>): Promise<CalendarEvent> {
  const accessToken = authManager.getAccessToken();
  if (!accessToken) throw new Error('Not authenticated');

  const user = authManager.getCurrentUser();
  if (!user) throw new Error('User not found');

  const eventData = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: event.end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    }
  );

  if (!response.ok) {
    throw new Error('Failed to create Google Calendar event');
  }

  const createdEvent = await response.json();

  return {
    ...event,
    id: `google-${createdEvent.id}`,
    isGoogleEvent: true,
    googleEventId: createdEvent.id,
    userId: user.id, // ✅ this fixes the error
  };
}


  async updateEvent(event: CalendarEvent): Promise<CalendarEvent> {
    const accessToken = authManager.getAccessToken();
    if (!accessToken || !event.googleEventId) throw new Error('Not authenticated or invalid event');

    const eventData = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.googleEventId}?access_token=${accessToken}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update Google Calendar event');
    }

    return event;
  }

  async deleteEvent(googleEventId: string): Promise<void> {
    const accessToken = authManager.getAccessToken();
    if (!accessToken) throw new Error('Not authenticated');

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}?access_token=${accessToken}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete Google Calendar event');
    }
  }
}

export const googleCalendarAPI = new GoogleCalendarAPI();