const Board = require("../models/Board");
const User = require("../models/User");
const mongoose = require("mongoose");

// Create Board
const createBoard = async (req, res) => {
  try {
    const { title, createdBy, members } = req.body;

    if (!title?.trim() || !createdBy) {
      return res.status(400).json({
        success: false,
        message: "Title and createdBy are required",
      });
    }

    if (!mongoose.isValidObjectId(createdBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid creator ID",
      });
    }

    const creator = await User.findById(createdBy);

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Creator user not found",
      });
    }

    const memberIds = [
      ...new Set([createdBy, ...(Array.isArray(members) ? members : [])]),
    ];

    for (const id of memberIds) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid member ID: ${id}`,
        });
      }
    }

    const existingMembers = await User.countDocuments({
      _id: { $in: memberIds },
    });

    if (existingMembers !== memberIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more member users do not exist",
      });
    }

    const board = await Board.create({
      title: title.trim(),
      createdBy,
      members: memberIds,
    });

    return res.status(201).json({
      success: true,
      message: "Board created successfully",
      board,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all boards
const getBoards = async (req, res) => {
  try {
    const boards = await Board.find()
      .populate("createdBy", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: boards.length,
      boards,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add member to board
const addMember = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { userId } = req.body;

    if (
      !mongoose.isValidObjectId(boardId) ||
      !mongoose.isValidObjectId(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid board ID and user ID are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const board = await Board.findByIdAndUpdate(
      boardId,
      { $addToSet: { members: userId } },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email")
      .populate("members", "name email");

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member added successfully",
      board,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createBoard,
  getBoards,
  addMember,
};