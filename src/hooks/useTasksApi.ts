import { useState, useEffect } from "react";
import { Task } from "../types"; // adjust to your actual types location

const API_URL = "http://localhost:5000/api/tasks";

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
  async function saveTask(task: Task) {
    const isUpdate = !!task.id;
    const method = isUpdate ? "PUT" : "POST";
    const url = isUpdate ? `${API_URL}/${task.id}` : API_URL;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });

    if (!res.ok) {
      throw new Error("Failed to save task");
    }

    const saved: Task = await res.json();
    setTasks(prev =>
      isUpdate ? prev.map(t => (t.id === saved.id ? saved : t)) : [...prev, saved]
    );
  }

  // Delete task
  async function deleteTask(id: string) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  return { tasks, loading, saveTask, deleteTask };
}
