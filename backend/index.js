const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

// Database connection
const connectDB = require("./config/db");

// Import routes
const userRoutes = require("./routes/user.routes");
const boardRoutes = require("./routes/board.routes");
const taskRoutes = require("./routes/task.routes");

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

// Make Socket.io available in controllers
app.set("io", io);

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// API routes
app.use("/api/users", userRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);

// Home route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Kanban Board API is running!",
  });
});

// Socket.io connections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a board room
  socket.on("joinBoard", (boardId) => {
    if (typeof boardId !== "string" || !boardId.trim()) {
      return;
    }

    socket.join(boardId);
    console.log(`Socket ${socket.id} joined board ${boardId}`);
  });

  // Leave a board room
  socket.on("leaveBoard", (boardId) => {
    if (typeof boardId !== "string" || !boardId.trim()) {
      return;
    }

    socket.leave(boardId);
    console.log(`Socket ${socket.id} left board ${boardId}`);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Server port
const PORT = process.env.PORT || 5000;

// Start server after connecting to MongoDB
async function startServer() {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log("Socket.io is ready!");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();