const express = require("express");
const router = express.Router();

const {
  createBoard,
  getBoards,
  addMember,
} = require("../controllers/board.controller");

router.post("/", createBoard);
router.get("/", getBoards);
router.post("/:boardId/members", addMember);

module.exports = router;