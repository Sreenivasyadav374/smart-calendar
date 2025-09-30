import { useState, useEffect } from "react";
// Import the User type from your types file for null check
import { TaskCategory, User } from "../types"; 

const API_URL = process.env.NODE_ENV === 'production' 
  ? "/api/categories" 
  : "http://localhost:5000/api/categories";

// 1. Accept the user object
export function useCategoriesApi(user: User | null) {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. CRITICAL: Only run fetch logic if user is logged in
    if (!user) {
      setLoading(false);
      setCategories([]); // Clear local state on logout
      return;
    }
    
    fetch(API_URL)
      .then(res => res.json())
      .then((data: TaskCategory[]) => setCategories(data))
      .catch(err => console.error("Failed to fetch categories", err))
      .finally(() => setLoading(false));
  }, [user]); // 3. Rerun effect when user state changes

  async function saveCategory(category: TaskCategory) {
    if (!user) return; // 4. Block mutation if logged out
    // ... rest of saveCategory logic ...
  }

  async function deleteCategory(id: string) {
    if (!user) return; // 5. Block mutation if logged out
    
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  return { categories, loading, saveCategory, deleteCategory };
}