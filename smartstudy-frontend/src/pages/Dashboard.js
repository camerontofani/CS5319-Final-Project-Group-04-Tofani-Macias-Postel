import React from 'react';

const Dashboard = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Study Plan Dashboard</h2>
          <p className="text-gray-500">Welcome back! Here is your plan for today.</p>
        </div>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
          <span>✨</span> Request AI Adjustment
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section: Weekly View & Tasks */}
        <div className="lg:col-span-2 space-y-8">
          {/* Weekly calendar view for proposal requirement */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Weekly Calendar</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { day: 'Mon', slot: 'DP Practice • 6:00 PM' },
                { day: 'Tue', slot: 'Quiz Review • 7:00 PM' },
                { day: 'Wed', slot: 'Group Session • 5:30 PM' },
                { day: 'Thu', slot: 'OS Notes • 6:30 PM' },
                { day: 'Fri', slot: 'Mock Test • 4:30 PM' },
              ].map((item) => (
                <div key={item.day} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-bold uppercase text-gray-500">{item.day}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-2">{item.slot}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar per wireframe */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Weekly Completion</span>
              <span className="text-sm font-bold text-indigo-600">65%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Today's Tasks</h3>
            <div className="space-y-3">
              {[
                { task: 'Memory Management Review', course: 'CS301', time: '45m' },
                { task: 'Dynamic Programming Practice', course: 'CS301', time: '1h 20m' },
                { task: 'Normalization (1NF-3NF)', course: 'CS301', time: '30m' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-indigo-50/50 transition-colors group">
                  <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-gray-800">{item.task}</p>
                    <p className="text-xs text-gray-500">{item.course} • Estimated {item.time}</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-600 uppercase">High Priority</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Section: Deadlines */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Upcoming Deadlines</h3>
            <div className="space-y-4">
              {[
                { event: 'Midterm Exam', date: 'Apr 16', color: 'bg-red-500' },
                { event: 'Assignment #3', date: 'Mar 24', color: 'bg-orange-500' },
                { event: 'Project Milestone #2', date: 'May 02', color: 'bg-green-500' }
              ].map((deadline, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{deadline.event}</p>
                    <p className="text-[10px] text-gray-400 uppercase">CS5319</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">{deadline.date}</p>
                    <div className={`h-1 w-full rounded-full ${deadline.color} mt-1`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;