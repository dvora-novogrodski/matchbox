import { SYSTEM_STATUSES } from '@matchbox/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getApiHealth } from '../lib/api/client';

type ApiState = 'checking' | 'online' | 'offline';

export function App() {
  const { t } = useTranslation();
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
      <h1>{t('app.title')}</h1>
      <p>
        {t('app.apiLabel')} <strong data-testid="api-status">{t(`apiState.${api}`)}</strong>
      </p>
      <p>
        {t('app.pipelineStatuses', {
          statuses: SYSTEM_STATUSES.map((s) => t(`statuses.${s.key}`)).join(', '),
        })}
      </p>
    </main>
  );
}
