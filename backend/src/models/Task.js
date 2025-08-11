import { Schema, model } from "mongoose";

const taskSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true, minlength: 1 },
    description: { type: String, trim: true },
    category: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      required: true,
    },
    estimatedDuration: {
      type: Number,
      default: 30,
      min: [1, "estimatedDuration must be positive"],
      required: true,
    },
    dueDate: { type: Date },
    scheduledDate: { type: Date },
    completed: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

// Create index to speed up queries by category or priority if needed
taskSchema.index({ "category.id": 1 });
taskSchema.index({ priority: 1 });

export default model("Task", taskSchema);
