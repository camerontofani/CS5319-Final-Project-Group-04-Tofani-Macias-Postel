import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

// dashboard layout: fixed sidebar + scrollable main (matches wireframe shell)
export function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Outlet />
      </div>
    </div>
  );
}
