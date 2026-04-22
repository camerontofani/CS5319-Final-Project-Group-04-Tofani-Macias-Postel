import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { apiGet, apiPost, apiPatch } from '../api/client';

const AppDataContext = createContext(null);

const initialLoading = { plan: false, progress: false, group: false, ai: false };

const emptyProfile = { displayName: '', major: '', year: '' };

function emptyGroupEntry() {
  return { weeklyGoal: '', milestones: {}, checkins: [] };
}

const DAY_ALIASES = {
  monday: 'Mon',
  mon: 'Mon',
  tuesday: 'Tue',
  tue: 'Tue',
  wednesday: 'Wed',
  wed: 'Wed',
  thursday: 'Thu',
  thu: 'Thu',
  friday: 'Fri',
  fri: 'Fri',
  saturday: 'Sat',
  sat: 'Sat',
  sunday: 'Sun',
  sun: 'Sun',
};

function normalizeDayLabel(day) {
  const key = String(day || '').trim().toLowerCase();
  return DAY_ALIASES[key] || 'Mon';
}

function normalizeCourseKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function timeToMinutes(timeValue) {
  const match = String(timeValue || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function courseTokens(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

function tokenOverlapScore(a, b) {
  const aa = new Set(courseTokens(a));
  const bb = new Set(courseTokens(b));
  let score = 0;
  aa.forEach((t) => {
    if (bb.has(t)) score += 1;
  });
  return score;
}

function taskSignature(task) {
  return [
    normalizeDayLabel(task.day),
    normalizeCourseKey(task.courseCode || task.courseName),
    String(task.startTime || ''),
    String(task.endTime || ''),
    normalizeCourseKey(task.task),
  ].join('|');
}

function daysUntilDate(isoValue) {
  const d = new Date(`${String(isoValue || '').slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function nearestDeadlineForCourse(deadlines, courseName, courseCode) {
  const cName = normalizeCourseKey(courseName);
  const cCode = normalizeCourseKey(courseCode);
  const cNameTokens = new Set(courseTokens(courseName));
  let best = null;
  for (const d of deadlines || []) {
    const dd = daysUntilDate(d.date);
    if (dd == null || dd < 0) continue;
    const dTitle = normalizeCourseKey(d.title);
    const dCode = normalizeCourseKey(d.courseCode);
    const dTitleTokens = new Set(courseTokens(d.title));
    const exactCodeMatch = cCode && dCode && cCode === dCode;
    const codeMatchesCourseToken = dCode && cNameTokens.has(dCode);
    const titleTokenOverlap = [...cNameTokens].some((t) => dTitleTokens.has(t));
    const matches = dCode ? exactCodeMatch || codeMatchesCourseToken : titleTokenOverlap;
    if (!matches) continue;
    if (!best || dd < best.daysUntil) {
      best = { title: String(d.title || 'deadline'), daysUntil: dd, date: String(d.date || '') };
    }
  }
  return best;
}

function dayLabelToIndex(dayLabel) {
  const d = normalizeDayLabel(dayLabel);
  if (d === 'Sun') return 0;
  if (d === 'Mon') return 1;
  if (d === 'Tue') return 2;
  if (d === 'Wed') return 3;
  if (d === 'Thu') return 4;
  if (d === 'Fri') return 5;
  if (d === 'Sat') return 6;
  return null;
}

function isDayBeforeDeadline(sessionDay, deadlineIsoDate) {
  const sessionIdx = dayLabelToIndex(sessionDay);
  if (sessionIdx == null) return false;
  const dueDate = new Date(`${String(deadlineIsoDate || '').slice(0, 10)}T12:00:00`);
  if (Number.isNaN(dueDate.getTime())) return false;
  const dueIdx = dueDate.getDay();
  const dayBeforeDue = (dueIdx + 6) % 7;
  return sessionIdx === dayBeforeDue;
}

function deadlineActionText(deadlineTitle, daysUntil) {
  const title = String(deadlineTitle || '').toLowerCase();
  const dueText = daysUntil <= 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil}d`;
  if (
    title.includes('exam') ||
    title.includes('midterm') ||
    title.includes('final') ||
    title.includes('quiz') ||
    title.includes('test')
  ) {
    return `Study for exam (${dueText})`;
  }
  if (
    title.includes('hw') ||
    title.includes('homework') ||
    title.includes('assignment') ||
    title.includes('problem set') ||
    title.includes('pset')
  ) {
    return `Complete homework (${dueText})`;
  }
  return `Prepare for ${deadlineTitle} (${dueText})`;
}

export function AppDataProvider({ children, userId }) {
  const [plan, setPlan] = useState(null);
  const [courseSetupDraft, setCourseSetupDraftState] = useState(null);
  const [progressLogs, setProgressLogs] = useState([]);
  const [groupResult, setGroupResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [profile, setProfileState] = useState(emptyProfile);
  const [studyGroups, setStudyGroupsState] = useState([]);
  const [completedTaskKeys, setCompletedTaskKeysState] = useState([]);
  const [groupData, setGroupDataState] = useState({});
  const [appDataReady, setAppDataReady] = useState(false);
  const pendingPatchRef = useRef({});
  const patchInFlightRef = useRef(false);

  const syncFromServer = useCallback((s) => {
    if (!s) return;
    const has = (k) => Object.prototype.hasOwnProperty.call(s, k);
    if (has('plan')) setPlan(s.plan ?? null);
    if (has('courseSetupDraft')) setCourseSetupDraftState(s.courseSetupDraft ?? null);
    if (has('progressLogs')) setProgressLogs(Array.isArray(s.progressLogs) ? s.progressLogs : []);
    if (has('deadlines')) setDeadlines(Array.isArray(s.deadlines) ? s.deadlines : []);
    if (has('profile')) {
      setProfileState(s.profile && typeof s.profile === 'object' ? { ...emptyProfile, ...s.profile } : emptyProfile);
    }
    if (has('studyGroups')) setStudyGroupsState(Array.isArray(s.studyGroups) ? s.studyGroups : []);
    if (has('completedTaskKeys')) setCompletedTaskKeysState(Array.isArray(s.completedTaskKeys) ? s.completedTaskKeys : []);
    if (has('groupData')) setGroupDataState(s.groupData && typeof s.groupData === 'object' ? s.groupData : {});
  }, []);

  useEffect(() => {
    if (userId == null) {
      setPlan(null);
      setCourseSetupDraftState(null);
      setProgressLogs([]);
      setDeadlines([]);
      setProfileState(emptyProfile);
      setStudyGroupsState([]);
      setCompletedTaskKeysState([]);
      setGroupDataState({});
      setAppDataReady(true);
      return;
    }
    let cancelled = false;
    setAppDataReady(false);
    (async () => {
      try {
        const s = await apiGet('/api/user-state');
        if (!cancelled) {
          syncFromServer(s);
          setAppDataReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setAppDataReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, syncFromServer]);

  const flushPatchQueue = useCallback(async () => {
    if (patchInFlightRef.current) return;
    patchInFlightRef.current = true;
    try {
      while (Object.keys(pendingPatchRef.current).length > 0) {
        const payload = pendingPatchRef.current;
        pendingPatchRef.current = {};
        try {
          const s = await apiPatch('/api/user-state', payload);
          syncFromServer(s);
        } catch (e) {
          setError(e.message);
          try {
            const s = await apiGet('/api/user-state');
            syncFromServer(s);
          } catch {
            /* keep error; refetch failed */
          }
        }
      }
    } finally {
      patchInFlightRef.current = false;
    }
  }, [syncFromServer]);

  const patchServer = useCallback(
    async (partial) => {
      if (userId == null) return;
      pendingPatchRef.current = { ...pendingPatchRef.current, ...partial };
      await flushPatchQueue();
    },
    [userId, flushPatchQueue]
  );

  const patchGroupData = useCallback(
    (groupId, partial) => {
      if (!groupId) return;
      setGroupDataState((prev) => {
        const cur = { ...emptyGroupEntry(), ...prev[groupId] };
        const nextEntry = { ...cur, ...partial };
        const next = { ...prev, [groupId]: nextEntry };
        patchServer({ groupData: next });
        return next;
      });
    },
    [patchServer]
  );

  const setGroupWeeklyGoal = useCallback(
    (groupId, weeklyGoal) => {
      patchGroupData(groupId, { weeklyGoal: weeklyGoal ?? '' });
    },
    [patchGroupData]
  );

  const setGroupMilestones = useCallback(
    (groupId, milestones) => {
      patchGroupData(groupId, { milestones: milestones || {} });
    },
    [patchGroupData]
  );

  const appendGroupCheckin = useCallback(
    (groupId, comment) => {
      if (!groupId) return;
      setGroupDataState((prev) => {
        const cur = { ...emptyGroupEntry(), ...prev[groupId] };
        const checkins = [
          ...(cur.checkins || []),
          { comment: comment || '(empty)', savedAt: new Date().toISOString() },
        ];
        const next = { ...prev, [groupId]: { ...cur, checkins } };
        patchServer({ groupData: next });
        return next;
      });
    },
    [patchServer]
  );

  const setProfile = useCallback(
    (patch) => {
      setProfileState((prev) => {
        const next = { ...prev, ...patch };
        patchServer({ profile: next });
        return next;
      });
    },
    [patchServer]
  );

  const setStudyGroups = useCallback(
    (updater) => {
      setStudyGroupsState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        patchServer({ studyGroups: next });
        return next;
      });
    },
    [patchServer]
  );

  const createStudyGroup = useCallback(
    ({ name, description }) => {
      const n = (name || '').trim();
      if (!n) return null;
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `g-${Date.now()}`;
      const shortName = n.length > 8 ? `${n.slice(0, 7)}...` : n;
      const display = (profile.displayName || '').trim() || 'You';
      const group = {
        id,
        name: n,
        shortName,
        memberCount: 1,
        milestonePct: 0,
        description: (description || '').trim() || 'New study group',
        nextMeeting: 'Pick a time',
        members: [
          {
            id: 'you',
            name: display,
            role: 'Organizer',
            goal: 'Set your first weekly goal',
            progress: '0/1',
            status: 'pending',
          },
        ],
      };
      setStudyGroups((prev) => [...prev, group]);
      return group;
    },
    [profile.displayName, setStudyGroups]
  );

  const joinStudyGroup = useCallback(
    (inviteCode) => {
      const code = (inviteCode || '').trim();
      if (!code) return false;
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `join-${Date.now()}`;
      const group = {
        id,
        name: `Joined · ${code}`,
        shortName: code.slice(0, 6),
        memberCount: 3,
        milestonePct: 25,
        description: 'Group from invite code (demo)',
        nextMeeting: 'TBD',
        members: [
          {
            id: 'you',
            name: (profile.displayName || '').trim() || 'You',
            role: 'You',
            goal: 'Introduce yourself in chat',
            progress: '0/1',
            status: 'pending',
          },
          {
            id: 'x1',
            name: 'Peer A',
            goal: 'Weekly reading',
            progress: '2/2',
            status: 'checked_in',
          },
          {
            id: 'x2',
            name: 'Peer B',
            goal: 'Problem set 4',
            progress: '1/3',
            status: 'checked_in',
          },
        ],
      };
      setStudyGroups((prev) => [...prev, group]);
      return true;
    },
    [profile.displayName, setStudyGroups]
  );

  const setCompletedTaskKeys = useCallback(
    (updater) => {
      setCompletedTaskKeysState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        patchServer({ completedTaskKeys: next });
        return next;
      });
    },
    [patchServer]
  );

  const taskKey = useCallback((t, idx) => {
    const day = t.day ?? '';
    const st = t.startTime ?? '';
    const cc = t.courseCode ?? '';
    const task = t.task ?? '';
    return `${day}|${st}|${cc}|${task}|${idx}`;
  }, []);

  const toggleTaskComplete = useCallback(
    (key) => {
      setCompletedTaskKeys((prev) => {
        if (prev.includes(key)) return prev.filter((k) => k !== key);
        return [...prev, key];
      });
    },
    [setCompletedTaskKeys]
  );

  const setLoad = useCallback((key, val) => {
    setLoading((prev) => ({ ...prev, [key]: val }));
  }, []);

  const addDeadline = useCallback(
    (title, dateIso, courseCode) => {
      const t = (title || '').trim();
      if (!t || !dateIso) return;
      setDeadlines((prev) => {
        const next = [
          ...prev,
          {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
            title: t,
            date: dateIso,
            courseCode: courseCode || '',
          },
        ];
        patchServer({ deadlines: next });
        return next;
      });
    },
    [patchServer]
  );

  const removeDeadline = useCallback(
    (id) => {
      setDeadlines((prev) => {
        const next = prev.filter((d) => d.id !== id);
        patchServer({ deadlines: next });
        return next;
      });
    },
    [patchServer]
  );

  const setCourseSetupDraft = useCallback(
    (draft) => {
      setCourseSetupDraftState(draft);
      patchServer({ courseSetupDraft: draft });
    },
    [patchServer]
  );

  const clearCourseSetupDraft = useCallback(() => {
    setCourseSetupDraftState(null);
    patchServer({ courseSetupDraft: null });
  }, [patchServer]);

  const generatePlan = useCallback(async (payload) => {
    setLoad('plan', true);
    setError(null);
    try {
      const data = await apiPost('/api/plans/generate', payload);
      if (data.userState) {
        syncFromServer(data.userState);
      } else {
        const s = await apiGet('/api/user-state');
        syncFromServer(s);
      }
      return data.plan;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoad('plan', false);
    }
  }, [setLoad, syncFromServer]);

  const logProgress = useCallback(
    async (payload) => {
      setLoad('progress', true);
      setError(null);
      try {
        const data = await apiPost('/api/progress/log', payload);
        if (Array.isArray(data.progressLogs)) {
          setProgressLogs(data.progressLogs);
        }
        return data;
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setLoad('progress', false);
      }
    },
    [setLoad]
  );

  const submitCheckin = useCallback(async (payload) => {
    setLoad('group', true);
    setError(null);
    try {
      const data = await apiPost('/api/groups/checkin', payload);
      setGroupResult(data);
      if (data.userState) syncFromServer(data.userState);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoad('group', false);
    }
  }, [setLoad, syncFromServer]);

  const fetchAi = useCallback(async (payload) => {
    setLoad('ai', true);
    setError(null);
    try {
      const data = await apiPost('/api/ai/recommend', payload);
      setAiResult(data);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoad('ai', false);
    }
  }, [setLoad]);

  const applyAiSuggestions = useCallback(
    async (suggestions) => {
      if (!Array.isArray(suggestions) || suggestions.length === 0 || !plan) return 0;
      const existing = Array.isArray(plan.sample_tasks) ? [...plan.sample_tasks] : [];
      const planCourses = ((plan.input_received && plan.input_received.courses) || [])
        .map((c) => ({
          courseName: String((c && c.name) || '').trim(),
          courseCode: String(((c && c.name) || '').split(' ')[0] || '').slice(0, 6),
        }))
        .filter((c) => c.courseName);
      const catalog = [
        ...planCourses,
        ...existing.map((t) => ({
          courseName: String(t.courseName || '').trim(),
          courseCode: String(t.courseCode || '').trim(),
        })),
      ].filter((c) => c.courseName || c.courseCode);

      const resolveCanonicalCourse = (rawName, rawCode) => {
        const name = String(rawName || '').trim();
        const code = String(rawCode || '').trim();
        const nameKey = normalizeCourseKey(name);
        const codeKey = normalizeCourseKey(code);
        let best = null;
        let bestScore = -1;
        for (const c of catalog) {
          const cName = String(c.courseName || '');
          const cCode = String(c.courseCode || '');
          const cNameKey = normalizeCourseKey(cName);
          const cCodeKey = normalizeCourseKey(cCode);
          let score = 0;
          if (nameKey && cNameKey && (nameKey === cNameKey || nameKey.includes(cNameKey) || cNameKey.includes(nameKey))) score += 6;
          if (codeKey && cCodeKey && (codeKey === cCodeKey || codeKey.includes(cCodeKey) || cCodeKey.includes(codeKey))) score += 6;
          score += tokenOverlapScore(name, cName);
          if (score > bestScore) {
            bestScore = score;
            best = c;
          }
        }
        return bestScore > 0 ? best : null;
      };

      const mapped = suggestions.slice(0, 3).map((item, idx) => {
        const rawCourseName = String(item.courseName || '').trim();
        const rawCourseCode = String(item.courseCode || '').trim();
        const canonical = resolveCanonicalCourse(rawCourseName, rawCourseCode);
        const courseName = canonical?.courseName || rawCourseName || `Course ${idx + 1}`;
        const courseCode = canonical?.courseCode || rawCourseCode || courseName.split(' ')[0].slice(0, 6) || `C${idx + 1}`;
        const nearest = nearestDeadlineForCourse(deadlines, courseName, courseCode);
        const isUrgent = nearest && nearest.daysUntil <= 10;
        const isPreDeadlineSession = isUrgent && isDayBeforeDeadline(item.day, nearest.date);
        const deadlineTag = isPreDeadlineSession ? ` [Due in ${nearest.daysUntil}d: ${nearest.title}]` : '';
        const baseTask = isPreDeadlineSession
          ? `${deadlineActionText(nearest.title, nearest.daysUntil)} - ${String(item.task || `AI adjustment - ${courseName}`)}`
          : String(item.task || `AI adjustment - ${courseName}`);
        return {
          day: normalizeDayLabel(item.day),
          startTime: String(item.startTime || '18:00'),
          endTime: String(item.endTime || '19:00'),
          courseCode,
          courseName,
          task: `${baseTask}${deadlineTag}`,
          minutes: Number(item.minutes) > 0 ? Number(item.minutes) : 45,
          priority: isPreDeadlineSession || String(item.priority || 'medium').toLowerCase() === 'high' ? 'high' : 'medium',
        };
      });
      const dedupedMapped = [];
      const mappedSeen = new Set();
      for (const row of mapped) {
        const sig = taskSignature(row);
        if (mappedSeen.has(sig)) continue;
        mappedSeen.add(sig);
        dedupedMapped.push(row);
      }
      const usedIndexes = new Set();
      const existingSigToIndex = new Map();
      for (let i = 0; i < existing.length; i += 1) {
        const sig = taskSignature(existing[i] || {});
        if (!existingSigToIndex.has(sig)) existingSigToIndex.set(sig, i);
      }

      for (const suggestion of dedupedMapped) {
        const suggestionSig = taskSignature(suggestion);
        if (existingSigToIndex.has(suggestionSig)) {
          const idx = existingSigToIndex.get(suggestionSig);
          usedIndexes.add(idx);
          continue;
        }

        const suggestionDay = normalizeDayLabel(suggestion.day);
        const suggestionCourseName = normalizeCourseKey(suggestion.courseName);
        const suggestionCourseCode = normalizeCourseKey(suggestion.courseCode);
        const suggestionStart = timeToMinutes(suggestion.startTime);
        let bestIdx = -1;
        let bestScore = Number.POSITIVE_INFINITY;

        for (let i = 0; i < existing.length; i += 1) {
          if (usedIndexes.has(i)) continue;
          const row = existing[i] || {};
          if (normalizeDayLabel(row.day) !== suggestionDay) continue;

          const rowCourseName = normalizeCourseKey(row.courseName);
          const rowCourseCode = normalizeCourseKey(row.courseCode);
          const sameCourse =
            (suggestionCourseCode && rowCourseCode && suggestionCourseCode === rowCourseCode) ||
            (suggestionCourseName &&
              rowCourseName &&
              (suggestionCourseName === rowCourseName ||
                suggestionCourseName.includes(rowCourseName) ||
                rowCourseName.includes(suggestionCourseName))) ||
            tokenOverlapScore(suggestion.courseName, row.courseName) >= 1;
          if (!sameCourse) continue;

          const rowStart = timeToMinutes(row.startTime);
          const score =
            suggestionStart == null || rowStart == null ? 9999 : Math.abs(rowStart - suggestionStart);
          if (score < bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }

        if (bestIdx >= 0) {
          existing[bestIdx] = suggestion;
          usedIndexes.add(bestIdx);
          existingSigToIndex.set(suggestionSig, bestIdx);
        } else {
          existing.push(suggestion);
          existingSigToIndex.set(suggestionSig, existing.length - 1);
        }
      }

      const nextPlan = { ...plan, sample_tasks: existing };
      setPlan(nextPlan);
      await patchServer({ plan: nextPlan });
      return dedupedMapped.length;
    },
    [plan, patchServer, deadlines]
  );

  const value = useMemo(
    () => ({
      plan,
      setPlan,
      courseSetupDraft,
      setCourseSetupDraft,
      clearCourseSetupDraft,
      progressLogs,
      groupResult,
      aiResult,
      loading,
      error,
      setError,
      deadlines,
      addDeadline,
      removeDeadline,
      profile,
      setProfile,
      studyGroups,
      setStudyGroups,
      createStudyGroup,
      joinStudyGroup,
      groupData,
      patchGroupData,
      setGroupWeeklyGoal,
      setGroupMilestones,
      appendGroupCheckin,
      completedTaskKeys,
      taskKey,
      toggleTaskComplete,
      generatePlan,
      logProgress,
      submitCheckin,
      fetchAi,
      applyAiSuggestions,
      appDataReady,
    }),
    [
      plan,
      courseSetupDraft,
      setCourseSetupDraft,
      clearCourseSetupDraft,
      progressLogs,
      groupResult,
      aiResult,
      loading,
      error,
      deadlines,
      addDeadline,
      removeDeadline,
      profile,
      setProfile,
      studyGroups,
      setStudyGroups,
      createStudyGroup,
      joinStudyGroup,
      groupData,
      patchGroupData,
      setGroupWeeklyGoal,
      setGroupMilestones,
      appendGroupCheckin,
      completedTaskKeys,
      taskKey,
      toggleTaskComplete,
      generatePlan,
      logProgress,
      submitCheckin,
      fetchAi,
      applyAiSuggestions,
      appDataReady,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return ctx;
}
