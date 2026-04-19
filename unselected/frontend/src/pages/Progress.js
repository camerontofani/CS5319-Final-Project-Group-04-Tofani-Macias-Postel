import React from 'react';

const Progress = () => {
  const stats = [
    { label: 'Total Hours', value: '45.5h', change: '+12%', icon: '⏱️' },
    { label: 'Avg. Confidence', value: '60%', change: '-5%', icon: '📈' },
    { label: 'Low Confidence', value: '4 topics', change: 'Action Required', icon: '⚠️' },
    { label: 'Tasks Completed', value: '34/48', change: 'On Track', icon: '✅' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">Progress Tracking</h2>
        <p className="text-gray-500">Visualizing your academic growth and identifying gaps.</p>
      </header>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-gray-500 text-xs font-semibold uppercase">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className={`text-[10px] font-bold mt-1 ${stat.change.includes('+') ? 'text-green-500' : 'text-orange-500'}`}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Study Hours Placeholder */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-64 flex flex-col justify-center items-center">
          <h3 className="font-bold text-gray-800 mb-auto w-full">Study Hours Per Week</h3>
          <div className="w-full h-32 bg-indigo-50 rounded-lg border-b-4 border-indigo-600 flex items-end justify-around px-4">
            {[40, 70, 45, 90, 65].map((h, i) => (
              <div key={i} className="w-8 bg-indigo-400 rounded-t" style={{ height: `${h}%` }}></div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400 font-medium">Last 5 Weeks Activity</p>
        </div>

        {/* Topic Confidence Summary */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Topic Confidence Summary</h3>
          <div className="space-y-4">
            {[
              { topic: 'Binary Trees', level: 85, color: 'bg-green-500' },
              { topic: 'Graph Traversal', level: 72, color: 'bg-indigo-500' },
              { topic: 'Dynamic Programming', level: 35, color: 'bg-red-500' },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>{item.topic}</span>
                  <span>{item.level}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full">
                  <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.level}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;