import React, { useState, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';

function topicFromPlan(plan, courseSetupDraft) {
  const prefs = courseSetupDraft ?? plan?.input_received;
  const list = prefs?.courses?.map((c) => c.name).filter(Boolean) ?? [];
  return list.length ? list.join(', ') : 'your plan';
}

function daysUntil(iso) {
  const t = new Date(`${String(iso || '').slice(0, 10)}T12:00:00`);
  if (Number.isNaN(t.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - now.getTime()) / 86400000);
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function nearestDeadlineForSuggestion(item, deadlines) {
  const cName = norm(item?.courseName);
  const cCode = norm(item?.courseCode);
  let best = null;
  for (const d of deadlines || []) {
    const dd = daysUntil(d.date);
    if (dd == null || dd < 0 || dd > 10) continue;
    const dTitle = norm(d.title);
    const dCode = norm(d.courseCode);
    // Strict: if deadline has courseCode, only match by course identity.
    // Fallback to title matching only when no explicit courseCode exists.
    const matchesByCourse =
      (cCode && dCode && (cCode.includes(dCode) || dCode.includes(cCode))) ||
      (cName && dCode && (cName.includes(dCode) || dCode.includes(cName)));
    const matches = dCode ? matchesByCourse : matchesByCourse || (cName && dTitle && (cName.includes(dTitle) || dTitle.includes(cName)));
    if (!matches) continue;
    if (!best || dd < best.days) best = { days: dd, title: String(d.title || 'deadline'), date: String(d.date || '') };
  }
  return best;
}

function dayLabelToIndex(dayLabel) {
  const d = String(dayLabel || '').trim().slice(0, 3).toLowerCase();
  if (d === 'sun') return 0;
  if (d === 'mon') return 1;
  if (d === 'tue') return 2;
  if (d === 'wed') return 3;
  if (d === 'thu') return 4;
  if (d === 'fri') return 5;
  if (d === 'sat') return 6;
  return null;
}

function isDayBeforeDeadline(sessionDay, deadlineIsoDate) {
  const sessionIdx = dayLabelToIndex(sessionDay);
  if (sessionIdx == null) return false;
  const due = new Date(`${String(deadlineIsoDate || '').slice(0, 10)}T12:00:00`);
  if (Number.isNaN(due.getTime())) return false;
  const dueIdx = due.getDay();
  return sessionIdx === (dueIdx + 6) % 7;
}

function deadlineActionText(title, days) {
  const t = String(title || '').toLowerCase();
  const when = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days}d`;
  if (['exam', 'midterm', 'final', 'quiz', 'test'].some((k) => t.includes(k))) return `Study for exam (${when})`;
  if (['hw', 'homework', 'assignment', 'problem set', 'pset'].some((k) => t.includes(k))) {
    return `Complete homework (${when})`;
  }
  return `Prepare for ${title} (${when})`;
}

function formatClock(timeValue) {
  const match = String(timeValue || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeValue || '--:--';
  const h24 = Number(match[1]);
  const mm = match[2];
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${suffix}`;
}

const AIRecommendations = () => {
  const { fetchAi, aiResult, loading, plan, courseSetupDraft, applyAiSuggestions, deadlines } = useAppData();
  const aiLoading = loading.ai;
  const [decision, setDecision] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [applyError, setApplyError] = useState('');
  const scheduleSuggestions = Array.isArray(aiResult?.recommendations) ? aiResult.recommendations : [];

  useEffect(() => {
    fetchAi({ topic: topicFromPlan(plan) }).catch(() => {});
  }, [plan, fetchAi]);

  useEffect(() => {
    if (aiResult?.recommendation) {
      setEditedText(String(aiResult.recommendation));
    }
  }, [aiResult]);

  const refresh = async () => {
    await fetchAi({ topic: topicFromPlan(plan, courseSetupDraft) });
  };

  const acceptSuggestions = async () => {
    setApplyError('');
    try {
      const count = await applyAiSuggestions(scheduleSuggestions);
      setDecision(count > 0 ? 'accepted' : 'dismissed');
      if (count === 0) setApplyError('No schedule suggestions to apply yet. Click Refresh first.');
    } catch (e) {
      setApplyError(e.message || 'Could not apply suggestions.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Suggestions</h2>
          <p className="text-gray-500 mt-1">Adjustments based on your plan and activity.</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={aiLoading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-gray-200 text-gray-800 font-medium hover:bg-gray-50 disabled:opacity-60"
        >
          {aiLoading ? 'Updating...' : 'Refresh'}
        </button>
      </header>

      <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold mb-2">Suggestion</h3>
        <p className="text-indigo-200 text-sm mb-6">{aiResult?.reason || 'We can tune your schedule based on what you tell us.'}</p>

        <div className="space-y-3 mb-8">
          <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-sm leading-relaxed">
            {editedText || 'Your suggestion will load here.'}
          </div>
        </div>

        {isEditing && (
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wide text-indigo-200 font-semibold mb-2">Edit</label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full min-h-28 rounded-xl bg-white text-gray-900 p-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="mt-3 bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Done
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={acceptSuggestions}
            className="flex-1 bg-white text-indigo-900 font-semibold py-3 rounded-xl hover:bg-indigo-50"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => {
              setDecision('edited');
              setIsEditing(true);
            }}
            className="flex-1 bg-indigo-700 text-white font-semibold py-3 rounded-xl border border-indigo-500 hover:bg-indigo-600"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setDecision('dismissed');
              setIsEditing(false);
            }}
            className="sm:px-6 py-3 text-indigo-200 font-medium hover:text-white"
          >
            Dismiss
          </button>
        </div>
        {decision && (
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-indigo-200">
            {decision === 'accepted' && 'Accepted'}
            {decision === 'edited' && 'Editing'}
            {decision === 'dismissed' && 'Dismissed'}
          </p>
        )}
        {applyError && <p className="mt-3 text-xs text-rose-200">{applyError}</p>}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-widest text-gray-500">Practice idea</h3>
        <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-indigo-500 text-gray-800 leading-relaxed">
          {aiResult?.recommendation ? `Try: ${aiResult.recommendation}` : 'Log progress and refresh for a tailored prompt.'}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-widest text-gray-500">Schedule changes</h3>
        {scheduleSuggestions.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 text-sm">
            Refresh to get concrete schedule edits you can apply.
          </div>
        ) : (
          <div className="space-y-3">
            {scheduleSuggestions.slice(0, 3).map((item, idx) => (
              <div key={`${item.day || 'day'}-${item.startTime || idx}`} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                {(() => {
                  const nearest = nearestDeadlineForSuggestion(item, deadlines);
                  const deadlineAction =
                    nearest && isDayBeforeDeadline(item.day, nearest.date)
                      ? deadlineActionText(nearest.title, nearest.days)
                      : null;
                  return deadlineAction ? <p className="text-xs font-semibold text-rose-700 mb-1">Deadline focus: {deadlineAction}</p> : null;
                })()}
                <p className="text-sm font-semibold text-gray-900">
                  {(item.day || 'Day TBD')} · {formatClock(item.startTime)} - {formatClock(item.endTime)}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  {item.courseName || 'Course'}: {item.task || 'Study block'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(item.minutes || 45)} min · priority {(item.priority || 'medium')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;
