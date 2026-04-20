import React, { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useAppData } from '../context/AppDataContext';

function initialsFromEmail(email) {
  if (!email) return '?';
  const local = email.split('@')[0] || email;
  const parts = local.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

function displayNameFallback(email, profile) {
  const p = (profile?.displayName || '').trim();
  if (p) return p;
  if (!email) return 'Student';
  const local = email.split('@')[0] || '';
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

const Sidebar = ({ currentScreen, setCurrentScreen }) => {
  const { user, logout } = useAuth();
  const { profile, setProfile } = useAppData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ displayName: '', major: '', year: '' });

  const name = useMemo(() => displayNameFallback(user?.email, profile), [user?.email, profile]);
  const major = (profile.major || '').trim() || 'Your major';
  const year = (profile.year || '').trim() || 'Year';

  const menuItems = [
    { name: 'Study Plan', id: 'Study Plan' },
    { name: 'Progress', id: 'Progress' },
    { name: 'Study Groups', id: 'Study Groups' },
    { name: 'AI Recommendations', id: 'AI Recommendations' },
    { name: 'Course Setup', id: 'Course Setup' },
  ];

  const openEdit = () => {
    setDraft({
      displayName: profile.displayName || name,
      major: profile.major || '',
      year: profile.year || '',
    });
    setEditing(true);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    setProfile({
      displayName: draft.displayName.trim(),
      major: draft.major.trim(),
      year: draft.year.trim(),
    });
    setEditing(false);
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col p-6 fixed left-0 top-0 z-10">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
          <span className="text-lg" aria-hidden>
            📘
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">SmartStudy</h1>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initialsFromEmail(user?.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">
              {major}, {year}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openEdit}
          className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          Edit profile
        </button>
        {editing && (
          <form onSubmit={saveEdit} className="mt-3 space-y-2 border-t border-gray-200 pt-3">
            <input
              value={draft.displayName}
              onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
              placeholder="Name"
              className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200"
            />
            <input
              value={draft.major}
              onChange={(e) => setDraft((d) => ({ ...d, major: e.target.value }))}
              placeholder="Major"
              className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200"
            />
            <input
              value={draft.year}
              onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value }))}
              placeholder="e.g. Y3"
              className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded-lg font-medium">
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 bg-gray-100 text-gray-700 text-xs py-1.5 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCurrentScreen(item.id)}
            className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-between ${
              currentScreen === item.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{item.name}</span>
            {currentScreen === item.id && <span aria-hidden>→</span>}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-100 space-y-1">
        <p className="px-4 text-[11px] text-gray-400 leading-snug">
          Backend: microservices (API Gateway → services)
        </p>
        <button
          type="button"
          className="w-full text-left px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm flex items-center justify-between"
        >
          <span>Notifications</span>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">3</span>
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-full text-left px-4 py-2.5 rounded-xl text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
