import '@testing-library/jest-dom/vitest';
import './i18n/i18n';

import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-test' });
