import { CalendarEvent } from '../types';
import { authManager } from './auth';

class GoogleCalendarAPI {
  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    const accessToken = authManager.getAccessToken();
    if (!accessToken) throw new Error('Not authenticated');

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, try to refresh or re-authenticate
      throw new Error('Authentication expired');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API error: ${response.status} - ${errorText}`);
    }

    return response;
  }

  async getEvents(timeMin?: Date, timeMax?: Date): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
        ...(timeMin && { timeMin: timeMin.toISOString() }),
        ...(timeMax && { timeMax: timeMax.toISOString() })
      });

      const response = await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`
      );

      const data = await response.json();
      
      return data.items?.map((item: any) => {
        const user = authManager.getCurrentUser();
        return {
          id: `google-${item.id}`,
          title: item.summary || 'Untitled Event',
          start: new Date(item.start.dateTime || item.start.date),
          end: new Date(item.end.dateTime || item.end.date),
          description: item.description || '',
          category: { id: 'work', name: 'Work', color: '#3B82F6', icon: 'briefcase' },
          isGoogleEvent: true,
          googleEventId: item.id,
          allDay: !item.start.dateTime,
          userId: user?.id || 'anonymous'
        };
      }) || [];
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error);
      throw error;
    }
  }

  async createEvent(event: Omit<CalendarEvent, 'id' | 'isGoogleEvent' | 'googleEventId' | 'userId'>): Promise<CalendarEvent> {
    try {
      const user = authManager.getCurrentUser();
      if (!user) throw new Error('User not found');

      const eventData = {
        summary: event.title,
        description: event.description || '',
        start: event.allDay ? {
          date: event.start.toISOString().split('T')[0],
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        } : {
          dateTime: event.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: event.allDay ? {
          date: event.end.toISOString().split('T')[0],
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        } : {
          dateTime: event.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        colorId: this.getCategoryColorId(event.category?.id || 'work')
      };

      const response = await this.makeAuthenticatedRequest(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          body: JSON.stringify(eventData)
        }
      );

      const createdEvent = await response.json();

      return {
        ...event,
        id: `google-${createdEvent.id}`,
        isGoogleEvent: true,
        googleEventId: createdEvent.id,
        userId: user.id,
      };
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      throw error;
    }
  }

  async updateEvent(event: CalendarEvent): Promise<CalendarEvent> {
    try {
      if (!event.googleEventId) throw new Error('No Google Event ID found');

      const eventData = {
        summary: event.title,
        description: event.description || '',
        start: event.allDay ? {
          date: event.start.toISOString().split('T')[0],
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        } : {
          dateTime: event.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: event.allDay ? {
          date: event.end.toISOString().split('T')[0],
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        } : {
          dateTime: event.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        colorId: this.getCategoryColorId(event.category?.id || 'work')
      };

      const response = await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.googleEventId}`,
        {
          method: 'PUT',
          body: JSON.stringify(eventData)
        }
      );

      await response.json();
      return event;
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(googleEventId: string): Promise<void> {
    try {
      await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
        { method: 'DELETE' }
      );
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      throw error;
    }
  }

  private getCategoryColorId(categoryId: string): string {
    const colorMap: Record<string, string> = {
      'work': '1',      // Blue
      'personal': '2',  // Green
      'health': '3',    // Purple
      'learning': '4',  // Red
      'social': '5',    // Yellow
    };
    return colorMap[categoryId] || '1';
  }

  async syncEvents(localEvents: CalendarEvent[]): Promise<{ 
    created: CalendarEvent[], 
    updated: CalendarEvent[], 
    deleted: string[] 
  }> {
    try {
      const googleEvents = await this.getEvents();
      const result = {
        created: [] as CalendarEvent[],
        updated: [] as CalendarEvent[],
        deleted: [] as string[]
      };

      // Find events to create in Google Calendar
      const localNonGoogleEvents = localEvents.filter(e => !e.isGoogleEvent);
      for (const localEvent of localNonGoogleEvents) {
        try {
          const createdEvent = await this.createEvent(localEvent);
          result.created.push(createdEvent);
        } catch (error) {
          console.warn('Failed to create event in Google Calendar:', error);
        }
      }

      // Find events to update
      const localGoogleEvents = localEvents.filter(e => e.isGoogleEvent && e.googleEventId);
      for (const localEvent of localGoogleEvents) {
        const googleEvent = googleEvents.find(g => g.googleEventId === localEvent.googleEventId);
        if (googleEvent) {
          // Check if update is needed (simple comparison)
          if (localEvent.title !== googleEvent.title || 
              localEvent.start.getTime() !== googleEvent.start.getTime() ||
              localEvent.end.getTime() !== googleEvent.end.getTime()) {
            try {
              const updatedEvent = await this.updateEvent(localEvent);
              result.updated.push(updatedEvent);
            } catch (error) {
              console.warn('Failed to update event in Google Calendar:', error);
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to sync events:', error);
      throw error;
    }
  }
}

export const googleCalendarAPI = new GoogleCalendarAPI();