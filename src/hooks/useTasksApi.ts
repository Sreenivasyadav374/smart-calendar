import { useState, useEffect } from "react";
import { Task } from "../types"; // adjust to your actual types location

const API_URL = process.env.NODE_ENV === 'production' 
  ? "/api/tasks" 
  : "http://localhost:5000/api/tasks";

export function useTasksApi() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all tasks from backend
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then((data: Task[]) => setTasks(data))
      .catch(err => console.error("Failed to fetch tasks", err))
      .finally(() => setLoading(false));
  }, []);

  // Save (create or update) task
  async function saveTask(task: Task, isNew: boolean) {
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
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  return { tasks, loading, saveTask, deleteTask };
}
