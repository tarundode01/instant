
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

export default function KanbanColumn({
  title,
  tasks = [],
  onAddTask,
  onEditTask,
  onDeleteTask,
}) {
  return (
    <section className="kanban-column">
      <div className="kanban-column-header">
        <div>
          <h2>{title}</h2>
          <span className="task-count">{tasks.length}</span>
        </div>

        <button
          className="small-icon-button"
          onClick={() => onAddTask(title)}
          aria-label={`Add task to ${title}`}
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="kanban-task-list">
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}

        {tasks.length === 0 && (
          <div className="empty-column">
            <p>No tasks yet</p>
            <span>Add a task to get started.</span>
          </div>
        )}
      </div>
    </section>
  );
}