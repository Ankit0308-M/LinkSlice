import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  MousePointerClick,
  Link2,
  TrendingUp,
  RefreshCw
} from "lucide-react";

import api from "../api/axios";

function Analytics() {
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState({
    totalLinks: 0,
    totalClicks: 0,
    allTimeClicks: 0,
    averageClicksPerLink: 0
  });

  const [dailyClicks, setDailyClicks] = useState([]);
  const [topLinks, setTopLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/api/urls/analytics?days=${days}`
      );

      const result = response.data.data || response.data;

      setSummary({
        totalLinks: Number(result.summary?.totalLinks || 0),
        totalClicks: Number(result.summary?.totalClicks || 0),
        allTimeClicks: Number(result.summary?.allTimeClicks || 0),
        averageClicksPerLink: Number(
          result.summary?.averageClicksPerLink || 0
        )
      });

      setDailyClicks(
        Array.isArray(result.dailyClicks)
          ? result.dailyClicks
          : []
      );

      setTopLinks(
        Array.isArray(result.topLinks)
          ? result.topLinks
          : []
      );
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.message ||
          "Unable to load analytics."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short"
    });
  };

  if (loading) {
    return (
      <section className="ls-card">
        <p>Loading analytics...</p>
      </section>
    );
  }

  return (
    <div className="ls-analytics-page">

      {error && (
        <div className="ls-alert ls-error">
          {error}
        </div>
      )}

      <section className="ls-card">
        <div className="ls-card-heading">
          <div>
            <h2>Performance overview</h2>
            <p>Understand how people interact with your short links.</p>
          </div>

          <div className="ls-analytics-actions">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="ls-analytics-select"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <button
              className="ls-icon-button"
              onClick={fetchAnalytics}
              title="Refresh analytics"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="ls-stats">
          <StatCard
            title="Clicks in selected period"
            value={summary.totalClicks}
            description={`Clicks in the last ${days} days`}
            icon={<MousePointerClick />}
          />

          <StatCard
            title="Total links"
            value={summary.totalLinks}
            description="Your shortened URLs"
            icon={<Link2 />}
          />

          <StatCard
            title="All-time clicks"
            value={summary.allTimeClicks}
            description="Total recorded visits"
            icon={<TrendingUp />}
          />

          <StatCard
            title="Average clicks per link"
            value={Number(
              summary.averageClicksPerLink
            ).toFixed(1)}
            description="Selected period average"
            icon={<MousePointerClick />}
          />
        </div>
      </section>

      <section className="ls-card ls-analytics-chart">
        <div className="ls-card-heading">
          <div>
            <h2>Daily click activity</h2>
            <p>Clicks received on each day.</p>
          </div>
        </div>

        {dailyClicks.length === 0 ? (
          <div className="ls-empty">
            No click activity available for this period.
          </div>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart
                data={dailyClicks}
                margin={{
                  top: 15,
                  right: 20,
                  left: 0,
                  bottom: 5
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#64748b"
                  opacity={0.25}
                />

                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fill: "currentColor", fontSize: 12 }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "currentColor", fontSize: 12 }}
                />

                <Tooltip
                  labelFormatter={(value) => formatDate(value)}
                />

                <Line
                  type="monotone"
                  dataKey="clicks"
                  name="Clicks"
                  stroke="#3978ed"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="ls-card">
        <div className="ls-card-heading">
          <div>
            <h2>Top performing links</h2>
            <p>Your most clicked shortened URLs.</p>
          </div>
        </div>

        {topLinks.length === 0 ? (
          <div className="ls-empty">
            No link performance data is available yet.
          </div>
        ) : (
          <div className="ls-table-wrap">
            <table className="ls-table">
              <thead>
                <tr>
                  <th>SHORT ID</th>
                  <th>ORIGINAL URL</th>
                  <th>CLICKS</th>
                </tr>
              </thead>

              <tbody>
                {topLinks.map((link, index) => (
                  <tr key={link.shortId || link.id || index}>
                    <td>
                      <strong>
                        {link.shortId || "—"}
                      </strong>
                    </td>

                    <td>
                      <span className="ls-original">
                        {link.redirectUrl ||
                         link.originalUrl ||
                         "—"}
                      </span>
                    </td>

                    <td>
                      {Number(
                        link.clicks ?? link.clickCount ?? 0
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

function StatCard({ title, value, description, icon }) {
  return (
    <div className="ls-card ls-stat-card">
      <div className="ls-stat-heading">
        <span>{title}</span>
        <div className="ls-stat-icon">{icon}</div>
      </div>

      <strong>{Number(value).toLocaleString()}</strong>

      <p>{description}</p>
    </div>
  );
}

export default Analytics;