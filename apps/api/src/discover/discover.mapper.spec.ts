import { toDiscoverFitLines } from './discover.mapper';

describe('toDiscoverFitLines', () => {
    it('should map covered requirements to strengths and gaps to warnings', () => {
        const lines = toDiscoverFitLines(
            [
                { text: 'TypeScript', kind: 'must', category: 'skill', hard: true },
                { text: '5+ years', kind: 'must', category: 'experience', hard: true },
            ],
            [
                {
                    requirement_index: 0,
                    coverage: 'covered',
                    evidence_ids: [],
                    reason: 'On profile',
                },
                {
                    requirement_index: 1,
                    coverage: 'missing',
                    evidence_ids: [],
                    reason: 'Short on years',
                },
            ],
        );

        expect(lines).toEqual([
            { text: 'TypeScript', tone: 'strength' },
            { text: '5+ years', tone: 'gap' },
        ]);
    });

    it('should return an empty list when coverage is invalid', () => {
        expect(toDiscoverFitLines([], null)).toEqual([]);
    });
});
