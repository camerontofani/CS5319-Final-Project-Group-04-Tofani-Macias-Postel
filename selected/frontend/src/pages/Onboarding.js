import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useAppData } from '../context/AppDataContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

const STYLE_OPTIONS = [
  { id: 'Visual', title: 'Visual', subtitle: 'Diagrams & charts' },
  { id: 'Auditory', title: 'Auditory', subtitle: 'Lectures & discussion' },
  { id: 'Reading/Writing', title: 'Reading/Writing', subtitle: 'Notes & summaries' },
  { id: 'Kinesthetic', title: 'Kinesthetic', subtitle: 'Practice & exercises' },
  { id: 'Collaborative', title: 'Collaborative', subtitle: 'Group sessions' },
];

const SESSION_OPTIONS = [30, 45, 60, 90, 120];
const BREAK_OPTIONS = [5, 10, 15, 20, 30];
const DAILY_GOAL_OPTIONS = [1, 1.5, 2, 2.5, 3, 4, 5];

function emptyHourlySlots() {
  const o = {};
  DAYS.forEach((d) => {
    o[d] = {};
    HOURS.forEach((h) => {
      o[d][h] = false;
    });
  });
  return o;
}

function applyPlanToForm(ir, setters) {
  const {
    setCourseRows,
    setSlots,
    setLearningStyles,
    setSessionLength,
    setBreakLength,
    setDailyGoal,
    setAiSmart,
    setAiPractice,
    setAiPriority,
  } = setters;
  const names = (ir.courses || []).map((c) => String(c.name || '').trim()).filter(Boolean);
  setCourseRows(names.length ? names : ['']);
  const next = emptyHourlySlots();
  for (const row of ir.availability || []) {
    const day = row.day;
    if (!next[day]) continue;
    for (const h of row.hours || []) {
      if (Object.prototype.hasOwnProperty.call(next[day], h)) next[day][h] = true;
    }
  }
  setSlots(next);
  const p = ir.preferences;
  if (p && typeof p === 'object') {
    if (Array.isArray(p.learningStyles)) setLearningStyles(new Set(p.learningStyles));
    if (p.sessionLengthMinutes != null) setSessionLength(Number(p.sessionLengthMinutes));
    if (p.breakMinutes != null) setBreakLength(Number(p.breakMinutes));
    if (p.dailyGoalHours != null) setDailyGoal(Number(p.dailyGoalHours));
    if (typeof p.aiSmartAdjust === 'boolean') setAiSmart(p.aiSmartAdjust);
    if (typeof p.aiPracticeQuestions === 'boolean') setAiPractice(p.aiPracticeQuestions);
    if (typeof p.aiPriorityRecommendations === 'boolean') setAiPriority(p.aiPriorityRecommendations);
  }
}

const Onboarding = ({ setCurrentScreen }) => {
  const { generatePlan, loading, plan, courseSetupDraft, setCourseSetupDraft, appDataReady } = useAppData();
  const saving = loading.plan;
  /** One-time hydrate from server plan/draft per mount — never re-run when draft PATCH echoes back. */
  const formHydratedRef = useRef(false);
  const lastSyncedDraftJson = useRef('');
  /** Always holds latest draftPayload so post-hydrate microtask can seed lastSyncedDraftJson correctly. */
  const draftPayloadRef = useRef(null);

  const [step, setStep] = useState(1);
  const [courseRows, setCourseRows] = useState(['']);
  const [slots, setSlots] = useState(emptyHourlySlots);
  const [learningStyles, setLearningStyles] = useState(() => new Set(['Visual', 'Kinesthetic']));
  const [sessionLength, setSessionLength] = useState(90);
  const [breakLength, setBreakLength] = useState(15);
  const [dailyGoal, setDailyGoal] = useState(3);
  const [aiSmart, setAiSmart] = useState(true);
  const [aiPractice, setAiPractice] = useState(true);
  const [aiPriority, setAiPriority] = useState(true);
  const [formError, setFormError] = useState(null);

  // load saved form once when data is ready
  useLayoutEffect(() => {
    if (!appDataReady || formHydratedRef.current) return;
    formHydratedRef.current = true;
    const ir = courseSetupDraft ?? plan?.input_received;
    if (ir) {
      applyPlanToForm(ir, {
        setCourseRows,
        setSlots,
        setLearningStyles,
        setSessionLength,
        setBreakLength,
        setDailyGoal,
        setAiSmart,
        setAiPractice,
        setAiPriority,
      });
    }
    // set draft marker so old defaults do not patch
    queueMicrotask(() => {
      lastSyncedDraftJson.current = JSON.stringify(draftPayloadRef.current);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after appDataReady
  }, [appDataReady]);

  const toggleHour = useCallback((day, hour) => {
    setSlots((prev) => ({
      ...prev,
      [day]: { ...prev[day], [hour]: !prev[day][hour] },
    }));
  }, []);

  const toggleStyle = useCallback((id) => {
    setLearningStyles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const availabilityPayload = useMemo(
    () =>
      DAYS.map((day) => ({
        day,
        hours: HOURS.filter((h) => slots[day][h]).sort((a, b) => a - b),
      })).filter((row) => row.hours.length > 0),
    [slots]
  );

  const courseList = useMemo(() => courseRows.map((c) => c.trim()).filter(Boolean), [courseRows]);

  const draftPayload = useMemo(
    () => ({
      courses: courseList.map((name) => ({ name })),
      availability: availabilityPayload,
      preferences: {
        learningStyles: Array.from(learningStyles).sort((a, b) => a.localeCompare(b)),
        sessionLengthMinutes: sessionLength,
        breakMinutes: breakLength,
        dailyGoalHours: dailyGoal,
        aiSmartAdjust: aiSmart,
        aiPracticeQuestions: aiPractice,
        aiPriorityRecommendations: aiPriority,
      },
    }),
    [
      courseList,
      availabilityPayload,
      learningStyles,
      sessionLength,
      breakLength,
      dailyGoal,
      aiSmart,
      aiPractice,
      aiPriority,
    ]
  );

  draftPayloadRef.current = draftPayload;

  useEffect(() => {
    if (!appDataReady) return;
    const json = JSON.stringify(draftPayload);
    if (json === lastSyncedDraftJson.current) return;
    lastSyncedDraftJson.current = json;
    setCourseSetupDraft(draftPayload);
  }, [draftPayload, setCourseSetupDraft, appDataReady]);

  const setCourseAt = (index, value) => {
    setCourseRows((rows) => {
      const next = [...rows];
      next[index] = value;
      return next;
    });
  };

  const addCourseRow = () => setCourseRows((rows) => [...rows, '']);
  const removeCourseRow = (index) => {
    setCourseRows((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)));
  };

  const canNextFrom1 = courseList.length > 0;
  const canNextFrom2 = availabilityPayload.length > 0;
  const canNextFrom3 = learningStyles.size > 0;

  const goNext = () => {
    setFormError(null);
    if (step === 1 && !canNextFrom1) {
      setFormError('Add at least one course.');
      return;
    }
    if (step === 2 && !canNextFrom2) {
      setFormError('Click the grid to mark at least one hour you are available.');
      return;
    }
    if (step === 3 && !canNextFrom3) {
      setFormError('Pick at least one learning style.');
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const goPrev = () => {
    setFormError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (courseList.length === 0) {
      setFormError('Add at least one course.');
      setStep(1);
      return;
    }
    if (availabilityPayload.length === 0) {
      setFormError('Mark your weekly availability.');
      setStep(2);
      return;
    }
    if (learningStyles.size === 0) {
      setFormError('Pick at least one learning style.');
      setStep(3);
      return;
    }
    try {
      await generatePlan({
        courses: courseList.map((name) => ({ name })),
        availability: availabilityPayload,
        preferences: {
          learningStyles: Array.from(learningStyles).sort((a, b) => a.localeCompare(b)),
          sessionLengthMinutes: sessionLength,
          breakMinutes: breakLength,
          dailyGoalHours: dailyGoal,
          aiSmartAdjust: aiSmart,
          aiPracticeQuestions: aiPractice,
          aiPriorityRecommendations: aiPriority,
        },
      });
      setCurrentScreen('Study Plan');
    } catch (err) {
      setFormError(err.message || 'Could not save. Try again.');
    }
  };

  const stepTitle =
    step === 1 ? 'Your courses' : step === 2 ? 'Weekly availability' : 'Study preferences';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 pt-8 pb-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Course setup</p>
          <h2 className="text-2xl font-bold text-gray-900">{stepTitle}</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {step === 1 && 'Add each class you want on your plan.'}
            {step === 2 &&
              'Click hourly cells to mark when you are available to study (8am to 9pm). Your selections are saved when you leave this screen.'}
            {step === 3 && 'Tell SmartStudy how you learn and how long you like to focus.'}
          </p>

          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div
                  className={`h-2 flex-1 rounded-full ${
                    n < step ? 'bg-indigo-600' : n === step ? 'bg-indigo-400' : 'bg-gray-200'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span className={step === 1 ? 'font-semibold text-indigo-700' : ''}>1. Courses</span>
            <span className={step === 2 ? 'font-semibold text-indigo-700' : ''}>2. Availability</span>
            <span className={step === 3 ? 'font-semibold text-indigo-700' : ''}>3. Preferences</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {step === 1 && (
            <section>
              <div className="space-y-3">
                {courseRows.map((row, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={row}
                      onChange={(e) => setCourseAt(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          goNext();
                        }
                      }}
                      placeholder="e.g. CS 301 Algorithms"
                      className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    {courseRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCourseRow(index)}
                        className="shrink-0 px-3 py-2 text-sm text-gray-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCourseRow}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Add another course
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <div className="overflow-x-auto pb-2 -mx-2 px-2">
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-1 text-xs font-medium text-gray-500 mb-2">
                    <div />
                    {DAYS.map((d) => (
                      <div key={d} className="text-center py-1 font-semibold text-gray-700">
                        {d}
                      </div>
                    ))}
                  </div>
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-1 items-center mb-0.5"
                    >
                      <div className="text-[11px] text-gray-500 pr-2 text-right tabular-nums">
                        {hour > 12 ? `${hour - 12} pm` : hour === 12 ? '12 pm' : `${hour} am`}
                      </div>
                      {DAYS.map((day) => {
                        const on = slots[day][hour];
                        return (
                          <button
                            key={`${day}-${hour}`}
                            type="button"
                            onClick={() => toggleHour(day, hour)}
                            aria-pressed={on}
                            className={`h-7 rounded-md border text-[10px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                              on
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-gray-200 hover:border-indigo-300'
                            }`}
                          >
                            {on ? '●' : ''}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-600" /> Available
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-gray-300 bg-white" /> Not available
                </span>
              </div>
            </section>
          )}

          {step === 3 && (
            <form onSubmit={handleGenerateSubmit} className="space-y-8">
              <section>
                <h3 className="font-semibold text-gray-900 mb-3">Learning style</h3>
                <p className="text-sm text-gray-500 mb-4">Select all that apply.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STYLE_OPTIONS.map((s) => {
                    const on = learningStyles.has(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStyle(s.id)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all ${
                          on
                            ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                            : 'border-gray-200 hover:border-indigo-200 bg-white'
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{s.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{s.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session length</label>
                  <select
                    value={sessionLength}
                    onChange={(e) => setSessionLength(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white"
                  >
                    {SESSION_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break length</label>
                  <select
                    value={breakLength}
                    onChange={(e) => setBreakLength(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white"
                  >
                    {BREAK_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily study goal</label>
                  <select
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white"
                  >
                    {DAILY_GOAL_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h} hours/day
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-3">AI features</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiSmart}
                      onChange={(e) => setAiSmart(e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      <span className="font-medium text-gray-900">Smart schedule adjustments</span>
                      <span className="block text-sm text-gray-500">AI adapts your plan based on progress.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiPractice}
                      onChange={(e) => setAiPractice(e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      <span className="font-medium text-gray-900">Practice question generation</span>
                      <span className="block text-sm text-gray-500">Generate quiz questions for topics.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiPriority}
                      onChange={(e) => setAiPriority(e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      <span className="font-medium text-gray-900">Priority recommendations</span>
                      <span className="block text-sm text-gray-500">Suggest which topics need more focus.</span>
                    </span>
                  </label>
                </div>
              </section>

              {formError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={goPrev}
                  className="order-2 sm:order-1 px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  ← Previous
                </button>
                <div className="order-1 sm:order-2 flex flex-1 justify-end gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-60"
                  >
                    {saving ? 'Generating...' : 'Generate plan →'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {step < 3 && (
            <>
              {formError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={step === 1}
                  className="order-2 sm:order-1 px-5 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
                >
                  ← Previous
                </button>
                <div className="order-1 sm:order-2 flex flex-1 justify-end gap-3">
                  <button
                    type="button"
                    onClick={goNext}
                    className="px-6 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
