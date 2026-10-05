const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface HealthStatus {
  status: 'ok';
  service: string;
  uptimeSeconds: number;
}

export async function getApiHealth(signal?: AbortSignal): Promise<HealthStatus> {
  const res = await fetch(`${API_URL}/health`, { signal });
  if (!res.ok) throw new Error(`API health check failed: ${res.status}`);
  return res.json() as Promise<HealthStatus>;
}
