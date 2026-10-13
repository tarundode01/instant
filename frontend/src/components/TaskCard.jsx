
import { CalendarDays, Pencil, Trash2, UserRound } from "lucide-react";

export default function TaskCard({ task, onEdit, onDelete }) {
  const priority = (task.priority || "Medium").toLowerCase();

  return (
    <article className="task-card">
      <div className="task-card-top">
        <span className={`priority ${priority}`}>
          {task.priority || "Medium"}
        </span>

        <div className="task-card-actions">
          <button
            className="small-icon-button"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
          >
            <Pencil size={15} />
          </button>

          <button
            className="small-icon-button delete-icon"
            onClick={() => onDelete(task._id)}
            aria-label="Delete task"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <h3>{task.title}</h3>

      {task.description && <p>{task.description}</p>}

      <div className="task-card-footer">
        <span>
          <CalendarDays size={14} />
          {task.dueDate
            ? new Date(task.dueDate).toLocaleDateString()
            : "No due date"}
        </span>

        <span title="Assigned member">
          <UserRound size={14} />
          {task.assignedTo?.name || "Unassigned"}
        </span>
      </div>
    </article>
  );
}