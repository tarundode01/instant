
import { LayoutDashboard, Bell, Search, CircleUserRound } from "lucide-react";

export default function Navbar() {
  return (
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
        <button className="icon-button" aria-label="Search">
          <Search size={20} />
        </button>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <div className="profile-avatar">
          <CircleUserRound size={25} />
        </div>
      </div>
    </header>
  );
}