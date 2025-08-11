import { Schema, model } from "mongoose";

const taskCategorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true, trim: true, minlength: 1 },
  },
  { timestamps: true }
);

export default model("TaskCategory", taskCategorySchema);
