import { useState, useEffect } from "react";
import { TaskCategory } from "../types"; // <-- Correct type name

const API_URL = "http://localhost:5000/api/categories";

export function useCategoriesApi() {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then((data: TaskCategory[]) => setCategories(data))
      .catch(err => console.error("Failed to fetch categories", err))
      .finally(() => setLoading(false));
  }, []);

  async function saveCategory(category: TaskCategory) {
    const isUpdate = !!category.id;
    const method = isUpdate ? "PUT" : "POST";
    const url = isUpdate ? `${API_URL}/${category.id}` : API_URL;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });

    if (!res.ok) {
      throw new Error("Failed to save category");
    }

    const saved: TaskCategory = await res.json();
    setCategories(prev =>
      isUpdate ? prev.map(c => (c.id === saved.id ? saved : c)) : [...prev, saved]
    );
  }

  async function deleteCategory(id: string) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  return { categories, loading, saveCategory, deleteCategory };
}
