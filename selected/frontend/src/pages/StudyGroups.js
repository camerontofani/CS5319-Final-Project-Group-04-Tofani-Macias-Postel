import React from 'react';

const StudyGroups = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Study Groups</h2>
        <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700">+ Create Group</button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          {['CS301 Algo Squad', 'OS Study Club', 'Database Divas'].map((group, i) => (
            <div key={i} className={`p-4 rounded-2xl border cursor-pointer transition-all ${i === 0 ? 'bg-white border-indigo-500 shadow-md' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">{group.substring(0,2)}</div>
                <p className="font-bold text-gray-800 text-sm">{group}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Weekly Check-in Status</h3>
          <div className="space-y-6">
            {[
              { name: 'Alex Johnson', status: 'Checked In', time: '2h ago' },
              { name: 'Maya Patel', status: 'Checked In', time: '5h ago' },
              { name: 'Jake Lee', status: 'Pending', time: '-' },
              { name: 'Sofia Chen', status: 'Checked In', time: '10m ago' },
            ].map((member, i) => (
              <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                  <p className="font-medium text-gray-800">{member.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">{member.time}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${member.status === 'Checked In' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-10 p-6 bg-indigo-50 rounded-2xl">
            <p className="font-bold text-indigo-900 mb-2">Weekly Check-in Prompt</p>
            <p className="text-sm text-indigo-700 mb-4">Have you completed this week's goals? Share a quick update with your group.</p>
            <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">Submit Check-In</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyGroups;