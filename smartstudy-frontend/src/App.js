import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Progress from './pages/Progress';
import AIRecommendations from './pages/AIRecommendations';
import StudyGroups from './pages/StudyGroups';

function App() {
  // This state tracks which screen Jocelin's front-end is showing
  const [currentScreen, setCurrentScreen] = useState('Study Plan');

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* We use the Sidebar component here. 
         We pass 'currentScreen' so it knows which button to highlight,
         and 'setCurrentScreen' so the buttons can actually change the page.
      */}
      <Sidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        {currentScreen === 'Study Plan' && <Dashboard />}
        {currentScreen === 'Progress' && <Progress />}
        {currentScreen === 'AI Recommendations' && <AIRecommendations />}
        {currentScreen === 'Study Groups' && <StudyGroups />}
        {currentScreen === 'Course Setup' && <Onboarding />}
      </main>
    </div>
  );
}

export default App;