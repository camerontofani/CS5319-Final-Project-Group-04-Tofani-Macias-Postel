import React, { useState } from 'react';

const AIRecommendations = () => {
  const [decision, setDecision] = useState('Pending');
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(
    'Move CS316 File Systems review from Saturday to Thursday to avoid burnout.'
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">AI Recommendations</h2>
        <p className="text-gray-500">Personalized suggestions based on your recent activity and confidence trends.</p>
      </header>

      {/* Keep your original Stats Grid at the top - it looks great! */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs uppercase text-gray-500 font-semibold">Weekly Priority</p>
          <p className="text-xl font-bold text-gray-800 mt-2">Algorithm Mastery</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs uppercase text-gray-500 font-semibold">Estimated Improvement</p>
          <p className="text-xl font-bold text-green-600 mt-2">+14% Confidence</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs uppercase text-gray-500 font-semibold">Suggested Sessions</p>
          <p className="text-xl font-bold text-gray-800 mt-2">5 Sessions</p>
        </div>
      </div>

      {/* NEW: The interactive Adjustment Panel (Required by Proposal Screen F) */}
      <div className="bg-indigo-900 text-white p-8 rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold mb-2">Smart Adjustment Suggestion</h3>
        <p className="text-indigo-200 text-sm mb-6 italic">
          "I've noticed a gap in Dynamic Programming. Let's redistribute your workload."
        </p>
        
        <div className="space-y-3 mb-8">
          <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-sm">
            {editedPlan}
          </div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-sm">
            Add a 30-minute Practice Block for Recursion on Wednesday.
          </div>
        </div>

        {isEditing && (
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wide text-indigo-200 font-semibold mb-2">
              Edit Suggestion
            </label>
            <textarea
              value={editedPlan}
              onChange={(e) => setEditedPlan(e.target.value)}
              className="w-full min-h-24 rounded-xl bg-white text-gray-800 p-3 text-sm outline-none"
            />
            <button
              onClick={() => setIsEditing(false)}
              className="mt-3 bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
            >
              Save Edit
            </button>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => setDecision('Accepted')}
            className="flex-1 bg-white text-indigo-900 font-bold py-3 rounded-xl hover:bg-indigo-50"
          >
            Accept
          </button>
          <button
            onClick={() => {
              setDecision('Edited');
              setIsEditing(true);
            }}
            className="flex-1 bg-indigo-700 text-white font-bold py-3 rounded-xl border border-indigo-500"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setDecision('Rejected');
              setIsEditing(false);
            }}
            className="px-4 py-3 text-indigo-300"
          >
            Reject
          </button>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-indigo-200">
          Current status: {decision}
        </p>
      </div>

      {/* NEW: Practice Prompts (Required by Proposal Screen F) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-widest">AI Generated Practice Prompt</h3>
        <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-indigo-500 italic text-gray-700">
          "What is the difference between an inode and a directory entry in a Unix file system?"
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;