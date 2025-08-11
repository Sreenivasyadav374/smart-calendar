import { Schema, model } from "mongoose";

const calendarEventSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    start: { type: Date, required: true },
    end: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value >= this.start;
        },
        message: "End date must be equal to or after start date",
      },
    },
    category: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    allDay: { type: Boolean, default: false, required: true },
    isGoogleEvent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

calendarEventSchema.index({ start: 1, end: 1 });

export default model("CalendarEvent", calendarEventSchema);
