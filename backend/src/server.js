import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Import your routers (assumes you have these files as .js)
import tasksRouter from "./routes/tasks.js";
import eventsRouter from "./routes/events.js";
import categoriesRouter from "./routes/categories.js";

// Load environment variables from .env
dotenv.config();

// Create express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/tasks", tasksRouter);
app.use("/api/events", eventsRouter);
app.use("/api/categories", categoriesRouter);

// Simple "live" route
app.get("/", (req, res) => {
  res.send("Smart Calendar backend is running.");
});

// Error handling middleware (optional, improves DX)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// Get port and MongoDB URI from environment or defaults
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-calendar";

// backend/src/server.js

// ... (all imports, middleware, and route definitions remain the same) ...

// **CRITICAL CHANGE FOR VERCEL DEPLOYMENT:**
// Remove the app.listen() call.
// Vercel handles the listener. You just need to export the app.

// For Vercel to work, you may need to ensure the MongoDB connection 
// happens synchronously or is handled by a separate file/logic, 
// or you use a pattern that connects on first run. 
// For now, let's keep it simple by making the app exportable:

// Simple export for Vercel
export default app;
