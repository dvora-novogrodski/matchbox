import { jobCvPaths } from './job-cv-path';

const NOW = new Date('2026-10-11T12:00:00.000Z');

function slugFrom(jsonPath: string): string {
    return jsonPath.slice('cvs/2026-10-'.length, -'.json'.length);
}

describe('jobCvPaths', () => {
    it('should build a month-stamped path from the company and role', () => {
        const paths = jobCvPaths('Acme / Labs', 'Staff Engineer', NOW);

        expect(paths).toEqual({
            jsonPath: 'cvs/2026-10-acme-labs-staff-engineer.json',
            htmlPath: 'cvs/2026-10-acme-labs-staff-engineer.html',
        });
    });

    it('should keep a Hebrew company and role in the path', () => {
        const paths = jobCvPaths('אלמנטור', 'מהנדסת', NOW);

        expect(paths.jsonPath).toBe('cvs/2026-10-אלמנטור-מהנדסת.json');
    });

    it('should keep both scripts in a mixed name', () => {
        const paths = jobCvPaths('Elementor אלמנטור', 'Engineer', NOW);

        expect(paths.jsonPath).toBe('cvs/2026-10-elementor-אלמנטור-engineer.json');
    });

    it('should ignore bidi controls so the same name keeps the same path', () => {
        const marked = jobCvPaths('אלמנטור\u200F', '\u200Eמהנדסת', NOW);
        const plain = jobCvPaths('אלמנטור', 'מהנדסת', NOW);

        expect(marked.jsonPath).toBe(plain.jsonPath);
    });

    it('should normalize composed and decomposed letters to the same path', () => {
        const composed = jobCvPaths('Café', 'Engineer', NOW);
        const decomposed = jobCvPaths('Cafe\u0301', 'Engineer', NOW);

        expect(decomposed.jsonPath).toBe(composed.jsonPath);
        expect(composed.jsonPath).toBe('cvs/2026-10-café-engineer.json');
    });

    it('should keep the slug within 60 characters', () => {
        const paths = jobCvPaths('א'.repeat(80), 'ב'.repeat(80), NOW);
        const slug = slugFrom(paths.jsonPath);

        expect(slug.length).toBeLessThanOrEqual(60);
        expect(slug.endsWith('-')).toBe(false);
        expect(paths.htmlPath).toBe(paths.jsonPath.replace(/\.json$/, '.html'));
    });

    it('should drop a trailing hyphen when the length cap lands on a separator', () => {
        const paths = jobCvPaths('a'.repeat(59), 'engineer', NOW);

        expect(slugFrom(paths.jsonPath)).toBe('a'.repeat(59));
    });

    it('should use a fallback slug when the name has only symbols', () => {
        const paths = jobCvPaths('---', '***', new Date('2026-01-02T00:00:00.000Z'));

        expect(paths.jsonPath).toBe('cvs/2026-01-role.json');
    });
});
