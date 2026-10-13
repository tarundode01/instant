
import { Plus, Users, ChevronDown } from "lucide-react";

export default function BoardHeader({ title, onAddTask, onInvite }) {
  return (
    <section className="board-header">
      <div>
        <div className="breadcrumb">Workspace / Projects</div>
        <h1>{title || "My Kanban Board"}</h1>
        <p>Organize your work and collaborate with your team.</p>
      </div>

      <div className="board-header-actions">
        <button className="secondary-button" onClick={onInvite}>
          <Users size={17} /> Invite Members
        </button>

        <button className="primary-button" onClick={onAddTask}>
          <Plus size={18} /> Add Task
        </button>
      </div>
    </section>
  );
}