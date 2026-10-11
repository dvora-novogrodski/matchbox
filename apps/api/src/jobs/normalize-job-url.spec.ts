import { normalizeJobUrl } from './normalize-job-url';

describe('normalizeJobUrl', () => {
    it('should return null for an empty value', () => {
        expect(normalizeJobUrl('   ')).toBeNull();
    });

    it('should return null for a non-http url', () => {
        expect(normalizeJobUrl('javascript:alert(1)')).toBeNull();
    });

    it('should lowercase the host, drop the hash, and strip a trailing slash', () => {
        expect(normalizeJobUrl('HTTPS://Example.com/jobs/1/#apply')).toBe('https://example.com/jobs/1');
    });

    it('should drop tracking params and sort the rest', () => {
        expect(normalizeJobUrl('https://example.com/jobs/1?utm_source=li&b=2&a=1')).toBe(
            'https://example.com/jobs/1?a=1&b=2',
        );
    });
});
