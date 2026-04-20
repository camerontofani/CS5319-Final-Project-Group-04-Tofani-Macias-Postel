import React, { useState, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';

function topicFromPlan(plan, courseSetupDraft) {
  const prefs = courseSetupDraft ?? plan?.input_received;
  const list = prefs?.courses?.map((c) => c.name).filter(Boolean) ?? [];
  return list.length ? list.join(', ') : 'your plan';
}

const AIRecommendations = () => {
  const { fetchAi, aiResult, loading, plan, courseSetupDraft } = useAppData();
  const aiLoading = loading.ai;
  const [decision, setDecision] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

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
            onClick={() => setDecision('accepted')}
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
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-widest text-gray-500">Practice idea</h3>
        <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-indigo-500 text-gray-800 leading-relaxed">
          {aiResult?.recommendation ? `Try: ${aiResult.recommendation}` : 'Log progress and refresh for a tailored prompt.'}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
