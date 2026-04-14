import { NavLink } from "react-router-dom";
import { ARCHITECTURE_LABEL } from "../config";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `sidebar-link${isActive ? " sidebar-link-active" : ""}`;

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo-mark" aria-hidden>
          S
        </span>
        <span>SmartStudy</span>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">AJ</div>
        <div>
          <div className="sidebar-name">Alex Johnson</div>
          <div className="sidebar-meta">Computer Science · Y3</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/study-plan" className={linkClass}>
          Study Plan
        </NavLink>
        <NavLink to="/progress" className={linkClass}>
          Progress
        </NavLink>
        <NavLink to="/groups" className={linkClass}>
          Study Groups
        </NavLink>
        <NavLink to="/ai" className={linkClass}>
          AI Recommendations
        </NavLink>
        <NavLink to="/onboarding" className={linkClass}>
          Course Setup
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-foot-link">
          Notifications <span className="badge">3</span>
        </button>
        <NavLink to="/" className="sidebar-foot-link">
          Log Out
        </NavLink>
        <p className="sidebar-arch">{ARCHITECTURE_LABEL}</p>
      </div>
    </aside>
  );
}
