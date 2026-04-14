// backend base for the monolith (single fastapi app on port 8000)
export const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export const ARCHITECTURE_LABEL = "layered monolith";
