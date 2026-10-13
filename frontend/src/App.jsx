import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import {
  LayoutDashboard,
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarDays,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import "./App.css";

const API = "http://localhost:5000";
const socket = io(API, { autoConnect: false });

const COLUMNS = ["Todo", "In Progress", "Review", "Done"];

const EMPTY_TASK = {
  title: "",
  description: "",
  priority: "Medium",
  dueDate: "",
  status: "Todo",
};

export default function App() {
  const [boards, setBoards] = useState([]);
  const [boardId, setBoardId] = useState("");
  const [boardTitle, setBoardTitle] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(EMPTY_TASK);
  const [editingTask, setEditingTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("All");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");

  const loadBoards = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/boards`);
      const list = data.boards || [];
      setBoards(list);

      setBoardId((current) =>
        list.some((board) => board._id === current)
          ? current
          : list[0]?._id || ""
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Boards load nahi hue. Backend check karo."
      );
    }
  }, []);

  const loadTasks = useCallback(async (id) => {
    if (!id) {
      setTasks([]);
      return;
    }

    try {
      const { data } = await axios.get(
        `${API}/api/tasks/board/${id}`
      );
      setTasks(data.tasks || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Tasks load nahi hue. API route check karo."
      );
    }
  }, []);

  useEffect(() => {
    loadBoards();

    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [loadBoards]);

  useEffect(() => {
    if (!boardId) {
      setTasks([]);
      return;
    }

    socket.emit("joinBoard", boardId);

    const refresh = (data) => {
      if (data?.board && data.board !== boardId) return;
      if (data?.boardId && data.boardId !== boardId) return;
      loadTasks(boardId);
    };

    const events = [
      "taskCreated",
      "taskUpdated",
      "taskMoved",
      "taskDeleted",
    ];

    events.forEach((event) => socket.on(event, refresh));
    loadTasks(boardId);

    return () => {
      socket.emit("leaveBoard", boardId);
      events.forEach((event) => socket.off(event, refresh));
    };
  }, [boardId, loadTasks]);

  async function createBoard(event) {
    event.preventDefault();

    if (!boardTitle.trim() || !creatorId.trim()) {
      setMessage("Board title aur Creator User ID bharo.");
      return;
    }

    try {
      const { data } = await axios.post(`${API}/api/boards`, {
        title: boardTitle.trim(),
        createdBy: creatorId.trim(),
      });

      const board = data.board || data;
      setBoardTitle("");
      setMessage("Board created successfully!");

      await loadBoards();

      if (board._id) setBoardId(board._id);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Board create nahi hua."
      );
    }
  }

  function openCreateTask(status = "Todo") {
    if (!boardId) {
      setMessage("Pehle board create ya select karo.");
      return;
    }

    setEditingTask(null);
    setForm({ ...EMPTY_TASK, status });
    setModalOpen(true);
  }

  function openEditTask(task) {
    setEditingTask(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "Medium",
      dueDate: task.dueDate
        ? String(task.dueDate).slice(0, 10)
        : "",
      status: task.status || "Todo",
    });
    setModalOpen(true);
  }

  async function saveTask(event) {
    event.preventDefault();
    if (!form.title.trim() || !boardId) return;

    setLoading(true);

    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
    };

    try {
      if (editingTask) {
        await axios.patch(
          `${API}/api/tasks/${editingTask._id}`,
          payload
        );
        setMessage("Task updated successfully!");
      } else {
        await axios.post(`${API}/api/tasks`, {
          ...payload,
          board: boardId,
          position: tasks.length,
        });
        setMessage("Task created successfully!");
      }

      setModalOpen(false);
      setEditingTask(null);
      await loadTasks(boardId);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Task save nahi hua. Backend route check karo."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete this task?")) return;

    try {
      await axios.delete(`${API}/api/tasks/${id}`);
      await loadTasks(boardId);
      setMessage("Task deleted successfully!");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Task delete nahi hua."
      );
    }
  }

  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const previousTasks = tasks.map((task) => ({ ...task }));

    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;

    const sourceTasks = tasks
      .filter((task) => task.status === sourceStatus)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const destinationTasks =
      sourceStatus === destinationStatus
        ? sourceTasks
        : tasks
            .filter((task) => task.status === destinationStatus)
            .sort((a, b) => (a.position || 0) - (b.position || 0));

    const [movingTask] = sourceTasks.splice(source.index, 1);

    if (!movingTask) return;

    if (sourceStatus === destinationStatus) {
      sourceTasks.splice(destination.index, 0, movingTask);
    } else {
      destinationTasks.splice(destination.index, 0, movingTask);
    }

    const updatedTasks = tasks.filter(
      (task) =>
        task.status !== sourceStatus &&
        task.status !== destinationStatus
    );

    sourceTasks.forEach((task, index) => {
      updatedTasks.push({
        ...task,
        status: sourceStatus,
        position: index,
      });
    });

    destinationTasks.forEach((task, index) => {
      updatedTasks.push({
        ...task,
        status: destinationStatus,
        position: index,
      });
    });

    setTasks(updatedTasks);

    try {
      await axios.patch(
        `${API}/api/tasks/${draggableId}/move`,
        {
          status: destinationStatus,
          position: destination.index,
        }
      );

      await loadTasks(boardId);
      setMessage("Task moved successfully!");
    } catch (error) {
      setTasks(previousTasks);
      setMessage(
        error.response?.data?.message ||
          "Move save nahi hua. Backend move route check karo."
      );
    }
  }

  const visibleTasks = tasks.filter((task) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      `${task.title || ""} ${task.description || ""}`
        .toLowerCase()
        .includes(query);

    const matchesPriority =
      priority === "All" ||
      (task.priority || "Medium").toLowerCase() ===
        priority.toLowerCase();

    return matchesSearch && matchesPriority;
  });

  const selectedBoard = boards.find(
    (board) => board._id === boardId
  );

  return (
    <main className="app">
      <header className="navbar">
        <div className="navbar-brand">
          <div className="brand-icon">
            <LayoutDashboard size={23} />
          </div>
          <div>
            <h2>TaskFlow</h2>
            <span>Team Workspace</span>
          </div>
        </div>

        <div className="navbar-actions">
          <span className="connection-status">
            {connected ? <Wifi size={15} /> : <WifiOff size={15} />}
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </header>

      {message && (
        <div className="message" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage("")} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="board-header">
        <div>
          <p className="breadcrumb">Workspace / Projects</p>
          <h1>{selectedBoard?.title || "My Kanban Board"}</h1>
          <p>Organize tasks and track your team's progress.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => openCreateTask()}
          disabled={!boardId}
        >
          <Plus size={18} /> Add Task
        </button>
      </section>

      <section className="setup-panel">
        <form className="inline-form" onSubmit={createBoard}>
          <input
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            placeholder="New board title"
            aria-label="New board title"
          />
          <input
            value={creatorId}
            onChange={(e) => setCreatorId(e.target.value)}
            placeholder="Creator User ID"
            aria-label="Creator User ID"
          />
          <button type="submit">Create Board</button>
        </form>

        <div className="board-toolbar">
          <select
            value={boardId}
            onChange={(e) => setBoardId(e.target.value)}
            aria-label="Select board"
          >
            <option value="">Select board</option>
            {boards.map((board) => (
              <option key={board._id} value={board._id}>
                {board.title}
              </option>
            ))}
          </select>

          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
            />
          </div>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            aria-label="Filter priority"
          >
            <option value="All">All priorities</option>
            <option value="High">High priority</option>
            <option value="Medium">Medium priority</option>
            <option value="Low">Low priority</option>
          </select>
        </div>
      </section>

      <DragDropContext onDragEnd={handleDragEnd}>
        <section className="board">
          {COLUMNS.map((status) => {
            const columnTasks = visibleTasks
              .filter((task) => task.status === status)
              .sort(
                (a, b) => (a.position || 0) - (b.position || 0)
              );

            return (
              <section className="column" key={status}>
                <div className="column-heading">
                  <h2>{status}</h2>
                  <span>{columnTasks.length}</span>
                  <button
                    className="small-icon-button"
                    onClick={() => openCreateTask(status)}
                    aria-label={`Add task to ${status}`}
                  >
                    <Plus size={17} />
                  </button>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`task-list ${
                        snapshot.isDraggingOver ? "drag-over" : ""
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={String(task._id)}
                          index={index}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <article
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={`task-card ${
                                dragSnapshot.isDragging
                                  ? "is-dragging"
                                  : ""
                              }`}
                            >
                              <div className="task-card-top">
                                <span
                                  className={`priority ${
                                    (
                                      task.priority || "Medium"
                                    ).toLowerCase()
                                  }`}
                                >
                                  {task.priority || "Medium"}
                                </span>

                                <div className="task-card-actions">
                                  <button
                                    className="small-icon-button"
                                    onClick={() => openEditTask(task)}
                                    aria-label="Edit task"
                                  >
                                    <Pencil size={15} />
                                  </button>

                                  <button
                                    className="small-icon-button delete-icon"
                                    onClick={() => deleteTask(task._id)}
                                    aria-label="Delete task"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>

                              <h3>{task.title}</h3>

                              {task.description && (
                                <p>{task.description}</p>
                              )}

                              <div className="task-card-footer">
                                <span>
                                  <CalendarDays size={14} />
                                  {task.dueDate
                                    ? new Date(
                                        task.dueDate
                                      ).toLocaleDateString()
                                    : "No due date"}
                                </span>
                              </div>
                            </article>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}

                      {columnTasks.length === 0 && (
                        <div className="empty-column">
                          <p>No tasks yet</p>
                          <span>Drag a task here or click +.</span>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </section>
            );
          })}
        </section>
      </DragDropContext>

      {modalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={() => setModalOpen(false)}
        >
          <section
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="task-modal-title">
                  {editingTask ? "Edit Task" : "Create Task"}
                </h2>
                <p>Enter the details for your task.</p>
              </div>

              <button
                className="small-icon-button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form className="task-form" onSubmit={saveTask}>
              <label>
                Task title *
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="e.g. Build login page"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the task..."
                />
              </label>

              <div className="modal-form-row">
                <label>
                  Priority
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    {COLUMNS.map((column) => (
                      <option key={column}>{column}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Due date
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </label>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit" disabled={loading}>
                  {loading
                    ? "Saving..."
                    : editingTask
                      ? "Save Changes"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}