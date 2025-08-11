import { Router } from "express";
import TaskCategory from "../models/TaskCategory.js"; // use .js extension for ESM

const router = Router();

// GET all categories
router.get("/", async (_req, res) => {
  try {
    const categories = await TaskCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// POST new category
router.post("/", async (req, res) => {
  try {
    const category = new TaskCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: "Failed to create category" });
  }
});

// PUT update category by id
router.put("/:id", async (req, res) => {
  try {
    const updated = await TaskCategory.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update category" });
  }
});

// DELETE category by id
router.delete("/:id", async (req, res) => {
  try {
    await TaskCategory.deleteOne({ id: req.params.id });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: "Failed to delete category" });
  }
});

export default router;
