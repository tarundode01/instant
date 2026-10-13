const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  updateTask,
  moveTask,
  deleteTask,
} = require("../controllers/task.controller");

router.post("/", createTask);
router.get("/board/:boardId", getTasks);
router.patch("/:taskId", updateTask);
router.patch("/:taskId/move", moveTask);
router.delete("/:taskId", deleteTask);

module.exports = router;