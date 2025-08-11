import { Router } from "express";
import CalendarEvent from "../models/CalendarEvent.js"; // now .js instead of .ts

const router = Router();

// GET all events
router.get("/", async (_req, res) => {
  try {
    const events = await CalendarEvent.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST create new event
router.post("/", async (req, res) => {
  try {
    const event = new CalendarEvent(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: "Failed to create event" });
  }
});

// PUT update event by id
router.put("/:id", async (req, res) => {
  try {
    const updated = await CalendarEvent.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update event" });
  }
});

// DELETE event
router.delete("/:id", async (req, res) => {
  try {
    await CalendarEvent.deleteOne({ id: req.params.id });
    res.sendStatus(204);
  } catch (err) {
    res.status(400).json({ error: "Failed to delete event" });
  }
});

export default router;
