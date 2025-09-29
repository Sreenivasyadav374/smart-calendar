// backend/src/server.js

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Import your routers
import tasksRouter from "./routes/tasks.js";
import eventsRouter from "./routes/events.js";
import categoriesRouter from "./routes/categories.js";

// Load environment variables (Vercel uses environment variables directly, 
// but dotenv.config() is harmless for local testing)
dotenv.config();

// =========================================================
// 🔄 SERVERLESS MONGOOSE CONNECTION CACHING 🔄
// =========================================================
// Define a variable to hold the cached connection
let cachedDb = null; 

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-calendar";

// Function to establish and cache the connection
async function connectToDatabase() {
    // 1. If we have a cached connection, reuse it immediately
    if (cachedDb) {
        console.log('⚡️ Using existing database connection.');
        return;
    }

    try {
        // 2. Otherwise, establish a new connection
        console.log('⏳ Connecting to a new database instance...');
        const db = await mongoose.connect(MONGODB_URI, {
            // Options to prevent buffering issues
            bufferCommands: false, 
        });
        
        // 3. Cache the connection for future warm invocations
        cachedDb = db.connections[0].readyState; 
        console.log('✅ Database connection successful.');

    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        // Do NOT process.exit(1); in a Vercel function, just let it throw
        throw error;
    }
}
// =========================================================

// Create express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ⚠️ IMPORTANT: Vercel middleware to connect to DB before EVERY route handler
app.use(async (req, res, next) => {
    // Ensure the database is connected before processing the request
    await connectToDatabase(); 
    next();
});


// API routes
app.use("/api/tasks", tasksRouter);
app.use("/api/events", eventsRouter);
app.use("/api/categories", categoriesRouter);

// Simple "live" route
app.get("/", (req, res) => {
  res.send("Smart Calendar backend is running.");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// The final, correct Vercel export
export default app;