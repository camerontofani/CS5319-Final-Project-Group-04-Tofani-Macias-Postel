import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';

const TABS = ['Overview', 'Topics', 'Missed & Recovery'];

function topicsFromLogs(logs) {
  const map = {};
  for (const log of logs) {
    const k = (log.topic || 'Session').trim();
    if (!map[k]) map[k] = { sumC: 0, n: 0 };
    map[k].sumC += Number(log.confidence) || 0;
    map[k].n += 1;
  }
  return Object.entries(map).map(([topic, v]) => {
    const pct = v.n ? Math.round((v.sumC / v.n / 5) * 100) : 0;
    const course = (topic.split(' - ')[0] || topic.split('-')[0] || '').trim() || 'n/a';
    return {
      course,
      topic,
      pct,
      sessions: `${v.n} session(s) logged`,
      stale: false,
    };
  });
}

/** Hours studied per calendar day for the last 7 days (index 0 = oldest, 6 = today). */
function hoursLast7Days(logs) {
  const out = Array(7).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const log of logs) {
    if (!log.loggedAt) continue;
    const d = new Date(log.loggedAt);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (diffDays >= 0 && diffDays <= 6) {
      out[6 - diffDays] += (Number(log.minutes) || 0) / 60;
    }
  }
  return out.map((h) => Math.round(h * 10) / 10);
}

function dayLabels() {
  const labels = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    labels.push(
      d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    );
  }
  return labels;
}

function readinessFromLogsAndPlan(logs, prefs) {
  const fromTopics = topicsFromLogs(logs);
  if (fromTopics.length > 0) {
    return fromTopics.map((t) => ({
      label: t.topic.length > 42 ? `${t.topic.slice(0, 40)}...` : t.topic,
      pct: t.pct,
    }));
  }
  const names = prefs?.courses?.map((c) => c.name).filter(Boolean) ?? [];
  if (names.length === 0) return [];
  return names.map((n) => ({ label: n, pct: 50 }));
}

const Progress = () => {
  const { logProgress, progressLogs, loading, error, setError, plan, courseSetupDraft } = useAppData();
  const [tab, setTab] = useState('Overview');
  const [minutes, setMinutes] = useState('');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState('3');
  const [sessionTime, setSessionTime] = useState('');
  const [priority, setPriority] = useState('medium');
  const [localErr, setLocalErr] = useState(null);
  const [saveOk, setSaveOk] = useState(false);

  const prefs = courseSetupDraft ?? plan?.input_received ?? null;
  const courses = prefs?.courses?.map((c) => c.name).filter(Boolean) ?? [];

  const totalMinutes = useMemo(
    () => progressLogs.reduce((sum, e) => sum + (Number(e.minutes) || 0), 0),
    [progressLogs]
  );

  const totalHours = (totalMinutes / 60).toFixed(1);
  const avgConfidencePct = useMemo(() => {
    if (progressLogs.length === 0) return null;
    const mean =
      progressLogs.reduce((s, e) => s + (Number(e.confidence) || 0), 0) / progressLogs.length;
    return Math.round((mean / 5) * 100);
  }, [progressLogs]);

  const lowConfidenceCount = useMemo(
    () => progressLogs.filter((l) => Number(l.confidence) <= 2).length,
    [progressLogs]
  );

  const chartHours = useMemo(() => hoursLast7Days(progressLogs), [progressLogs]);
  const chartLabels = useMemo(() => dayLabels(), []);
  const chartMax = useMemo(() => Math.max(0.5, ...chartHours, 1), [chartHours]);

  const readinessRows = useMemo(
    () => readinessFromLogsAndPlan(progressLogs, prefs),
    [progressLogs, prefs]
  );

  const topicRows = useMemo(() => topicsFromLogs(progressLogs), [progressLogs]);

  const submit = async (e) => {
    e.preventDefault();
    setLocalErr(null);
    setError(null);
    const m = Number(minutes);
    if (!Number.isFinite(m) || m <= 0) {
      setLocalErr('Enter how many minutes you studied (a positive number).');
      return;
    }
    if (!topic.trim()) {
      setLocalErr('What subject or topic did you work on?');
      return;
    }
    try {
      const payload = {
        minutes: m,
        topic: topic.trim(),
        task_completed: notes.trim() || undefined,
        confidence: Number(confidence) || undefined,
        priority: priority || undefined,
      };
      if (sessionTime) {
        const d = new Date(sessionTime);
        if (!Number.isNaN(d.getTime())) payload.started_at = d.toISOString();
      }
      await logProgress(payload);
      setMinutes('');
      setNotes('');
      setSessionTime('');
      setSaveOk(true);
      window.setTimeout(() => setSaveOk(false), 4000);
    } catch {
      /* surfaced via context */
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Progress</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Log sessions below. Charts update automatically from your saved logs (last 7 days).
        </p>
      </header>

      {saveOk && (
        <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          Session saved. It appears in your list below and stays after reload.
        </div>
      )}

      {(error || localErr) && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error || localErr}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total hours (logged)', value: `${totalHours}h`, sub: 'From your sessions' },
          { label: 'Avg confidence', value: avgConfidencePct == null ? 'n/a' : `${avgConfidencePct}%`, sub: 'From 1 to 5 ratings' },
          { label: 'Low confidence (≤2)', value: String(lowConfidenceCount), sub: 'Sessions in your logs' },
          { label: 'Sessions logged', value: `${progressLogs.length}`, sub: 'Saved on this device' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200 flex gap-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">Study time (last 7 days)</h3>
            <p className="text-xs text-gray-500 mb-4">Total hours per day from your logged sessions.</p>
            <div className="h-44 flex items-end gap-1.5 sm:gap-2">
              {chartHours.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end min-w-0">
                  <div
                    className="bg-indigo-400 rounded-t-md w-full min-h-[6px] transition-all"
                    style={{ height: `${Math.min(160, (h / chartMax) * 160)}px` }}
                  />
                  <p className="text-[9px] sm:text-[10px] text-center text-gray-500 mt-2 leading-tight px-0.5 line-clamp-2">
                    {chartLabels[i]}
                  </p>
                </div>
              ))}
            </div>
            {progressLogs.length === 0 && (
              <p className="text-xs text-gray-400 mt-3">Log a session to see bars fill in.</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">Subject readiness</h3>
            <p className="text-xs text-gray-500 mb-4">Confidence by topic from your logs, or placeholders from Course Setup.</p>
            {readinessRows.length === 0 ? (
              <p className="text-sm text-gray-500">Log sessions or add courses in Course Setup to see readiness.</p>
            ) : (
              <div className="space-y-3">
                {readinessRows.map((s, idx) => (
                  <div key={`${s.label}-${idx}`}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate pr-2">{s.label}</span>
                      <span className="font-semibold text-indigo-700 shrink-0">{Number(s.pct) || 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, Number(s.pct) || 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Topics' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-600">Aggregated from your session logs (topic + confidence).</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Activity</th>
              </tr>
            </thead>
            <tbody>
              {topicRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Log a session with a topic to populate this table.
                  </td>
                </tr>
              ) : (
                topicRows.map((row, tidx) => (
                  <tr key={`${row.topic}-${tidx}`} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.course}</td>
                    <td className="px-4 py-3 text-gray-700">{row.topic}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-100 max-w-[120px] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.pct >= 70 ? 'bg-emerald-500' : 'bg-rose-400'}`}
                            style={{ width: `${Math.min(100, row.pct)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{row.pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.sessions}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Missed & Recovery' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2">Missed tasks</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              In a full product, sessions you skipped or moved would show up here with reasons from your calendar or study
              plan. This demo does not track misses yet, so there is nothing to display.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span aria-hidden>⚡</span> Recovery suggestions
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Later, SmartStudy could suggest catch-up blocks based on missed work and deadlines. For now, use{' '}
              <strong>Study Plan</strong> and <strong>Course Setup</strong> to adjust your schedule.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Log a study session</h3>
        <form onSubmit={submit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
            <input
              type="number"
              min="1"
              step="1"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="e.g. 90"
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">When (optional)</label>
            <input
              type="datetime-local"
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic / course</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. CS301 - dynamic programming"
              list={courses.length ? 'course-suggestions' : undefined}
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
            {courses.length > 0 && (
              <datalist id="course-suggestions">
                {courses.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What you did (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Problems, reading, quiz"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confidence (1 to 5)</label>
            <select
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading.progress}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading.progress ? 'Saving...' : 'Save session'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-2">Your sessions</h3>
        {progressLogs.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {progressLogs
              .slice()
              .reverse()
              .map((entry, idx) => (
                <li key={`${entry.loggedAt}-${idx}`} className="text-sm border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <p className="font-medium text-gray-900">
                    {entry.minutes} min · {entry.topic || 'Session'}
                    {entry.priority ? (
                      <span className="text-xs font-normal text-gray-500 ml-2">({entry.priority} priority)</span>
                    ) : null}
                  </p>
                  {entry.started_at && (
                    <p className="text-xs text-gray-500 mt-1">{new Date(entry.started_at).toLocaleString()}</p>
                  )}
                  {entry.task_completed && <p className="text-gray-600 mt-1">{entry.task_completed}</p>}
                  {entry.confidence != null && <p className="text-xs text-gray-500 mt-1">Confidence: {entry.confidence}/5</p>}
                  {entry.loggedAt && <p className="text-xs text-gray-400 mt-1">Saved {new Date(entry.loggedAt).toLocaleString()}</p>}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Progress;
