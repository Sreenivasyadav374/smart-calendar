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
      // Return mock suggestions if no API key
      return this.getMockSuggestions();
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
              content: 'You are a helpful productivity assistant that suggests relevant tasks based on user patterns and goals. Respond with valid JSON only.'
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
      console.warn('OpenAI API failed, using mock suggestions:', error);
      return this.getMockSuggestions();
    }
  }

  private buildPrompt(completedTasks: Task[], currentDay: string, userGoals?: string[]): string {
    const recentTasks = completedTasks
      .slice(-10)
      .map(task => `${task.title} (${task.category.name})`)
      .join(', ');

    return `
Based on the following information, suggest 3-5 relevant tasks for today (${currentDay}):

Recent completed tasks: ${recentTasks || 'None'}
User goals: ${userGoals?.join(', ') || 'General productivity'}

Please suggest tasks that:
1. Build on recent activity patterns
2. Are appropriate for ${currentDay}
3. Support the user's goals
4. Include a mix of priorities and categories

Return a JSON array with this structure:
[
  {
    "title": "Task title",
    "description": "Brief description",
    "category": "work|personal|health|learning|social",
    "priority": "low|medium|high",
    "estimatedDuration": 30,
    "reasoning": "Why this task is suggested"
  }
]
    `;
  }

  private getMockSuggestions(): AITaskSuggestion[] {
    const mockSuggestions = [
      {
        title: "Review weekly goals",
        description: "Take 15 minutes to review and adjust your weekly objectives",
        category: "personal",
        priority: "medium" as const,
        estimatedDuration: 15,
        reasoning: "Regular goal review helps maintain focus and productivity"
      },
      {
        title: "Update project documentation",
        description: "Document recent project progress and next steps",
        category: "work",
        priority: "high" as const,
        estimatedDuration: 45,
        reasoning: "Keeping documentation current improves team collaboration"
      },
      {
        title: "Quick workout session",
        description: "30-minute exercise or stretching session",
        category: "health",
        priority: "medium" as const,
        estimatedDuration: 30,
        reasoning: "Regular physical activity boosts energy and focus"
      },
      {
        title: "Learn something new",
        description: "Spend time on a skill you've been wanting to develop",
        category: "learning",
        priority: "low" as const,
        estimatedDuration: 60,
        reasoning: "Continuous learning keeps you sharp and motivated"
      }
    ];

    // Return 3-4 random suggestions
    return mockSuggestions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 3);
  }
}

export const openaiService = new OpenAIService();