import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AiRecommendationsPage } from "./pages/AiRecommendationsPage";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProgressPage } from "./pages/ProgressPage";
import { StudyGroupsPage } from "./pages/StudyGroupsPage";
import { StudyPlanPage } from "./pages/StudyPlanPage";
import "./smartstudy.css";

// same routes as monolith; api calls go to different services via config.ts
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/study-plan" element={<StudyPlanPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/groups" element={<StudyGroupsPage />} />
        <Route path="/ai" element={<AiRecommendationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
