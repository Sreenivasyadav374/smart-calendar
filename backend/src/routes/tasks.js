import { Router } from "express";
import Task from "../models/Task.js"; // use .js extension now

const router = Router();

// GET all tasks
router.get("/", async (_req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// POST create task
router.post("/", async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: "Failed to create task" });
  }
});

// PUT update task by id
router.put("/:id", async (req, res) => {
  try {
    const updated = await Task.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update task" });
  }
});

// DELETE task by id
router.delete("/:id", async (req, res) => {
  try {
    await Task.deleteOne({ id: req.params.id });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: "Failed to delete task" });
  }
});

export default router;
