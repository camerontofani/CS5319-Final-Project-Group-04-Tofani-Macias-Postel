import { useState } from "react";

// screen d: static demo data for now (would call progress-service later)
export function ProgressPage() {
  const [tab, setTab] = useState<"overview" | "topics" | "missed">("overview");

  return (
    <>
      <header className="page-header">
        <p className="crumb">Academic performance</p>
        <h1>Progress tracking</h1>
      </header>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-label">Total hours studied</span>
          <strong className="stat-value">45.5h</strong>
          <span className="muted">This month</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg confidence</span>
          <strong className="stat-value">60%</strong>
          <span className="muted">Across all topics</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Low confidence</span>
          <strong className="stat-value">4 topics</strong>
          <span className="muted">Need more focus</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Tasks completed</span>
          <strong className="stat-value">34/48</strong>
          <span className="muted">This month</span>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={tab === "overview" ? "active" : ""}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>
        <button
          type="button"
          className={tab === "topics" ? "active" : ""}
          onClick={() => setTab("topics")}
        >
          Topics
        </button>
        <button
          type="button"
          className={tab === "missed" ? "active" : ""}
          onClick={() => setTab("missed")}
        >
          Missed & recovery
        </button>
      </div>

      {tab === "overview" && (
        <div className="two-col">
          <section className="card">
            <h2>Study hours per week</h2>
            <div className="fake-chart">
              <svg viewBox="0 0 400 120" aria-hidden>
                <polyline
                  fill="none"
                  stroke="var(--blue-600)"
                  strokeWidth="3"
                  points="0,90 60,70 120,85 180,40 240,55 300,35 360,50 400,45"
                />
              </svg>
              <div className="fake-x">Feb 10 → Mar 3</div>
            </div>
          </section>
          <section className="card">
            <h2>Subject readiness</h2>
            <div className="radar-placeholder">
              <div className="radar-tri" />
              <ul className="radar-legend">
                <li>CS301 Algorithms · 58%</li>
                <li>CS315 OS · 67%</li>
                <li>CS320 DB · 65%</li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {tab === "topics" && (
        <section className="card">
          <h2>Topic confidence summary</h2>
          <p className="legend-inline">
            <span className="good">High ≥70%</span>
            <span className="mid">Medium 50–69%</span>
            <span className="bad">Low &lt;50%</span>
          </p>
          <table className="topic-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Confidence</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="pill">Algorithms</span> Binary trees
                </td>
                <td>
                  <div className="bar-cell good">
                    <span style={{ width: "85%" }} />
                  </div>
                  85%
                </td>
                <td className="muted">2d ago · 2 sessions</td>
              </tr>
              <tr>
                <td>
                  <span className="pill">Algorithms</span> Greedy algorithms
                </td>
                <td>
                  <div className="bar-cell bad">
                    <span style={{ width: "30%" }} />
                  </div>
                  30%
                </td>
                <td>
                  <span className="stale">Stale</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {tab === "missed" && (
        <div className="two-col">
          <section className="card">
            <h2>Missed tasks · 3 missed</h2>
            <ul className="missed-list">
              <li>
                <div className="miss-bar" />
                <div>
                  <strong>Greedy algorithms practice</strong>
                  <div className="muted">CS301 · Mar 10</div>
                  <div className="muted">Reason: schedule conflict</div>
                </div>
              </li>
            </ul>
          </section>
          <section className="card">
            <h2>Recommended recovery plan</h2>
            <div className="recovery-card">
              <span className="tag warn">high priority</span>
              <strong>CS301 · Dynamic programming</strong>
              <p>Add 45-min session this Thursday.</p>
              <p className="muted">Low confidence + upcoming exam</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
