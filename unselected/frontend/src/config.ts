// each microservice has its own url in dev (gateway can replace this later)
export const SERVICE_URL = {
  auth: import.meta.env.VITE_AUTH_URL ?? "http://localhost:8101",
  studyPlan: import.meta.env.VITE_STUDY_PLAN_URL ?? "http://localhost:8102",
  progress: import.meta.env.VITE_PROGRESS_URL ?? "http://localhost:8103",
  group: import.meta.env.VITE_GROUP_URL ?? "http://localhost:8104",
  notification: import.meta.env.VITE_NOTIFICATION_URL ?? "http://localhost:8105",
  ai: import.meta.env.VITE_AI_URL ?? "http://localhost:8106",
} as const;

export const ARCHITECTURE_LABEL = "microservices (separate processes)";
