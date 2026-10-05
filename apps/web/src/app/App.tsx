import { useEffect, useState } from 'react';
import { SYSTEM_STATUSES } from '@matchbox/shared';
import { getApiHealth } from '../lib/api/client';

type ApiState = 'checking' | 'online' | 'offline';

export function App() {
  const [api, setApi] = useState<ApiState>('checking');

  useEffect(() => {
    const controller = new AbortController();
    getApiHealth(controller.signal)
      .then(() => setApi('online'))
      .catch((err: unknown) => {
        if ((err as Error).name !== 'AbortError') setApi('offline');
      });
    return () => controller.abort();
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>Matchbox</h1>
      <p>
        API: <strong data-testid="api-status">{api}</strong>
      </p>
      <p>Pipeline statuses: {SYSTEM_STATUSES.map((s) => s.name).join(', ')}</p>
    </main>
  );
}
