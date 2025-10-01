import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { Task, AITaskSuggestion } from '../types'; // Adjust path if necessary

const apiKey = process.env.GOOGLE_API;

// Initialize the Gemini Model (Picks up GOOGLE_API_KEY from env)
const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  apiKey:apiKey
});

// --- 1. Define the Structured Output Schema using Zod ---
const suggestionSchema = z.object({
  title: z.string().describe("A concise title for the suggested task."),
  description: z.string().describe("A brief, actionable description of the task."),
  category: z.enum(["work", "personal", "health", "social", "learning"]).describe("The category ID that best fits the task."),
  priority: z.enum(["low", "medium", "high"]).describe("The suggested priority level."),
  estimatedDuration: z.number().int().describe("The estimated duration of the task in minutes (e.g., 30, 60, 120)."),
});

// The model will return an array of suggestions
const parser = StructuredOutputParser.fromZodSchema(
  z.array(suggestionSchema).describe("An array of 3 to 5 distinct task suggestions.")
);


// --- 2. Define the Prompt Template ---
const promptTemplate = `
You are an expert personal productivity assistant. Your goal is to suggest 3-5 distinct, actionable tasks for a user's to-do list based on their recent activity and current goals.

Use the provided JSON Schema to format your entire response.

Current Day: {currentDay}
User Goals: {userGoals}
Recent Tasks (for context): {recentTasks}

Based on this context, generate new, high-value task suggestions.

FORMAT INSTRUCTIONS:
{formatInstructions}
`;

const prompt = new PromptTemplate({
  template: promptTemplate,
  inputVariables: ["currentDay", "userGoals", "recentTasks"],
  partialVariables: { formatInstructions: parser.getFormatInstructions() },
});


// --- 3. Implement the Service Function ---
const generateTaskSuggestions = async (
  recentTasks: Task[],
  currentDay: string,
  userGoals: string[]
): Promise<AITaskSuggestion[]> => {
  
  // Format the recent tasks into a concise string for the prompt
  const recentTasksContext = recentTasks
    .map(t => `${t.title} (Cat: ${t.category.name}, Dur: ${t.estimatedDuration}m)`)
    .join(', ');

  const input = await prompt.format({
    currentDay,
    userGoals: userGoals.join(', '),
    recentTasks: recentTasksContext,
  });

  try {
    // Invoke the model with the prompt
    const response = await llm.invoke(input);

    // Parse the structured JSON output
    const suggestions = await parser.parse(response.content as string);
    
    // The model is set to return category IDs from the enum, 
    // so the structure should match AITaskSuggestion
    return suggestions as AITaskSuggestion[];
    
  } catch (error) {
    console.error("Gemini failed to generate structured suggestions:", error);
    // Return an empty array on failure
    return []; 
  }
};

// --- 4. Export the Service ---
export const aiService = { 
  generateTaskSuggestions,
};

// If you renamed the file to geminiService.ts, remember to change the App.tsx import.