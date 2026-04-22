import React, { useState, useMemo, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';

const MILESTONE_DEFS = [
  { id: 'm1', label: 'Kickoff: align on weekly goals' },
  { id: 'm2', label: 'Mid-check: share progress & blockers' },
  { id: 'm3', label: 'Wrap-up: review outcomes before exams' },
];

function formatCheckinTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const StudyGroups = () => {
  const {
    submitCheckin,
    groupResult,
    loading,
    error,
    setError,
    studyGroups,
    createStudyGroup,
    joinStudyGroup,
    groupData,
    setGroupWeeklyGoal,
    setGroupMilestones,
  } = useAppData();

  const [selectedId, setSelectedId] = useState(() => studyGroups[0]?.id ?? '');
  const [comment, setComment] = useState('');
  const [localErr, setLocalErr] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [subTab, setSubTab] = useState('Overview');

  const [weeklyGoal, setWeeklyGoal] = useState('');
  const [goalNotice, setGoalNotice] = useState('');
  const [milestoneChecks, setMilestoneChecks] = useState({});
  const [milestoneNotice, setMilestoneNotice] = useState('');

  const [placeholderModal, setPlaceholderModal] = useState(null);

  const selected = useMemo(
    () => studyGroups.find((g) => g.id === selectedId) ?? studyGroups[0],
    [studyGroups, selectedId]
  );

  const savedForGroup = useMemo(() => {
    if (!selected?.id) return null;
    return groupData[selected.id] || {};
  }, [groupData, selected?.id]);

  useEffect(() => {
    if (!studyGroups.find((g) => g.id === selectedId) && studyGroups[0]) {
      setSelectedId(studyGroups[0].id);
    }
  }, [studyGroups, selectedId]);

  useEffect(() => {
    if (!selected?.id) return;
    const g = groupData[selected.id];
    setWeeklyGoal(g?.weeklyGoal || '');
    setMilestoneChecks(g?.milestones && typeof g.milestones === 'object' ? g.milestones : {});
    setGoalNotice('');
    setMilestoneNotice('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset form when switching group
  }, [selected?.id]);

  const onCheckIn = async (e) => {
    e.preventDefault();
    setLocalErr(null);
    setError(null);
    const text = comment.trim() || 'Weekly check-in';
    try {
      await submitCheckin({
        weekly_goal_done: true,
        group_id: selected?.id,
        comment: text,
      });
      setComment('');
    } catch {
      /* surfaced via error */
    }
  };

  const saveGoal = (e) => {
    e.preventDefault();
    if (!selected?.id) return;
    setGroupWeeklyGoal(selected.id, weeklyGoal.trim());
    setGoalNotice('Goal saved for this group. It shows on Overview and stays after refresh.');
  };

  const toggleMilestone = (id) => {
    setMilestoneChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const saveMilestones = () => {
    if (!selected?.id) return;
    setGroupMilestones(selected.id, milestoneChecks);
    const n = MILESTONE_DEFS.filter((m) => milestoneChecks[m.id]).length;
    setMilestoneNotice(
      `Saved ${n} of ${MILESTONE_DEFS.length} milestones for this group. Same data can be moved to the FastAPI monolith with a small groups API later.`
    );
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const g = createStudyGroup({ name: newName, description: newDesc });
    if (g) {
      setSelectedId(g.id);
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const ok = joinStudyGroup(inviteCode);
    if (ok) {
      setJoinOpen(false);
      setInviteCode('');
    }
  };

  const savedComment = groupResult?.checkin?.comment;
  const checkins = savedForGroup?.checkins || [];
  const savedGoalText = (savedForGroup?.weeklyGoal || '').trim();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Collaborative learning</p>
          <h2 className="text-2xl font-bold text-gray-900">Study groups</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Goals, milestones, and check-ins below are stored in your browser per group. Check-ins also call your existing
            monolith endpoint; we can add dedicated group routes in the same FastAPI app when you are ready.
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
            Placeholder: this demo simulates groups for a single user. In production, other students would use the app and you
            could create real shared study groups with them. For now, create or join a group to explore the full group workflow.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-800 font-semibold text-sm hover:bg-gray-50"
          >
            Join a group
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-100"
          >
            + Create group
          </button>
        </div>
      </header>

      {(error || localErr) && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error || localErr}</div>
      )}

      {groupResult && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-900">
          Check-in saved{savedComment ? `: "${savedComment}"` : '.'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">My groups</p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {studyGroups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedId(g.id)}
                className={`w-full text-left px-4 py-4 transition-colors ${
                  selectedId === g.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
              >
                <p className="font-semibold text-gray-900 truncate">{g.shortName || g.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {g.memberCount} members · Milestone {g.milestonePct}%
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${g.milestonePct}%` }} />
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-700"
          >
            + Join a group
          </button>
        </div>

        <div className="lg:col-span-8">
          {selected ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center shrink-0">
                    {(selected.shortName || selected.name).slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selected.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selected.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Next: <span className="font-medium text-gray-700">{selected.nextMeeting || 'TBD'}</span> ·{' '}
                      {selected.memberCount} members
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPlaceholderModal('chat')}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaceholderModal('invite')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                  >
                    Invite
                  </button>
                </div>
              </div>

              <div className="px-6 pt-4 border-b border-gray-100 flex gap-4">
                {['Overview', 'Goals', 'Milestones'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSubTab(t)}
                    className={`pb-3 text-sm font-semibold border-b-2 -mb-px ${
                      subTab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {subTab === 'Overview' && (
                  <>
                    {savedGoalText ? (
                      <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
                        <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1">This week&apos;s goal</p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{savedGoalText}</p>
                      </div>
                    ) : null}

                    <h4 className="font-bold text-gray-900 mb-4">Weekly check-in status</h4>
                    <ul className="space-y-4 mb-8">
                      {selected.members.map((m) => (
                        <li
                          key={m.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-gray-100 rounded-xl p-4"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {m.name}
                              {m.role ? (
                                <span className="text-xs font-normal text-gray-500 ml-2">({m.role})</span>
                              ) : null}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{m.goal}</p>
                            {m.progress ? <p className="text-xs text-gray-400 mt-1">{m.progress}</p> : null}
                          </div>
                          <div className="shrink-0">
                            {m.status === 'checked_in' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                                ✓ Checked in
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                                ○ Pending
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {checkins.length > 0 ? (
                      <div className="mb-8">
                        <h4 className="font-bold text-gray-900 mb-3">Your check-ins (saved)</h4>
                        <ul className="space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50/80 max-h-56 overflow-y-auto">
                          {[...checkins].reverse().map((c, idx) => (
                            <li key={`${c.savedAt}-${idx}`} className="text-sm border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                              <p className="text-gray-900">{c.comment}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatCheckinTime(c.savedAt)}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="rounded-2xl bg-indigo-50/80 border border-indigo-100 p-5">
                      <p className="text-sm font-semibold text-indigo-950 mb-2">Weekly check-in prompt</p>
                      <p className="text-xs text-gray-600 mb-3">
                        Submitting sends a request to the monolith check-in route and appends a line to the list above.
                      </p>
                      <form onSubmit={onCheckIn} className="space-y-3">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="e.g. Finished 3/5 DP problems, stuck on coin change"
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-gray-900 text-sm bg-white"
                        />
                        <button
                          type="submit"
                          disabled={loading.group}
                          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {loading.group ? 'Submitting...' : 'Submit check-in'}
                        </button>
                      </form>
                    </div>
                  </>
                )}

                {subTab === 'Goals' && (
                  <div className="max-w-lg">
                    {savedGoalText ? (
                      <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Saved goal (also on Overview)</p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{savedGoalText}</p>
                      </div>
                    ) : null}
                    <p className="text-sm text-gray-600 mb-4">
                      Edit the group goal for this week. Stored in your browser for this group until you change it.
                    </p>
                    <form onSubmit={saveGoal} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-1">This week&apos;s group goal</label>
                        <textarea
                          value={weeklyGoal}
                          onChange={(e) => setWeeklyGoal(e.target.value)}
                          placeholder="e.g. Finish DP chapter, 5 practice problems each"
                          rows={4}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700"
                      >
                        Save goal
                      </button>
                    </form>
                    {goalNotice ? (
                      <p className="mt-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                        {goalNotice}
                      </p>
                    ) : null}
                  </div>
                )}

                {subTab === 'Milestones' && (
                  <div className="max-w-lg">
                    <p className="text-sm text-gray-600 mb-4">
                      Check off milestones as your group completes them, then save. Values are stored in your browser per
                      group. You can later expose the same fields through the FastAPI monolith (for example{' '}
                      <code className="text-xs bg-gray-100 px-1 rounded">POST /api/groups/{'{id}'}/milestones</code>) without
                      changing the UI much.
                    </p>
                    <ul className="space-y-3 mb-6">
                      {MILESTONE_DEFS.map((m) => (
                        <li key={m.id} className="flex items-start gap-3 border border-gray-100 rounded-xl p-4">
                          <input
                            type="checkbox"
                            id={m.id}
                            checked={!!milestoneChecks[m.id]}
                            onChange={() => toggleMilestone(m.id)}
                            className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor={m.id} className="text-sm text-gray-800 cursor-pointer">
                            {m.label}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={saveMilestones}
                      className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700"
                    >
                      Save milestones
                    </button>
                    {milestoneNotice ? (
                      <p className="mt-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                        {milestoneNotice}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No groups yet. Create one or join with a code.</p>
          )}
        </div>
      </div>

      {placeholderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          onClick={() => setPlaceholderModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900">
              {placeholderModal === 'chat' ? 'Group chat' : 'Invite people'}
            </h3>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              {placeholderModal === 'chat'
                ? 'In a production app, this would open real-time chat (or a link to Slack or Discord) tied to this group, with message history and notifications.'
                : 'In production, you would invite classmates by email or share a join link with an expiry. Invites would be limited to your school or invited emails.'}
            </p>
            <p className="text-sm text-gray-500 mt-3">This demo only includes the UI shell: no messaging or invite backend yet.</p>
            <button
              type="button"
              onClick={() => setPlaceholderModal(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-gray-100 text-gray-800 font-semibold text-sm hover:bg-gray-200"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900">Create study group</h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
                  placeholder="CS301 Algo Squad"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
                  rows={3}
                  placeholder="What will you work on together?"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-xl text-gray-600 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {joinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900">Join with invite code</h3>
            <p className="text-sm text-gray-500 mt-1">Enter any code in the demo to add a sample group.</p>
            <form onSubmit={handleJoin} className="mt-4 space-y-3">
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
                placeholder="Invite code"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setJoinOpen(false)} className="px-4 py-2 rounded-xl text-gray-600 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold">
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGroups;
