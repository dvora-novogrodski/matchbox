import '@testing-library/jest-dom/vitest';
import './i18n/i18n';

import { configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './test/msw/server';

configure({ testIdAttribute: 'data-test' });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
