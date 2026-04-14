import { SERVICE_URL } from "../config";

type ServiceName = keyof typeof SERVICE_URL;

// posts json to one microservice base + path (not the monolith /api prefix)
export async function postToService(
  service: ServiceName,
  path: string,
  body: unknown,
) {
  const base = SERVICE_URL[service];
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<unknown>;
}
