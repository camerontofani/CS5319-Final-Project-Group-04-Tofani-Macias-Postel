import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { apiGet, apiPost, apiPatch } from '../api/client';

const AppDataContext = createContext(null);

const initialLoading = { plan: false, progress: false, group: false, ai: false };

const emptyProfile = { displayName: '', major: '', year: '' };

function emptyGroupEntry() {
  return { weeklyGoal: '', milestones: {}, checkins: [] };
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

  const syncFromServer = useCallback((s) => {
    if (!s) return;
    setPlan(s.plan ?? null);
    setCourseSetupDraftState(s.courseSetupDraft ?? null);
    setProgressLogs(Array.isArray(s.progressLogs) ? s.progressLogs : []);
    setDeadlines(Array.isArray(s.deadlines) ? s.deadlines : []);
    setProfileState(s.profile && typeof s.profile === 'object' ? { ...emptyProfile, ...s.profile } : emptyProfile);
    setStudyGroupsState(Array.isArray(s.studyGroups) ? s.studyGroups : []);
    setCompletedTaskKeysState(Array.isArray(s.completedTaskKeys) ? s.completedTaskKeys : []);
    setGroupDataState(s.groupData && typeof s.groupData === 'object' ? s.groupData : {});
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

  const patchServer = useCallback(
    async (partial) => {
      if (userId == null) return;
      try {
        const s = await apiPatch('/api/user-state', partial);
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
    },
    [userId, syncFromServer]
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
