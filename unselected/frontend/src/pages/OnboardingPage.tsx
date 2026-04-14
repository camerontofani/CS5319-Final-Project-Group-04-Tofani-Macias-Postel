import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { postToService } from "../api/client";

type CourseRow = {
  id: string;
  name: string;
  code: string;
  exam: string;
  credits: string;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = [
  "8am",
  "9am",
  "10am",
  "11am",
  "12pm",
  "1pm",
  "2pm",
  "3pm",
  "4pm",
  "5pm",
  "6pm",
  "7pm",
];

// screen b: same wizard as monolith; plan generation goes to study-plan-service only
export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<CourseRow[]>([
    {
      id: "1",
      name: "Algorithms & Data Structures",
      code: "CS301",
      exam: "2026-04-15",
      credits: "4",
    },
  ]);
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    exam: "",
    credits: "3",
  });

  const [slots, setSlots] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (let d = 0; d < 5; d++) {
      for (let h = 2; h <= 3; h++) {
        init[`${d}-${h}`] = true;
      }
    }
    return init;
  });

  const [styles, setStyles] = useState<string[]>(["visual", "kinesthetic"]);
  const [sessionLen, setSessionLen] = useState("90 minutes");
  const [breakLen, setBreakLen] = useState("15 minutes");
  const [dailyGoal, setDailyGoal] = useState("3 hours/day");
  const [aiSmart, setAiSmart] = useState(true);
  const [aiPractice, setAiPractice] = useState(true);
  const [aiPriority, setAiPriority] = useState(true);

  function toggleSlot(dayIndex: number, hourIndex: number) {
    const key = `${dayIndex}-${hourIndex}`;
    setSlots((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function addCourse(e: FormEvent) {
    e.preventDefault();
    if (!newCourse.name.trim()) return;
    setCourses((c) => [
      ...c,
      {
        id: String(Date.now()),
        ...newCourse,
      },
    ]);
    setNewCourse({ name: "", code: "", exam: "", credits: "3" });
  }

  const payloadPreview = useMemo(
    () => ({
      courses,
      availability: slots,
      preferences: {
        learningStyles: styles,
        sessionLen,
        breakLen,
        dailyGoal,
        ai: { smart: aiSmart, practice: aiPractice, priority: aiPriority },
      },
    }),
    [
      courses,
      slots,
      styles,
      sessionLen,
      breakLen,
      dailyGoal,
      aiSmart,
      aiPractice,
      aiPriority,
    ],
  );

  async function generatePlan() {
    try {
      await postToService("studyPlan", "/generate", payloadPreview);
    } catch {
      // still navigate so demo works without services
    }
    navigate("/study-plan");
  }

  return (
    <>
      <header className="page-header">
        <h1>Configure Your Study Profile</h1>
        <p>Help us personalize your study plan in just a few steps.</p>
      </header>

      <div className="stepper">
        <div className={`step ${step >= 1 ? "done" : ""}`}>
          <span>1</span> Courses
        </div>
        <div className={`step ${step >= 2 ? "done" : ""}`}>
          <span>2</span> Availability
        </div>
        <div className={`step ${step >= 3 ? "active" : ""}`}>
          <span>3</span> Preferences
        </div>
      </div>

      {step === 1 && (
        <section className="card">
          <h2>Your courses</h2>
          <div className="course-list">
            {courses.map((c) => (
              <div key={c.id} className="course-card">
                <div>
                  <strong>{c.name}</strong>
                  <div className="muted">{c.code}</div>
                </div>
                <div className="muted">Exam: {c.exam}</div>
                <div>{c.credits} credits</div>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Remove course"
                  onClick={() =>
                    setCourses((list) => list.filter((x) => x.id !== c.id))
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <form className="grid-form" onSubmit={addCourse}>
            <input
              placeholder="Course name"
              value={newCourse.name}
              onChange={(e) =>
                setNewCourse((n) => ({ ...n, name: e.target.value }))
              }
            />
            <input
              placeholder="Course code"
              value={newCourse.code}
              onChange={(e) =>
                setNewCourse((n) => ({ ...n, code: e.target.value }))
              }
            />
            <input
              type="date"
              value={newCourse.exam}
              onChange={(e) =>
                setNewCourse((n) => ({ ...n, exam: e.target.value }))
              }
            />
            <select
              value={newCourse.credits}
              onChange={(e) =>
                setNewCourse((n) => ({ ...n, credits: e.target.value }))
              }
            >
              <option value="3">3 credits</option>
              <option value="4">4 credits</option>
            </select>
            <button type="submit" className="btn-primary">
              + Add course
            </button>
          </form>
          <div className="wizard-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setStep(2)}
            >
              Next →
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="card">
          <h2>Weekly availability</h2>
          <p className="muted">Click to mark when you&apos;re available to study.</p>
          <div className="avail-grid-wrap">
            <table className="avail-grid">
              <thead>
                <tr>
                  <th />
                  {DAYS.map((d) => (
                    <th key={d}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour, hi) => (
                  <tr key={hour}>
                    <th>{hour}</th>
                    {DAYS.map((_, di) => {
                      const key = `${di}-${hi}`;
                      const on = !!slots[key];
                      return (
                        <td key={key}>
                          <button
                            type="button"
                            className={`slot ${on ? "on" : ""}`}
                            onClick={() => toggleSlot(di, hi)}
                            aria-label={`toggle ${hour}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="legend">
            <span>
              <span className="dot on" /> Available
            </span>
            <span>
              <span className="dot" /> Not available
            </span>
          </div>
          <div className="wizard-actions">
            <button type="button" className="link-btn" onClick={() => setStep(1)}>
              ← Previous
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setStep(3)}
            >
              Next →
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="card">
          <h2>Study preferences</h2>
          <p className="muted">Learning style (select all that apply)</p>
          <div className="style-grid">
            {[
              { id: "visual", label: "Visual", sub: "Diagrams & charts" },
              { id: "auditory", label: "Auditory", sub: "Lectures & discussion" },
              {
                id: "reading",
                label: "Reading/Writing",
                sub: "Notes & summaries",
              },
              { id: "kinesthetic", label: "Kinesthetic", sub: "Practice & exercises" },
              { id: "collab", label: "Collaborative", sub: "Group sessions" },
            ].map((opt) => {
              const selected = styles.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`style-card ${selected ? "selected" : ""}`}
                  onClick={() =>
                    setStyles((s) =>
                      s.includes(opt.id)
                        ? s.filter((x) => x !== opt.id)
                        : [...s, opt.id],
                    )
                  }
                >
                  <strong>{opt.label}</strong>
                  <span className="muted">{opt.sub}</span>
                </button>
              );
            })}
          </div>

          <div className="row-3">
            <label>
              Session length
              <select
                value={sessionLen}
                onChange={(e) => setSessionLen(e.target.value)}
              >
                <option>60 minutes</option>
                <option>90 minutes</option>
                <option>120 minutes</option>
              </select>
            </label>
            <label>
              Break length
              <select value={breakLen} onChange={(e) => setBreakLen(e.target.value)}>
                <option>10 minutes</option>
                <option>15 minutes</option>
                <option>20 minutes</option>
              </select>
            </label>
            <label>
              Daily study goal
              <select value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)}>
                <option>2 hours/day</option>
                <option>3 hours/day</option>
                <option>4 hours/day</option>
              </select>
            </label>
          </div>

          <div className="check-list">
            <label>
              <input
                type="checkbox"
                checked={aiSmart}
                onChange={(e) => setAiSmart(e.target.checked)}
              />
              Smart schedule adjustments
            </label>
            <label>
              <input
                type="checkbox"
                checked={aiPractice}
                onChange={(e) => setAiPractice(e.target.checked)}
              />
              Practice question generation
            </label>
            <label>
              <input
                type="checkbox"
                checked={aiPriority}
                onChange={(e) => setAiPriority(e.target.checked)}
              />
              Priority recommendations
            </label>
          </div>

          <div className="wizard-actions">
            <button type="button" className="link-btn" onClick={() => setStep(2)}>
              ← Previous
            </button>
            <button type="button" className="btn-primary" onClick={generatePlan}>
              Generate plan →
            </button>
          </div>
        </section>
      )}
    </>
  );
}
