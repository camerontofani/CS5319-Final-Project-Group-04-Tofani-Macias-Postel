import React from 'react';

const Sidebar = ({ currentScreen, setCurrentScreen }) => {
  const menuItems = [
    { name: 'Study Plan', id: 'Study Plan' },
    { name: 'Progress', id: 'Progress' },
    { name: 'Study Groups', id: 'Study Groups' },
    { name: 'AI Recommendations', id: 'AI Recommendations' },
    { name: 'Course Setup', id: 'Course Setup' },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col p-6 fixed left-0 top-0">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
        <h1 className="text-xl font-bold text-gray-800">SmartStudy</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentScreen(item.id)}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              currentScreen === item.id 
                ? 'bg-indigo-50 text-indigo-600' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            {item.name}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">JM</div>
          <div className="text-sm">
            <p className="font-semibold text-gray-800 text-xs">Jocelin Macias</p>
            <p className="text-gray-500 text-[10px]">Front-end Lead</p>
          </div>
        </div>
        <button className="w-full text-left px-4 py-2 text-gray-500 hover:text-red-600 text-sm font-medium transition-colors">
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;