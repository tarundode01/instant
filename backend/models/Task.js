
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Review", "Done"],
      default: "Todo",
    },
    position: {
      type: Number,
      default: 0,
      min: 0,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

taskSchema.index({ board: 1, status: 1, position: 1 });

module.exports = mongoose.model("Task", taskSchema);