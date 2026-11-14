
// import { useEffect, useMemo, useState } from "react";
import { useEffect, useMemo, useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import Analytics from "./Analytics";
import SettingsPage from "./Settings";
import Pages from "./Pages";
import {
  LayoutDashboard,
  Link2,
  QrCode,
  PanelsTopLeft,
  ChartNoAxesCombined,
  Settings,
  Sun,
  Moon,
  Plus,
  Search,
  Copy,
  Trash2,
  ExternalLink,
  MousePointerClick,
  LogOut,
  Menu,
  X,
  RefreshCw
} from "lucide-react";

import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";

function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState(null);
  const [urls, setUrls] = useState([]);

  const [stats, setStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    createdToday: 0,
    topLink: null
  });

  const [redirectUrl, setRedirectUrl] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  // FETCH DASHBOARD DATA

  const fetchDashboard = async () => {
    try {
      setError("");

      const [userResponse, urlResponse, statsResponse] =
        await Promise.all([
          api.get("/api/auth/me"),
          api.get("/api/urls?page=1&limit=100"),
          api.get("/api/urls/dashboard/stats")
        ]);

      const currentUser =
        userResponse.data.user || userResponse.data.data;

      const urlData =
        urlResponse.data.data || urlResponse.data.urls || [];

      const dashboardStats =
        statsResponse.data.data?.stats ||
        statsResponse.data.stats;

      setUser(currentUser);
      setUrls(Array.isArray(urlData) ? urlData : []);

      if (dashboardStats) {
        setStats({
          totalLinks: Number(dashboardStats.totalLinks || 0),
          totalClicks: Number(dashboardStats.totalClicks || 0),
          createdToday: Number(dashboardStats.createdToday || 0),
          topLink: dashboardStats.topLink || null
        });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
        "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // NORMALIZE URL FIELDS

  const getId = (url) =>
    url._id || url.id;

  const getOriginal = (url) =>
    url.originalUrl || url.redirectUrl || "";

 const getShort = (url) =>
  url.shortUrl ||
  `${api.defaults.baseURL}/${url.shortId || url.shortCode || ""}`;

  const getShortId = (url) =>
    url.shortId || url.shortCode || "";

  const getClicks = (url) =>
    Number(url.clickCount ?? url.clicks ?? 0);

  const getCreated = (url) =>
    url.createdAt
      ? new Date(url.createdAt).toLocaleDateString()
      : "—";

  // CREATE SHORT URL

  const handleCreate = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setCreating(true);

      await api.post("/api/urls", {
        redirectUrl: redirectUrl.trim()
      });

      await fetchDashboard();

      setRedirectUrl("");
      setSuccess("Your short link has been created!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to create your short URL."
      );
    } finally {
      setCreating(false);
    }
  };

  // COPY URL

  const handleCopy = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);

      setCopiedId(id);

      setTimeout(() => setCopiedId(""), 1800);
    } catch {
      setError("Unable to copy the URL.");
    }
  };

  // DELETE URL

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this shortened URL?")) {
      return;
    }

    try {
      setError("");

      await api.delete(`/api/urls/${id}`);

      await fetchDashboard();

      setSuccess("Link deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete this URL."
      );
    }
  };

  // LOGOUT

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await api.post("/api/auth/logout");

      navigate("/login", { replace: true });
    } catch {
      setError("Unable to logout. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  // STATISTICS

  const totalLinks = stats.totalLinks;
  const totalClicks = stats.totalClicks;
  const createdToday = stats.createdToday;
  const topLink = stats.topLink;

  // SEARCH

  const filteredUrls = useMemo(() => {
    return urls.filter((url) => {
      const text = (
        getOriginal(url) + " " + getShortId(url)
      ).toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [urls, search]);

  const userName =
    user?.name || user?.fullname || "User";

  // SIDEBAR

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "links", label: "Links", icon: Link2 },
    { id: "qr", label: "QR Codes", icon: QrCode },
    { id: "pages", label: "Pages", icon: PanelsTopLeft },
    { id: "analytics", label: "Analytics", icon: ChartNoAxesCombined },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  if (loading) {
    return (
      <div className="ls-loading">
        <div className="ls-spinner" />
        <p>Loading LinkSlice...</p>
      </div>
    );
  }

  return (
    <div className="ls-app">

      {/* SIDEBAR */}

      <aside className={`ls-sidebar ${mobileMenu ? "ls-sidebar-open" : ""}`}>

        <div className="ls-brand">
          <div className="ls-brand-icon">
            <Link2 size={21} />
          </div>
          <span>LinkSlice</span>
        </div>

        <div className="ls-menu-label">WORKSPACE</div>

        <nav className="ls-navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`ls-nav-item ${
                  activePage === item.id ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenu(false);
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="ls-sidebar-bottom">

          <div className="ls-profile">
            <div className="ls-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="ls-profile-info">
              <strong>{userName}</strong>
              <span>{user?.email}</span>
            </div>
          </div>

          <button
            className="ls-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={17} />
            {loggingOut ? "Logging out..." : "Sign out"}
          </button>

        </div>
      </aside>

      {/* MAIN */}

      <main className="ls-main">

        <header className="ls-header">

          <div className="ls-heading">

            <button
              className="ls-mobile-menu"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label="Toggle menu"
            >
              {mobileMenu ? <X /> : <Menu />}
            </button>

            <div>
              <h1>
                {activePage === "dashboard"
                  ? `Good day, ${userName}`
                  : menuItems.find((item) => item.id === activePage)?.label}
              </h1>

              <p>
                {activePage === "dashboard"
                  ? "Here's what's happening with your links today."
                  : `Manage your ${activePage} in LinkSlice.`}
              </p>
            </div>

          </div>

          <div className="ls-header-actions">

            <button
              className="ls-theme-button"
              onClick={toggleTheme}
              title="Change appearance"
            >
              {theme === "light"
                ? <Moon size={17} />
                : <Sun size={17} />}

              <span>
                {theme === "light" ? "Night mode" : "Day mode"}
              </span>
            </button>

            <button
              className="ls-icon-button"
              onClick={fetchDashboard}
              title="Refresh"
            >
              <RefreshCw size={17} />
            </button>

            <button
              className="ls-create-button"
              onClick={() => {
                setActivePage("dashboard");

                document.getElementById("create-link")?.scrollIntoView({
                  behavior: "smooth"
                });
              }}
            >
              <Plus size={17} />
              Create new
            </button>

          </div>
        </header>

        {error && (
          <div className="ls-alert ls-error">{error}</div>
        )}

        {success && (
          <div className="ls-alert ls-success">{success}</div>
        )}

        {/* DASHBOARD */}

        {activePage === "dashboard" && (
          <>

            {/* STATISTICS */}

            <section className="ls-stats">

              <StatCard
                title="Total links"
                value={totalLinks.toLocaleString()}
                icon={<Link2 />}
                description="Links created by you"
              />

              <StatCard
                title="Total clicks"
                value={totalClicks.toLocaleString()}
                icon={<MousePointerClick />}
                description="Total recorded visits"
              />

              <StatCard
                title="Created today"
                value={createdToday.toLocaleString()}
                icon={<Plus />}
                description="New links today"
              />

              <StatCard
                title="Top performing link"
                value={topLink ? getClicks(topLink).toLocaleString() : "—"}
                icon={<ChartNoAxesCombined />}
                description={
                  topLink
                    ? `Clicks on ${getShortId(topLink)}`
                    : "No clicks recorded yet"
                }
              />

            </section>

            {/* CREATE LINK */}

            <section className="ls-card ls-create-section" id="create-link">

              <div>
                <h2>Create a new short link</h2>
                <p>Turn your long URL into a shareable short link.</p>
              </div>

              <form onSubmit={handleCreate} className="ls-create-form">

                <input
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://example.com/your-long-url"
                  required
                />

                <button
                  className="ls-create-button"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Shorten URL"}
                  <Link2 size={17} />
                </button>

              </form>

            </section>

            {/* RECENT LINKS */}

            <section className="ls-card ls-history">

              <div className="ls-card-heading">
                <div>
                  <h2>Recent links</h2>
                  <p>Your recently created shortened URLs.</p>
                </div>

                <button
                  className="ls-theme-button"
                  onClick={() => setActivePage("links")}
                >
                  View all links
                </button>
              </div>

              <UrlTable
                urls={urls.slice(0, 5)}
                getId={getId}
                getOriginal={getOriginal}
                getShort={getShort}
                getShortId={getShortId}
                getClicks={getClicks}
                getCreated={getCreated}
                handleCopy={handleCopy}
                handleDelete={handleDelete}
                copiedId={copiedId}
              />

            </section>

          </>
        )}

        {/* URL HISTORY */}

        {activePage === "links" && (
          <section className="ls-card ls-history">

            <div className="ls-card-heading">
              <div>
                <h2>Latest links</h2>
                <p>Search and manage your shortened URLs.</p>
              </div>
            </div>

            <div className="ls-search">
              <Search size={17} />

              <input
                placeholder="Search your links..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <UrlTable
              urls={filteredUrls}
              getId={getId}
              getOriginal={getOriginal}
              getShort={getShort}
              getShortId={getShortId}
              getClicks={getClicks}
              getCreated={getCreated}
              handleCopy={handleCopy}
              handleDelete={handleDelete}
              copiedId={copiedId}
            />

          </section>
        )}


        {/* ANALYTICS PAGE */}

{activePage === "analytics" && (
  <Analytics />
)}

        {/* QR CODE GENERATOR */}

{activePage === "qr" && (
  <section className="ls-card ls-history">

    <div className="ls-card-heading">
      <div>
        <h2>QR Code Studio</h2>
        <p>Generate and download QR codes for your shortened URLs.</p>
      </div>
    </div>

    {urls.length === 0 ? (
      <div className="ls-empty">
        <QrCode size={35} />
        <h3>No shortened URLs yet</h3>
        <p>Create a short URL first to generate its QR code.</p>
      </div>
    ) : (
      <div className="ls-qr-grid">
        {urls.map((url) => (
          <QRCodeCard
            key={getId(url)}
            url={url}
            shortUrl={getShort(url)}
            shortId={getShortId(url)}
            originalUrl={getOriginal(url)}
          />
        ))}
      </div>
    )}

  </section>
)}

        {/* PLACEHOLDER PAGES */}

        {/* LANDING PAGES */}

{activePage === "pages" && (
  <Pages />
)}

{/* SETTINGS - NEXT STEP */}


{/* SETTINGS PAGE */}

{activePage === "settings" && (
  <SettingsPage
    user={user}
    onProfileUpdated={(updatedUser) => {
      setUser((previous) => ({
        ...previous,
        ...updatedUser
      }));
    }}
    onLogout={handleLogout}
  />
)}

{/* LANDING PAGES */}

{activePage === "pages" && (
  <section className="ls-card ls-coming-soon">
    <PanelsTopLeft size={36} />
    <h2>Landing Pages</h2>
    <p>
      Manage your public landing pages.
    </p>
  </section>
)}

        

        <footer className="ls-footer">
          © {new Date().getFullYear()} LinkSlice. Made for smarter sharing.
        </footer>

      </main>
    </div>
  );
}

// QR CODE CARD COMPONENT

function QRCodeCard({ url, shortUrl, shortId, originalUrl }) {
  const canvasRef = useRef(null);

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");

    if (!canvas) {
      return;
    }

    const image = canvas.toDataURL("image/png");

    const link = document.createElement("a");

    link.href = image;
    link.download = `LinkSlice-QR-${shortId || "code"}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ls-card ls-qr-card">

      <div className="ls-qr-preview" ref={canvasRef}>
        <QRCodeCanvas
          value={shortUrl}
          size={180}
          level="H"
          includeMargin={true}
        />
      </div>

      <h3>{shortId || "Short link"}</h3>

      <a
        href={shortUrl}
        target="_blank"
        rel="noreferrer"
        className="ls-short-link"
      >
        {shortUrl}
        <ExternalLink size={13} />
      </a>

      <p className="ls-original">
        {originalUrl}
      </p>

      <button
        className="ls-create-button"
        onClick={handleDownload}
      >
        <DownloadIcon />
        Download PNG
      </button>

    </div>
  );
}

function DownloadIcon() {
  return <span>↓</span>;
}
// STATISTICS COMPONENT

function StatCard({ title, value, icon, description }) {
  return (
    <div className="ls-card ls-stat-card">

      <div className="ls-stat-heading">
        <span>{title}</span>
        <div className="ls-stat-icon">{icon}</div>
      </div>

      <strong>{value}</strong>

      <p>{description}</p>

    </div>
  );
}

// URL TABLE COMPONENT

function UrlTable({
  urls,
  getId,
  getOriginal,
  getShort,
  getShortId,
  getClicks,
  getCreated,
  handleCopy,
  handleDelete,
  copiedId
}) {
  if (!urls.length) {
    return (
      <div className="ls-empty">
        <Link2 size={35} />
        <h3>No links found</h3>
        <p>Create a short URL or change your search.</p>
      </div>
    );
  }

  return (
    <div className="ls-table-wrap">

      <table className="ls-table">

        <thead>
          <tr>
            <th>LINK</th>
            <th>SHORT URL</th>
            <th>CLICKS</th>
            <th>CREATED</th>
            <th>ACTIONS</th>
          </tr>
        </thead>

        <tbody>
          {urls.map((url) => {
            const id = getId(url);
            const short = getShort(url);

            return (
              <tr key={id}>

                <td>
                  <span className="ls-original">
                    {getOriginal(url)}
                  </span>
                </td>

                <td>
                  <a
                    className="ls-short-link"
                    href={short}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {getShortId(url)}
                    <ExternalLink size={12} />
                  </a>
                </td>

                <td>{getClicks(url).toLocaleString()}</td>

                <td>{getCreated(url)}</td>

                <td>
                  <div className="ls-actions">

                    <button
                      className="ls-icon-button"
                      title="Copy link"
                      onClick={() => handleCopy(short, id)}
                    >
                      <Copy size={15} />
                    </button>

                    {copiedId === id && (
                      <span className="ls-copied">Copied!</span>
                    )}

                    <button
                      className="ls-icon-button ls-delete"
                      title="Delete link"
                      onClick={() => handleDelete(id)}
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>
                </td>

              </tr>
            );
          })}
        </tbody>

      </table>

    </div>
  );
}

export default Dashboard;
