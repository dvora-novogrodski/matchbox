const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface HealthStatus {
  status: 'ok' | 'error' | 'shutting_down';
}

export async function getApiHealth(signal?: AbortSignal): Promise<HealthStatus> {
  const res = await fetch(`${API_URL}/health/live`, { signal });
  if (!res.ok) throw new Error(`API health check failed: ${res.status}`);
  return res.json() as Promise<HealthStatus>;
}
