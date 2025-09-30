// useTasksApi.ts (Modified)

import { useState, useEffect } from "react";
import { Task, User } from "../types"; // Assuming User type is imported

const API_URL = process.env.NODE_ENV === 'production' 
  ? "/api/tasks" 
  : "http://localhost:5000/api/tasks";

// 1. Updated hook to accept user object
export function useTasksApi(user: User | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all tasks from backend
  useEffect(() => {
    // 2. CRITICAL: Only fetch if the user is logged in
    if (!user) {
      setLoading(false);
      setTasks([]); // Clear existing tasks on logout
      return;
    }

    setLoading(true); // Set loading true before starting fetch
    fetch(API_URL)
      .then(res => res.json())
      .then((data: Task[]) => setTasks(data))
      .catch(err => console.error("Failed to fetch tasks", err))
      .finally(() => setLoading(false));
  }, [user]); // 3. Added user to dependency array to re-run on login/logout

  // Save (create or update) task
  async function saveTask(task: Task, isNew: boolean) {
    if (!user) return; // 4. Block operation if logged out

    const method = isNew ? "POST" : "PUT";
    const url = isNew ? API_URL : `${API_URL}/${task.id}`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to save task: ${errorText}`);
    }

    const saved: Task = await res.json();
    setTasks(prev =>
      isNew ? [...prev, saved] : prev.map(t => (t.id === saved.id ? saved : t))
    );
  }


  // Delete task
  async function deleteTask(id: string) {
    if (!user) return; // 5. Block operation if logged out
    
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  return { tasks, loading, saveTask, deleteTask };
}