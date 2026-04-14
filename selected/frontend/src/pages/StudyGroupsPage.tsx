import { useState } from "react";
import { postJson } from "../api/client";

// screen e: group list + detail + check-in form
export function StudyGroupsPage() {
  const [active, setActive] = useState("g1");
  const [tab, setTab] = useState<"overview" | "goals" | "milestones">(
    "overview",
  );
  const [checkin, setCheckin] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitCheckin() {
    setBusy(true);
    try {
      await postJson("/api/groups/checkin", { text: checkin, groupId: active });
      setCheckin("");
      alert("Check-in saved (stub)");
    } catch {
      alert(
        "Could not reach the api. Start the backend (port 8000) to save check-ins.",
      );
    } finally {
      setBusy(false);
    }
  }

  const groups = [
    { id: "g1", name: "CS301 Algo Squad", members: 4, mile: 60 },
    { id: "g2", name: "OS study circle", members: 5, mile: 40 },
    { id: "g3", name: "Database crew", members: 3, mile: 75 },
  ];

  const current = groups.find((g) => g.id === active)!;

  return (
    <div className="groups-layout">
      <aside className="groups-list">
        <header className="row-between">
          <div>
            <p className="crumb">Collaborative learning</p>
            <h1>Study groups</h1>
          </div>
          <button type="button" className="btn-primary sm">
            + Create group
          </button>
        </header>
        <ul>
          {groups.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className={`group-tile ${g.id === active ? "active" : ""}`}
                onClick={() => setActive(g.id)}
              >
                <strong>{g.name}</strong>
                <div className="muted">{g.members} members</div>
                <div className="mile">Milestone {g.mile}%</div>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-outline full">
          + Join a group
        </button>
      </aside>

      <section className="group-detail card">
        <header className="row-between">
          <div>
            <h1>{current.name}</h1>
            <p className="muted">Cracking algorithms together before finals.</p>
            <p className="muted">
              Next meet Thu, Mar 5 · 7pm · {current.members} members · Chat ·
              Invite
            </p>
          </div>
        </header>

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
            className={tab === "goals" ? "active" : ""}
            onClick={() => setTab("goals")}
          >
            Goals
          </button>
          <button
            type="button"
            className={tab === "milestones" ? "active" : ""}
            onClick={() => setTab("milestones")}
          >
            Milestones
          </button>
        </div>

        {tab === "overview" && (
          <>
            <h2>Weekly check-in status</h2>
            <ul className="member-status">
              <li>
                <span className="status-dot ok" aria-hidden />
                <div>
                  <strong>Alex Johnson (you)</strong>
                  <div className="muted">Finish DP chapter + 5 problems</div>
                </div>
                <span className="pill good">Checked in</span>
              </li>
              <li>
                <span className="status-dot ok" aria-hidden />
                <div>
                  <strong>Maya Patel</strong>
                  <div className="muted">Review binary tree problems</div>
                </div>
                <span className="pill good">Checked in</span>
              </li>
              <li>
                <span className="status-dot pending" aria-hidden />
                <div>
                  <strong>Jake Lee</strong>
                  <div className="muted">Goal not shared</div>
                </div>
                <span className="pill soft">Pending</span>
              </li>
            </ul>

            <div className="checkin-box">
              <p>
                How&apos;s your progress on this week&apos;s goals? Share a quick
                update with your group.
              </p>
              <textarea
                rows={3}
                placeholder="e.g. Finished 3/5 DP problems, struggling with coin change…"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
              />
              <div className="row-end">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={submitCheckin}
                >
                  Submit check-in
                </button>
              </div>
            </div>
          </>
        )}

        {tab === "goals" && (
          <p className="muted">Group goals list would go here.</p>
        )}
        {tab === "milestones" && (
          <p className="muted">Group milestones timeline would go here.</p>
        )}
      </section>
    </div>
  );
}
