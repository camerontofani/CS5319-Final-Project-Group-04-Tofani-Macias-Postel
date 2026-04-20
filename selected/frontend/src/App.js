import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Progress from './pages/Progress';
import AIRecommendations from './pages/AIRecommendations';
import StudyGroups from './pages/StudyGroups';
import LoginPage from './pages/LoginPage';
import { AppDataProvider } from './context/AppDataContext';
import { useAuth } from './auth/AuthContext';

function AppShell() {
  const [currentScreen, setCurrentScreen] = useState('Study Plan');

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      <main className="flex-1 ml-64 p-8">
        {currentScreen === 'Study Plan' && <Dashboard setCurrentScreen={setCurrentScreen} />}
        {currentScreen === 'Progress' && <Progress />}
        {currentScreen === 'AI Recommendations' && <AIRecommendations />}
        {currentScreen === 'Study Groups' && <StudyGroups />}
        {currentScreen === 'Course Setup' && <Onboarding setCurrentScreen={setCurrentScreen} />}
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();
  return (
    <AppDataProvider userId={user.id}>
      <AppShell />
    </AppDataProvider>
  );
}

function App() {
  const { ready, isAuthenticated } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}

export default App;
