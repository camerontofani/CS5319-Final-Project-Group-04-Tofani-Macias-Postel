import React, { useState, useMemo, useCallback } from 'react';
import { useAppData } from '../context/AppDataContext';

const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfWeekMonday(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatRange(weekStart) {
  const end = addDays(weekStart, 6);
  const opts = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${weekStart.toLocaleDateString(undefined, opts)} to ${end.toLocaleDateString(undefined, opts)}`;
}

function dayShortLabel(date) {
  return SHORT[date.getDay()];
}

function daysUntil(iso) {
  const t = new Date(`${iso}T12:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.round((t - now) / 86400000);
}

function taskMatchesCourseList(task, courseNames) {
  if (!courseNames.length) return false;
  const cn = (task.courseName || '').trim();
  if (!cn) return true;
  const lower = cn.toLowerCase();
  return courseNames.some((n) => n.trim().toLowerCase() === lower);
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function isDeadlineUrgentForTask(item, deadlines) {
  const taskName = norm(item.courseName);
  const taskCode = norm(item.courseCode);
  if (!taskName && !taskCode) return false;
  return (deadlines || []).some((d) => {
    const dd = daysUntil(d.date);
    if (!Number.isFinite(dd) || dd < 0 || dd > 7) return false;
    const dCode = norm(d.courseCode);
    const dTitle = norm(d.title);
    if (taskCode && dCode && (taskCode.includes(dCode) || dCode.includes(taskCode))) return true;
    if (taskName && dCode && (taskName.includes(dCode) || dCode.includes(taskName))) return true;
    if (taskName && dTitle && (taskName.includes(dTitle) || dTitle.includes(taskName))) return true;
    return false;
  });
}

function effectivePriority(item, deadlines) {
  if (isDeadlineUrgentForTask(item, deadlines)) return 'high';
  return item.priority || 'medium';
}

const ACCENTS = [
  'border-l-amber-400 bg-amber-50/30',
  'border-l-blue-500 bg-blue-50/30',
  'border-l-emerald-500 bg-emerald-50/30',
  'border-l-violet-500 bg-violet-50/30',
  'border-l-rose-400 bg-rose-50/30',
];

const Dashboard = ({ setCurrentScreen }) => {
  const {
    plan,
    courseSetupDraft,
    fetchAi,
    loading,
    deadlines,
    addDeadline,
    removeDeadline,
    completedTaskKeys,
    taskKey,
    toggleTaskComplete,
  } = useAppData();
  const [deadlineTitle, setDeadlineTitle] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineCourse, setDeadlineCourse] = useState('');
  const [deadlineErr, setDeadlineErr] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const prefs = courseSetupDraft ?? plan?.input_received ?? null;
  const courseNames = useMemo(
    () => prefs?.courses?.map((c) => c.name).filter(Boolean) ?? [],
    [prefs]
  );
  const tasksIndexed = useMemo(() => {
    const raw = plan?.sample_tasks ?? [];
    return raw.map((t, idx) => ({ t, idx }));
  }, [plan?.sample_tasks]);
  const tasks = useMemo(() => {
    if (!courseNames.length) return [];
    return tasksIndexed.filter(({ t }) => taskMatchesCourseList(t, courseNames));
  }, [tasksIndexed, courseNames]);
  const prefObj = prefs?.preferences;
  const learningStyles =
    prefObj && typeof prefObj === 'object' && Array.isArray(prefObj.learningStyles)
      ? prefObj.learningStyles.join(', ')
      : typeof prefObj === 'string'
        ? prefObj
        : null;

  const weekStart = useMemo(() => startOfWeekMonday(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const selectedShort = dayShortLabel(selectedDate);
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const tasksForSelectedDay = useMemo(() => {
    const list = tasks.filter(({ t }) => t.day === selectedShort);
    return list.sort((a, b) => (a.t.startTime || '').localeCompare(b.t.startTime || ''));
  }, [tasks, selectedShort]);

  const today = new Date();
  const todayShort = dayShortLabel(today);

  const todayTasksForPanel = useMemo(() => {
    const list = tasks.filter(({ t }) => t.day === todayShort);
    return list.sort((a, b) => (a.t.startTime || '').localeCompare(b.t.startTime || ''));
  }, [tasks, todayShort]);

  const courseIndex = useCallback(
    (name) => {
      const i = courseNames.findIndex((n) => (name || '').includes(n.split(' ')[0]));
      return i >= 0 ? i % ACCENTS.length : 0;
    },
    [courseNames]
  );

  const handleAiAdjustment = async () => {
    const topic = courseNames.length ? courseNames.join(', ') : 'Your courses';
    await fetchAi({ topic });
    setCurrentScreen('AI Recommendations');
  };

  const addDl = (e) => {
    e.preventDefault();
    if (!deadlineTitle.trim() || !deadlineDate) {
      setDeadlineErr('Add a title and date.');
      return;
    }
    const chosenCourse = (deadlineCourse || '').trim();
    if (courseNames.length > 0 && !chosenCourse) {
      setDeadlineErr('Choose a course for this deadline.');
      return;
    }
    setDeadlineErr('');
    addDeadline(deadlineTitle.trim(), deadlineDate, chosenCourse);
    setDeadlineTitle('');
    setDeadlineDate('');
    setDeadlineCourse('');
  };

  const doneToday = todayTasksForPanel.filter(({ t, idx }) =>
    completedTaskKeys.includes(taskKey(t, idx))
  ).length;
  const totalToday = todayTasksForPanel.length;

  const shiftWeek = (delta) => {
    setSelectedDate((d) => addDays(d, delta * 7));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-3 gap-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Weekly calendar</h2>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => shiftWeek(-1)}
                className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                ← Prev week
              </button>
              <button
                type="button"
                onClick={() => shiftWeek(1)}
                className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Next week →
              </button>
            </div>
          </div>
          <p className="text-gray-500 mt-1 text-sm">{formatRange(weekStart)}</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            Your plan is a weekly pattern: the same weekday sessions repeat for any week you browse until you change Course
            Setup.
          </p>
          {plan && prefObj && typeof prefObj === 'object' && (
            <p className="text-xs text-gray-400 mt-2">
              Session {prefObj.sessionLengthMinutes ?? 'n/a'} min · Break {prefObj.breakMinutes ?? 'n/a'} min · Goal{' '}
              {prefObj.dailyGoalHours ?? 'n/a'} h/day
              {learningStyles ? ` · ${learningStyles}` : ''}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAiAdjustment}
          disabled={loading.ai || !plan}
          className="inline-flex items-center justify-center gap-2 border-2 border-dashed border-indigo-300 text-indigo-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span aria-hidden>✨</span>
          Request AI adjustment
        </button>
      </header>

      {!plan && (
        <div className="mb-8 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <p className="text-gray-700 mb-4">Complete the three-step course setup to generate your plan.</p>
          <button
            type="button"
            onClick={() => setCurrentScreen('Course Setup')}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700"
          >
            Open course setup
          </button>
        </div>
      )}

      {plan && courseNames.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {courseNames.map((name) => (
            <span key={name} className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-sm font-medium">
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {weekDays.map((d) => {
                const sel = isSameDay(d, selectedDate);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center min-w-[52px] py-2 px-3 rounded-xl transition-all ${
                      sel ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold opacity-80">{SHORT[d.getDay()]}</span>
                    <span className="text-lg font-bold tabular-nums">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <h3 className="font-bold text-gray-900 mb-4">
              {selectedShort} · Sessions
            </h3>
            {tasksForSelectedDay.length === 0 ? (
              <p className="text-sm text-gray-500">
                No sessions on this day in your plan. Adjust availability in Course Setup or pick another day.
              </p>
            ) : (
              <ul className="space-y-3">
                {tasksForSelectedDay.map(({ t: item, idx }) => {
                  const accent = ACCENTS[courseIndex(item.courseName || item.task)];
                  return (
                    <li
                      key={`${item.startTime}-${idx}`}
                      className={`flex rounded-xl border border-gray-100 overflow-hidden shadow-sm ${accent} border-l-4`}
                    >
                      <div className="w-16 shrink-0 py-4 px-2 text-center bg-white/80 text-sm font-semibold text-gray-700 tabular-nums">
                        {item.startTime || 'n/a'}
                      </div>
                      <div className="flex-1 py-4 px-4">
                        <p className="font-semibold text-gray-900">
                          {item.task || 'Study block'}
                          {item.courseCode ? (
                            <span className="text-gray-500 font-normal"> ({item.courseCode})</span>
                          ) : null}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {item.minutes ? `${item.minutes} min` : ''}
                          {` · ${effectivePriority(item, deadlines)} priority`}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-baseline mb-4">
              <h3 className="font-bold text-gray-900">Today&apos;s tasks</h3>
              {totalToday > 0 && (
                <span className="text-xs font-semibold text-indigo-600">
                  {doneToday}/{totalToday} done
                </span>
              )}
            </div>
            {totalToday > 0 && (
              <div className="h-2 rounded-full bg-gray-100 mb-4 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.round((doneToday / totalToday) * 100)}%` }}
                />
              </div>
            )}
            {todayTasksForPanel.length === 0 ? (
              <p className="text-sm text-gray-500">No tasks scheduled for today.</p>
            ) : (
              <ul className="space-y-3">
                {todayTasksForPanel.map(({ t: item, idx }) => {
                  const key = taskKey(item, idx);
                  const done = completedTaskKeys.includes(key);
                  return (
                    <li key={key}>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleTaskComplete(key)}
                          className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              done ? 'text-gray-400 line-through' : 'text-gray-900'
                            }`}
                          >
                            {item.task}
                            {item.courseCode ? (
                              <span className="text-gray-500 font-normal"> ({item.courseCode})</span>
                            ) : null}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.minutes ? (
                              <span className="text-xs text-gray-500">{item.minutes} min</span>
                            ) : null}
                            {effectivePriority(item, deadlines) ? (
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  effectivePriority(item, deadlines) === 'high'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {effectivePriority(item, deadlines)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span aria-hidden>⚠️</span> Upcoming deadlines
            </h3>
            <form onSubmit={addDl} className="space-y-2 mb-4 mt-4">
              <input
                type="text"
                value={deadlineTitle}
                onChange={(e) => {
                  setDeadlineTitle(e.target.value);
                  if (deadlineErr) setDeadlineErr('');
                }}
                placeholder="Midterm, assignment"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              {courseNames.length > 0 ? (
                <select
                  value={deadlineCourse}
                  onChange={(e) => {
                    setDeadlineCourse(e.target.value);
                    if (deadlineErr) setDeadlineErr('');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                >
                  <option value="">Choose course</option>
                  {courseNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={deadlineCourse}
                  onChange={(e) => {
                    setDeadlineCourse(e.target.value);
                    if (deadlineErr) setDeadlineErr('');
                  }}
                  placeholder="Course (optional)"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              )}
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => {
                  setDeadlineDate(e.target.value);
                  if (deadlineErr) setDeadlineErr('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              {deadlineErr && <p className="text-xs text-red-600">{deadlineErr}</p>}
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-indigo-700"
              >
                Add deadline
              </button>
            </form>
            {deadlines.length === 0 ? (
              <p className="text-sm text-gray-500">No deadlines yet.</p>
            ) : (
              <ul className="space-y-3">
                {deadlines.map((d) => {
                  const n = daysUntil(d.date);
                  const label = n === 0 ? 'today' : n === 1 ? 'in 1d' : `in ${n}d`;
                  return (
                    <li
                      key={d.id}
                      className="flex justify-between items-start gap-2 text-sm border border-gray-100 rounded-xl p-3 bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{d.title}</p>
                        <p className="text-xs text-gray-500">
                          {d.courseCode ? `${d.courseCode} · ` : ''}
                          {d.date} · {label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDeadline(d.id)}
                        className="text-xs text-red-600 hover:underline shrink-0"
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
