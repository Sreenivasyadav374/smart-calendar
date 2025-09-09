import { AITaskSuggestion, Task } from '../types';

class OpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async generateTaskSuggestions(
    completedTasks: Task[],
    currentDay: string,
    userGoals?: string[]
  ): Promise<AITaskSuggestion[]> {
    if (!this.apiKey) {
      return this.getSmartMockSuggestions(completedTasks, currentDay);
    }

    const prompt = this.buildPrompt(completedTasks, currentDay, userGoals);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an intelligent productivity assistant that analyzes user patterns and suggests relevant, actionable tasks. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      const suggestions = JSON.parse(data.choices[0].message.content);
      
      return suggestions.map((suggestion: any) => ({
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        priority: suggestion.priority,
        estimatedDuration: suggestion.estimatedDuration,
        reasoning: suggestion.reasoning
      }));
    } catch (error) {
      console.warn('OpenAI API failed, using smart mock suggestions:', error);
      return this.getSmartMockSuggestions(completedTasks, currentDay);
    }
  }

  async generateWeeklySummary(tasks: Task[], events: any[]): Promise<string> {
    if (!this.apiKey) {
      return this.getMockWeeklySummary(tasks, events);
    }

    const prompt = `
Analyze the following week's activities and provide a concise, insightful summary:

Completed Tasks: ${tasks.filter(t => t.completed).length}
Pending Tasks: ${tasks.filter(t => !t.completed).length}
Total Events: ${events.length}

Recent completed tasks:
${tasks.filter(t => t.completed).slice(-10).map(t => `- ${t.title} (${t.category.name})`).join('\n')}

Provide a 2-3 sentence summary highlighting productivity patterns, achievements, and suggestions for improvement.
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a productivity coach providing weekly insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.6
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.warn('OpenAI API failed for weekly summary:', error);
      return this.getMockWeeklySummary(tasks, events);
    }
  }

  async processNaturalLanguageInput(input: string): Promise<Partial<Task>> {
    // Enhanced NLP processing for task creation
    const lowerInput = input.toLowerCase();
    
    // Extract time patterns with more sophistication
    const timePatterns = {
      'tomorrow': () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      },
      'next week': () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek;
      },
      'monday': () => this.getNextWeekday(1),
      'tuesday': () => this.getNextWeekday(2),
      'wednesday': () => this.getNextWeekday(3),
      'thursday': () => this.getNextWeekday(4),
      'friday': () => this.getNextWeekday(5),
      'saturday': () => this.getNextWeekday(6),
      'sunday': () => this.getNextWeekday(0),
    };

    // Extract priority with more keywords
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (lowerInput.includes('urgent') || lowerInput.includes('important') || 
        lowerInput.includes('asap') || lowerInput.includes('critical') ||
        lowerInput.includes('high priority')) {
      priority = 'high';
    } else if (lowerInput.includes('low priority') || lowerInput.includes('when possible') ||
               lowerInput.includes('someday') || lowerInput.includes('maybe')) {
      priority = 'low';
    }

    // Enhanced category detection
    let categoryId = 'work';
    const categoryKeywords = {
      'personal': ['personal', 'home', 'family', 'self', 'life'],
      'health': ['health', 'exercise', 'doctor', 'gym', 'workout', 'medical', 'fitness'],
      'learning': ['learn', 'study', 'course', 'read', 'research', 'education', 'training'],
      'social': ['meeting', 'call', 'social', 'friend', 'party', 'event', 'dinner'],
      'work': ['work', 'project', 'office', 'business', 'client', 'deadline', 'report']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        categoryId = category;
        break;
      }
    }

    // Extract duration with more patterns
    const durationPatterns = [
      /(\d+)\s*(hour|hr)s?/,
      /(\d+)\s*(minute|min)s?/,
      /(\d+)h/,
      /(\d+)m/
    ];

    let estimatedDuration = 30;
    for (const pattern of durationPatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2] || match[0].slice(-1);
        estimatedDuration = (unit.includes('h') || unit.includes('hour')) ? value * 60 : value;
        break;
      }
    }

    // Extract date
    let dueDate: Date | undefined;
    for (const [pattern, dateFunc] of Object.entries(timePatterns)) {
      if (lowerInput.includes(pattern)) {
        dueDate = dateFunc();
        break;
      }
    }

    // Clean title
    let cleanTitle = input
      .replace(/\b(tomorrow|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
      .replace(/\b(urgent|important|asap|critical|low priority|high priority|when possible)\b/gi, '')
      .replace(/\b\d+\s*(hour|hr|minute|min)s?\b/gi, '')
      .replace(/\b\d+[hm]\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      title: cleanTitle,
      priority,
      estimatedDuration,
      dueDate
    };
  }

  private getNextWeekday(targetDay: number): Date {
    const date = new Date();
    const currentDay = date.getDay();
    const daysUntilTarget = (targetDay + 7 - currentDay) % 7;
    date.setDate(date.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    return date;
  }

  private buildPrompt(completedTasks: Task[], currentDay: string, userGoals?: string[]): string {
    const recentTasks = completedTasks
      .slice(-15)
      .map(task => `${task.title} (${task.category.name}, ${task.priority} priority)`)
      .join(', ');

    const categoryFrequency = this.analyzeCategoryFrequency(completedTasks);
    const timeOfDay = new Date().getHours();
    const timeContext = timeOfDay < 12 ? 'morning' : timeOfDay < 17 ? 'afternoon' : 'evening';

    return `
Based on the following user data, suggest 4-5 highly relevant and actionable tasks for ${currentDay} ${timeContext}:

Recent completed tasks (last 15): ${recentTasks || 'None yet'}
Most active categories: ${categoryFrequency}
User goals: ${userGoals?.join(', ') || 'General productivity and well-being'}
Current time context: ${timeContext}

Guidelines for suggestions:
1. Build on recent activity patterns and momentum
2. Consider the day of week and time of day
3. Mix different priorities and categories
4. Include both productive work and personal well-being tasks
5. Suggest realistic time estimates
6. Provide clear, actionable reasoning

Return a JSON array with this exact structure:
[
  {
    "title": "Specific, actionable task title",
    "description": "Clear description of what needs to be done",
    "category": "work|personal|health|learning|social",
    "priority": "low|medium|high",
    "estimatedDuration": 30,
    "reasoning": "Specific reason why this task is suggested based on user patterns"
  }
]
    `;
  }

  private analyzeCategoryFrequency(tasks: Task[]): string {
    const frequency: Record<string, number> = {};
    tasks.forEach(task => {
      frequency[task.category.name] = (frequency[task.category.name] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => `${category} (${count})`)
      .join(', ');
  }

  private getSmartMockSuggestions(completedTasks: Task[], currentDay: string): AITaskSuggestion[] {
    const dayOfWeek = new Date().getDay();
    const hour = new Date().getHours();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isMorning = hour < 12;
    const isEvening = hour >= 17;

    // Analyze user patterns
    const recentCategories = completedTasks.slice(-10).map(t => t.category.id);
    const mostUsedCategory = this.getMostFrequent(recentCategories) || 'work';
    const avgDuration = completedTasks.length > 0 
      ? Math.round(completedTasks.reduce((sum, t) => sum + (t.estimatedDuration || 30), 0) / completedTasks.length)
      : 30;

    let suggestions: AITaskSuggestion[] = [];

    if (isWeekend) {
      suggestions = [
        {
          title: "Plan upcoming week priorities",
          description: "Review calendar and set 3 main goals for next week",
          category: "personal",
          priority: "medium",
          estimatedDuration: 20,
          reasoning: "Weekend planning helps start the week with clarity and purpose"
        },
        {
          title: "Organize digital workspace",
          description: "Clean up desktop, organize files, and clear downloads folder",
          category: "personal",
          priority: "low",
          estimatedDuration: 30,
          reasoning: "Weekend is perfect for maintenance tasks that improve productivity"
        },
        {
          title: "Learn something new",
          description: "Spend time on a skill or hobby you've been wanting to develop",
          category: "learning",
          priority: "medium",
          estimatedDuration: 60,
          reasoning: "Weekends provide uninterrupted time for personal growth"
        }
      ];
    } else if (isMorning) {
      suggestions = [
        {
          title: "Review today's priorities",
          description: "Check calendar and identify top 3 must-do items",
          category: mostUsedCategory,
          priority: "high",
          estimatedDuration: 10,
          reasoning: "Morning planning sets a productive tone for the day"
        },
        {
          title: "Tackle most important task",
          description: "Work on your highest priority project while energy is peak",
          category: mostUsedCategory,
          priority: "high",
          estimatedDuration: avgDuration,
          reasoning: "Morning hours are ideal for focused, important work"
        }
      ];
    } else if (isEvening) {
      suggestions = [
        {
          title: "Reflect on today's accomplishments",
          description: "Write down 3 things you accomplished and 1 thing to improve",
          category: "personal",
          priority: "low",
          estimatedDuration: 15,
          reasoning: "Evening reflection builds self-awareness and continuous improvement"
        },
        {
          title: "Prepare for tomorrow",
          description: "Set out clothes, prepare materials, and review tomorrow's schedule",
          category: "personal",
          priority: "medium",
          estimatedDuration: 20,
          reasoning: "Evening preparation reduces morning stress and decision fatigue"
        }
      ];
    } else {
      // Afternoon suggestions
      suggestions = [
        {
          title: "Take a focused break",
          description: "Step away from work for 10 minutes - walk, stretch, or meditate",
          category: "health",
          priority: "medium",
          estimatedDuration: 15,
          reasoning: "Afternoon breaks restore focus and prevent burnout"
        },
        {
          title: "Follow up on pending items",
          description: "Check on emails, messages, or tasks waiting for responses",
          category: "work",
          priority: "medium",
          estimatedDuration: 25,
          reasoning: "Afternoon is good for administrative tasks and communication"
        }
      ];
    }

    // Add context-aware suggestions based on recent activity
    if (completedTasks.length > 0) {
      const lastTask = completedTasks[completedTasks.length - 1];
      if (lastTask.category.id === 'work') {
        suggestions.push({
          title: "Take a wellness break",
          description: "Do some light stretching or breathing exercises",
          category: "health",
          priority: "low",
          estimatedDuration: 10,
          reasoning: "Balance work activity with physical wellness"
        });
      }
    }

    return suggestions.slice(0, 4);
  }

  private getMostFrequent(arr: string[]): string | null {
    if (arr.length === 0) return null;
    const frequency: Record<string, number> = {};
    arr.forEach(item => frequency[item] = (frequency[item] || 0) + 1);
    return Object.entries(frequency).reduce((a, b) => frequency[a[0]] > frequency[b[0]] ? a : b)[0];
  }

  private getMockWeeklySummary(tasks: Task[], events: any[]): string {
    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);
    
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    
    const summaries = [
      `Great week! You completed ${completedTasks.length} tasks with a ${completionRate}% completion rate. Your focus on ${this.getMostFrequent(completedTasks.map(t => t.category.name)) || 'productivity'} is paying off.`,
      `This week you tackled ${completedTasks.length} tasks and attended ${events.length} events. Consider breaking down larger tasks to maintain momentum.`,
      `Solid progress with ${completedTasks.length} completed tasks. You have ${pendingTasks.length} items pending - try time-blocking to tackle them efficiently.`
    ];

    return summaries[Math.floor(Math.random() * summaries.length)];
  }
}

export const openaiService = new OpenAIService();