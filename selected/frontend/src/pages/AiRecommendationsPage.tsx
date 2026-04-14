import { useState } from "react";

// screen f: summary banner + plan adjustments vs practice prompts + accept/edit/reject
export function AiRecommendationsPage() {
  const [tab, setTab] = useState<"plan" | "practice">("plan");

  return (
    <>
      <header className="page-header row-between">
        <div>
          <h1>AI recommendations</h1>
          <p className="muted">Powered by AI</p>
        </div>
        <button type="button" className="btn-primary">
          Regenerate
        </button>
      </header>

      <section className="ai-summary card">
        <p>
          AI analyzed your last 2 weeks of study data: 14 completed sessions, 3
          missed tasks, confidence logs, and your April exam schedule.
        </p>
        <p className="muted">
          <strong>4</strong> pending actions · <strong>0</strong> accepted
        </p>
      </section>

      <div className="tabs">
        <button
          type="button"
          className={tab === "plan" ? "active" : ""}
          onClick={() => setTab("plan")}
        >
          Plan adjustments
        </button>
        <button
          type="button"
          className={tab === "practice" ? "active" : ""}
          onClick={() => setTab("practice")}
        >
          Practice prompts
        </button>
      </div>

      {tab === "plan" && (
        <ul className="rec-list">
          <li className="rec-card">
            <div className="rec-head">
              <span className="tag blue">Schedule</span>
              <span className="tag impact">high impact</span>
            </div>
            <h3>Move CS315 file systems to Thursday</h3>
            <p className="muted">
              Reschedule your file systems review to avoid overlap with OS lab
              prep.
            </p>
            <details>
              <summary>Why this recommendation?</summary>
              <p className="muted">You have a free 30-minute window Thursday 5:30–6pm.</p>
            </details>
            <div className="rec-actions">
              <button type="button" className="btn-primary sm">
                Accept
              </button>
              <button type="button" className="btn-outline sm">
                Edit
              </button>
              <button type="button" className="btn-outline sm">
                Reject
              </button>
            </div>
          </li>
        </ul>
      )}

      {tab === "practice" && (
        <ul className="rec-list">
          <li className="rec-card">
            <div className="rec-head">
              <span className="tag purple">Quiz</span>
              <span className="tag soft">CS301</span>
              <span className="tag impact soft">medium</span>
            </div>
            <h3>Dynamic programming</h3>
            <p>
              Given an array of integers, what is the time complexity of finding
              the longest increasing subsequence using dynamic programming?
            </p>
            <button type="button" className="link-btn">
              Reveal answer hint →
            </button>
          </li>
          <li className="rec-card">
            <div className="rec-head">
              <span className="tag purple">Flashcard</span>
              <span className="tag soft">CS316</span>
              <span className="tag good">easy</span>
            </div>
            <h3>File systems</h3>
            <p>
              What is the difference between an inode and a directory entry in a
              Unix file system?
            </p>
          </li>
        </ul>
      )}
    </>
  );
}
