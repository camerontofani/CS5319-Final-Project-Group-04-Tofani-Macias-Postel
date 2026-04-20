import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { apiPost } from '../api/client';

const AppDataContext = createContext(null);

const initialLoading = { plan: false, progress: false, group: false, ai: false };

function profileKey(uid) {
  return `smartstudy.profile.v1.${uid}`;
}
function groupsKey(uid) {
  return `smartstudy.groups.v1.${uid}`;
}
function tasksKey(uid) {
  return `smartstudy.completedTasks.v1.${uid}`;
}
function planKey(uid) {
  return `smartstudy.plan.v1.${uid}`;
}
function courseSetupDraftKey(uid) {
  return `smartstudy.courseSetupDraft.v1.${uid}`;
}
function progressLogsKey(uid) {
  return `smartstudy.progressLogs.v1.${uid}`;
}
function deadlinesKey(uid) {
  return `smartstudy.deadlines.v1.${uid}`;
}
function groupDataKey(uid) {
  return `smartstudy.groupData.v1.${uid}`;
}

function emptyGroupEntry() {
  return { weeklyGoal: '', milestones: {}, checkins: [] };
}

function loadGroupData(uid) {
  if (uid == null) return {};
  try {
    const raw = localStorage.getItem(groupDataKey(uid));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

function defaultGroups(uid) {
  return [
    {
      id: `${uid}-g1`,
      name: 'CS301 Algo Squad',
      shortName: 'CS301',
      memberCount: 4,
      milestonePct: 60,
      description: 'Cracking algorithms together before finals',
      nextMeeting: 'Thu, Mar 5 · 7pm',
      members: [
        {
          id: 'm1',
          name: 'You',
          role: 'You',
          goal: 'Finish DP chapter + 5 practice problems',
          progress: '2/5',
          status: 'checked_in',
        },
        {
          id: 'm2',
          name: 'Maya Patel',
          goal: 'Review binary tree problems',
          progress: '3/3',
          status: 'checked_in',
        },
        { id: 'm3', name: 'Jake Lee', goal: 'Goal not shared', progress: '', status: 'pending' },
        {
          id: 'm4',
          name: 'Sofia Chen',
          role: 'Organizer',
          goal: 'Graph traversal + BFS/DFS',
          progress: '1/4',
          status: 'checked_in',
        },
      ],
    },
    {
      id: `${uid}-g2`,
      name: 'OS Study Circle',
      shortName: 'OS',
      memberCount: 3,
      milestonePct: 40,
      description: 'Operating systems deep dives',
      nextMeeting: 'Wed, Mar 4 · 6pm',
      members: [
        { id: 'o1', name: 'You', role: 'You', goal: 'Read paging chapter', progress: '1/2', status: 'checked_in' },
        { id: 'o2', name: 'Sam Rivera', goal: 'Scheduling problems', progress: '0/3', status: 'pending' },
      ],
    },
    {
      id: `${uid}-g3`,
      name: 'Database Design',
      shortName: 'DB',
      memberCount: 2,
      milestonePct: 75,
      description: 'Normalization and SQL',
      nextMeeting: 'Sat, Mar 7 · 10am',
      members: [
        { id: 'd1', name: 'You', role: 'You', goal: 'Transactions & ACID quiz', progress: '2/4', status: 'checked_in' },
        { id: 'd2', name: 'Priya N.', goal: 'ER diagrams', progress: '1/1', status: 'checked_in' },
      ],
    },
  ];
}

function loadProfile(uid) {
  if (uid == null) return { displayName: '', major: '', year: '' };
  try {
    const raw = localStorage.getItem(profileKey(uid));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { displayName: '', major: '', year: '' };
}

function loadGroups(uid) {
  if (uid == null) return [];
  try {
    const raw = localStorage.getItem(groupsKey(uid));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return defaultGroups(uid);
}

function loadCompleted(uid) {
  if (uid == null) return [];
  try {
    const raw = localStorage.getItem(tasksKey(uid));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

function loadPlan(uid) {
  if (uid == null) return null;
  try {
    const raw = localStorage.getItem(planKey(uid));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

function loadCourseSetupDraft(uid) {
  if (uid == null) return null;
  try {
    const raw = localStorage.getItem(courseSetupDraftKey(uid));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

function loadProgressLogs(uid) {
  if (uid == null) return [];
  try {
    const raw = localStorage.getItem(progressLogsKey(uid));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

function loadDeadlines(uid) {
  if (uid == null) return [];
  try {
    const raw = localStorage.getItem(deadlinesKey(uid));
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function AppDataProvider({ children, userId }) {
  const [plan, setPlan] = useState(() => loadPlan(userId));
  const [courseSetupDraft, setCourseSetupDraftState] = useState(() => loadCourseSetupDraft(userId));
  const [progressLogs, setProgressLogs] = useState(() => loadProgressLogs(userId));
  const [groupResult, setGroupResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(null);
  const [deadlines, setDeadlines] = useState(() => loadDeadlines(userId));
  const [profile, setProfileState] = useState(() => loadProfile(userId));
  const [studyGroups, setStudyGroupsState] = useState(() => loadGroups(userId));
  const [completedTaskKeys, setCompletedTaskKeysState] = useState(() => loadCompleted(userId));
  const [groupData, setGroupDataState] = useState(() => loadGroupData(userId));

  useEffect(() => {
    setProfileState(loadProfile(userId));
    setStudyGroupsState(loadGroups(userId));
    setCompletedTaskKeysState(loadCompleted(userId));
    setPlan(loadPlan(userId));
    setCourseSetupDraftState(loadCourseSetupDraft(userId));
    setProgressLogs(loadProgressLogs(userId));
    setDeadlines(loadDeadlines(userId));
    setGroupDataState(loadGroupData(userId));
    setGroupResult(null);
    setAiResult(null);
  }, [userId]);

  const patchGroupData = useCallback(
    (groupId, partial) => {
      if (!groupId) return;
      setGroupDataState((prev) => {
        const cur = { ...emptyGroupEntry(), ...prev[groupId] };
        const nextEntry = { ...cur, ...partial };
        const next = { ...prev, [groupId]: nextEntry };
        if (userId != null) localStorage.setItem(groupDataKey(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId]
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
        const checkins = [...(cur.checkins || []), { comment: comment || '(empty)', savedAt: new Date().toISOString() }];
        const next = { ...prev, [groupId]: { ...cur, checkins } };
        if (userId != null) localStorage.setItem(groupDataKey(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId]
  );

  const setProfile = useCallback(
    (patch) => {
      setProfileState((prev) => {
        const next = { ...prev, ...patch };
        if (userId != null) localStorage.setItem(profileKey(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId]
  );

  const setStudyGroups = useCallback(
    (updater) => {
      setStudyGroupsState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (userId != null) localStorage.setItem(groupsKey(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId]
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
        if (userId != null) localStorage.setItem(tasksKey(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId]
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

  const addDeadline = useCallback((title, dateIso, courseCode) => {
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
      if (userId != null) localStorage.setItem(deadlinesKey(userId), JSON.stringify(next));
      return next;
    });
  }, [userId]);

  const removeDeadline = useCallback(
    (id) => {
      setDeadlines((prev) => {
        const next = prev.filter((d) => d.id !== id);
        if (userId != null) localStorage.setItem(deadlinesKey(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId]
  );

  const setCourseSetupDraft = useCallback(
    (draft) => {
      setCourseSetupDraftState(draft);
      if (userId == null) return;
      if (draft == null) localStorage.removeItem(courseSetupDraftKey(userId));
      else localStorage.setItem(courseSetupDraftKey(userId), JSON.stringify(draft));
    },
    [userId]
  );

  const clearCourseSetupDraft = useCallback(() => {
    setCourseSetupDraftState(null);
    if (userId != null) localStorage.removeItem(courseSetupDraftKey(userId));
  }, [userId]);

  const generatePlan = useCallback(async (payload) => {
    setLoad('plan', true);
    setError(null);
    try {
      const data = await apiPost('/api/plans/generate', payload);
      setPlan(data);
      if (userId != null) localStorage.setItem(planKey(userId), JSON.stringify(data));
      clearCourseSetupDraft();
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoad('plan', false);
    }
  }, [setLoad, userId, clearCourseSetupDraft]);

  const logProgress = useCallback(async (payload) => {
    setLoad('progress', true);
    setError(null);
    try {
      const data = await apiPost('/api/progress/log', payload);
      const entry = data?.entry_saved ?? payload;
      const row = {
        ...entry,
        loggedAt: new Date().toISOString(),
      };
      setProgressLogs((prev) => {
        const next = [...prev, row];
        if (userId != null) localStorage.setItem(progressLogsKey(userId), JSON.stringify(next));
        return next;
      });
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoad('progress', false);
    }
  }, [setLoad, userId]);

  const submitCheckin = useCallback(async (payload) => {
    setLoad('group', true);
    setError(null);
    try {
      const data = await apiPost('/api/groups/checkin', payload);
      setGroupResult(data);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoad('group', false);
    }
  }, [setLoad]);

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
