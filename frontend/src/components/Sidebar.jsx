
import {
  Link2,
  LayoutDashboard,
  LogOut,
  ExternalLink
} from "lucide-react";

function Sidebar({ user, onLogout, loading }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link2 size={30} />
        <span>LinkSlice</span>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-label">WORKSPACE</p>

        <div className="sidebar-item active">
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </div>

        <a
          href="#url-history"
          className="sidebar-item"
        >
          <ExternalLink size={19} />
          <span>My Links</span>
        </a>
      </div>

      <div className="sidebar-bottom">
        <div className="user-profile">
          <div className="avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>

          <div className="user-details">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.email || ""}</span>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={onLogout}
          disabled={loading}
        >
          <LogOut size={18} />
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
