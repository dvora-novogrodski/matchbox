import { describe, expect, it } from 'vitest';

import { formatDate, formatRelativeTime } from './format.utils';

describe('formatRelativeTime', () => {
    const now = new Date('2026-10-11T12:00:00.000Z');

    it('should describe a past day in the requested language', () => {
        expect(formatRelativeTime('2026-10-09T12:00:00.000Z', 'en', now)).toBe('2 days ago');
    });

    it('should describe the current moment as now', () => {
        expect(formatRelativeTime('2026-10-11T12:00:00.000Z', 'en', now)).toBe('now');
    });
});

describe('formatDate', () => {
    it('should format a calendar date in the requested language', () => {
        const iso = '2026-10-11T12:00:00.000Z';

        expect(formatDate(iso, 'en')).toBe(new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(iso)));
    });
});
