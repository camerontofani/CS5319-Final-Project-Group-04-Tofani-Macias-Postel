import { useState } from "react";
import { postToService } from "../api/client";

// screen c: same layout; ai button calls ai-service only (not the monolith)
export function StudyPlanPage() {
  const [weekLabel] = useState("Mar 2–8, 2026");
  const [aiBusy, setAiBusy] = useState(false);

  async function requestAi() {
    setAiBusy(true);
    try {
      await postToService("ai", "/recommend", {
        topic: "Upcoming exams",
      });
      alert("AI response logged (stub) — check network tab");
    } catch {
      alert(
        "Could not reach ai-service (port 8106). Start it or use this page as a static demo.",
      );
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="study-plan-layout">
      <div className="study-plan-main">
        <header className="page-header row-between">
          <div>
            <h1>Weekly calendar</h1>
            <p className="muted">{weekLabel}</p>
          </div>
          <div className="week-nav">
            <button type="button" className="btn-outline sm">
              ←
            </button>
            <button type="button" className="btn-outline sm">
              →
            </button>
          </div>
        </header>

        <div className="week-strip">
          {["Mon 2", "Tue 3", "Wed 4", "Thu 5", "Fri 6", "Sat 7", "Sun 8"].map(
            (d, i) => (
              <button
                key={d}
                type="button"
                className={`day-pill ${i === 2 ? "active" : ""}`}
              >
                {d}
              </button>
            ),
          )}
        </div>

        <section className="card">
          <h2>Wednesday · timeline</h2>
          <ul className="timeline">
            <li>
              <span className="time">10:00</span>
              <div className="tl-body bar-orange">
                <strong>Memory Management</strong>
                <div className="muted">CS315 · 90 min</div>
              </div>
            </li>
            <li>
              <span className="time">13:00</span>
              <div className="tl-body bar-blue">
                <strong>Dynamic Programming</strong>
                <div className="muted">CS301 · 120 min</div>
              </div>
            </li>
            <li>
              <span className="time">16:30</span>
              <div className="tl-body bar-green">
                <strong>Normalization (1NF–3NF)</strong>
                <div className="muted">CS320 · 60 min</div>
              </div>
            </li>
          </ul>
          <button
            type="button"
            className="btn-ai"
            onClick={requestAi}
            disabled={aiBusy}
          >
            Request AI adjustment
          </button>
        </section>
      </div>

      <aside className="study-plan-side">
        <section className="card">
          <div className="row-between">
            <h2>Today&apos;s tasks</h2>
            <span className="muted">2/4 done</span>
          </div>
          <div className="progress-bar">
            <div className="fill" style={{ width: "50%" }} />
          </div>
          <ul className="task-list">
            <li>
              <span className="chk done" />
              <div>
                <strong>Memory Management</strong>
                <div className="muted">CS315 · 90 min</div>
              </div>
              <span className="tag warn">high</span>
            </li>
            <li>
              <span className="chk" />
              <div>
                <strong>Dynamic Programming</strong>
                <div className="muted">CS301 · 120 min</div>
              </div>
              <span className="tag soft">medium</span>
            </li>
            <li>
              <span className="chk" />
              <div>
                <strong>Normalization (1NF–3NF)</strong>
                <div className="muted">CS320 · 60 min</div>
              </div>
            </li>
            <li>
              <span className="chk" />
              <div>
                <strong>Practice problems set 3</strong>
                <div className="muted">CS301 · 45 min</div>
              </div>
            </li>
          </ul>
        </section>

        <section className="card">
          <h2>Upcoming deadlines</h2>
          <ul className="deadline-list">
            <li>
              <span className="sq orange" />
              <div>
                <strong>Midterm exam</strong>
                <div className="muted">CS301 · Apr 15 · in 41d</div>
              </div>
            </li>
            <li>
              <span className="sq blue" />
              <div>
                <strong>Assignment #3</strong>
                <div className="muted">CS315 · Mar 14 · in 10d</div>
              </div>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
