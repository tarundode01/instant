
const Task = require("../models/Task");
const mongoose = require("mongoose");

const validStatuses = ["Todo", "In Progress", "Review", "Done"];

function emitTaskEvent(req, event, boardId, data) {
  const io = req.app.get("io");

  if (io && boardId) {
    io.to(String(boardId)).emit(event, {
      ...data,
      boardId: String(boardId),
    });
  }
}

// CREATE TASK
const createTask = async (req, res) => {
  try {
    const {
      title,
      description = "",
      priority = "Medium",
      dueDate = null,
      assignedTo = null,
      status = "Todo",
      position,
      board,
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim() || !board) {
      return res.status(400).json({
        success: false,
        message: "Title and board ID are required.",
      });
    }

    if (!mongoose.isValidObjectId(board)) {
      return res.status(400).json({
        success: false,
        message: "Invalid board ID.",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status.",
      });
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority.",
      });
    }

    const count = await Task.countDocuments({ board, status });
    const safePosition =
      Number.isInteger(position) && position >= 0 ? position : count;

    const task = await Task.create({
      title: title.trim(),
      description,
      priority,
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      status,
      position: safePosition,
      board,
    });

    emitTaskEvent(req, "taskCreated", board, { task });

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL TASKS FOR A BOARD
const getTasks = async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!mongoose.isValidObjectId(boardId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid board ID.",
      });
    }

    const tasks = await Task.find({ board: boardId })
      .sort({ status: 1, position: 1, createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE TASK
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "priority",
      "dueDate",
      "assignedTo",
      "status",
      "position",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided.",
      });
    }

    if (
      updates.title !== undefined &&
      (typeof updates.title !== "string" || !updates.title.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Task title cannot be empty.",
      });
    }

    if (
      updates.status !== undefined &&
      !validStatuses.includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status.",
      });
    }

    if (
      updates.priority !== undefined &&
      !["Low", "Medium", "High"].includes(updates.priority)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority.",
      });
    }

    if (
      updates.position !== undefined &&
      (!Number.isInteger(updates.position) || updates.position < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Position must be a non-negative integer.",
      });
    }

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    const task = await Task.findByIdAndUpdate(taskId, updates, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    emitTaskEvent(req, "taskUpdated", task.board, { task });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// MOVE TASK
const moveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, position } = req.body;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status.",
      });
    }

    if (
      position !== undefined &&
      (!Number.isInteger(position) || position < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Position must be a non-negative integer.",
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const oldStatus = task.status;
    const oldPosition = task.position;
    const newPosition =
      position === undefined
        ? await Task.countDocuments({
            board: task.board,
            status,
            _id: { $ne: task._id },
          })
        : position;

    // Update the moved task.
    task.status = status;
    task.position = newPosition;
    await task.save();

    // Close the gap in the old column.
    if (oldStatus !== status) {
      await Task.updateMany(
        {
          board: task.board,
          status: oldStatus,
          position: { $gt: oldPosition },
          _id: { $ne: task._id },
        },
        { $inc: { position: -1 } }
      );

      // Make space in the new column.
      await Task.updateMany(
        {
          board: task.board,
          status,
          position: { $gte: newPosition },
          _id: { $ne: task._id },
        },
        { $inc: { position: 1 } }
      );
    }

    const boardId = String(task.board);

    emitTaskEvent(req, "taskMoved", boardId, { task });

    return res.status(200).json({
      success: true,
      message: "Task moved successfully.",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE TASK
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    emitTaskEvent(req, "taskDeleted", task.board, {
      taskId: String(task._id),
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  moveTask,
  deleteTask,
};