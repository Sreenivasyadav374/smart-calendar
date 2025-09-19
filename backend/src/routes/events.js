import { Router } from "express";
import CalendarEvent from "../models/CalendarEvent.js"; // now .js instead of .ts

const router = Router();

// GET all events
router.get("/", async (_req, res) => {
  try {
    const events = await CalendarEvent.find();
    
    // Ensure all events have proper ID mapping
    const eventsWithId = events.map(event => {
      const eventObject = event.toObject();
      return {
        ...eventObject,
        id: eventObject.id || eventObject._id.toString(),
      };
    });
    
    res.json(eventsWithId);
  } catch (err) {
    console.error("Fetch events failed:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST create new event
router.post("/", async (req, res) => {
  try {
    const event = new CalendarEvent(req.body);
    const saved = await event.save();

    // Convert MongoDB document to plain object and ensure proper ID mapping
    const savedObject = saved.toObject();
    res.status(201).json({
      ...savedObject,
      id: savedObject.id || savedObject._id.toString(), // Ensure id field exists
    });
  } catch (err) {
    console.error("Create event failed:", err);
    res.status(400).json({ error: err.message });
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
    
    if (!updated) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Convert to plain object and ensure proper ID mapping
    const updatedObject = updated.toObject();
    res.json({
      ...updatedObject,
      id: updatedObject.id || updatedObject._id.toString(),
    });
  } catch (err) {
    console.error("Update event failed:", err);
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
