
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const emptyTask = {
  title: "",
  description: "",
  priority: "Medium",
  dueDate: "",
  status: "Todo",
};

export default function TaskModal({
  open,
  task,
  defaultStatus = "Todo",
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(emptyTask);

  useEffect(() => {
    if (!open) return;

    setForm(
      task
        ? {
            title: task.title || "",
            description: task.description || "",
            priority: task.priority || "Medium",
            dueDate: task.dueDate
              ? String(task.dueDate).slice(0, 10)
              : "",
            status: task.status || defaultStatus,
          }
        : { ...emptyTask, status: defaultStatus }
    );
  }, [open, task, defaultStatus]);

  if (!open) return null;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();

    if (!form.title.trim()) return;

    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
    });
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <section
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="task-modal-title">
              {task ? "Edit Task" : "Create Task"}
            </h2>
            <p>Enter the details for this task.</p>
          </div>

          <button
            type="button"
            className="small-icon-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form className="task-form" onSubmit={submit}>
          <label>
            Task title *
            <input
              name="title"
              value={form.title}
              onChange={updateField}
              placeholder="e.g. Build login page"
              required
              autoFocus
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Describe the task..."
              rows={4}
            />
          </label>

          <div className="modal-form-row">
            <label>
              Priority
              <select
                name="priority"
                value={form.priority}
                onChange={updateField}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>

            <label>
              Status
              <select
                name="status"
                value={form.status}
                onChange={updateField}
              >
                <option>Todo</option>
                <option>In Progress</option>
                <option>Review</option>
                <option>Done</option>
              </select>
            </label>
          </div>

          <label>
            Due date
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={updateField}
            />
          </label>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="primary-button">
              {task ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}