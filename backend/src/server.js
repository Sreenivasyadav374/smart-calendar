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

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🗄️  Connected to MongoDB at ${MONGODB_URI}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB", err);
    process.exit(1);
  });
