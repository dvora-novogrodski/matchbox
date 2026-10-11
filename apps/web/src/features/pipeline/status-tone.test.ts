import type { Theme } from '@matchbox/ui';
import { describe, expect, it } from 'vitest';

import { statusTone } from './status-tone';

const theme = {
    palette: {
        text: { primary: '#111111' },
        surface: { 200: '#eeeeee' },
        status: {
            applied: { bg: '#applied-bg', fg: '#applied-fg' },
            interview: { bg: '#interview-bg', fg: '#interview-fg' },
            offer: { bg: '#offer-bg', fg: '#offer-fg' },
            closed: { bg: '#closed-bg', fg: '#closed-fg' },
        },
    },
} as Theme;

describe('statusTone', () => {
    it('should use the category color from the theme', () => {
        expect(statusTone(theme, 'open', null)).toEqual({ bg: '#eeeeee', fg: '#111111' });
        expect(statusTone(theme, 'active', null).bg).toBe('#applied-bg');
        expect(statusTone(theme, 'interviewing', null).bg).toBe('#interview-bg');
        expect(statusTone(theme, 'offer', null).bg).toBe('#offer-bg');
        expect(statusTone(theme, 'closed', null).bg).toBe('#closed-bg');
    });

    it('should use a custom status color when one is set', () => {
        expect(statusTone(theme, 'active', '#123456')).toEqual({ bg: '#123456', fg: '#111111' });
    });
});
