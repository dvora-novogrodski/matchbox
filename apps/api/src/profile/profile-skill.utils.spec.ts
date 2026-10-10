import { dedupeSkillNames, normalizeSkillName } from './profile-skill.utils';

describe('profile skill utils', () => {
    it('should normalize skill names for uniqueness', () => {
        expect(normalizeSkillName('  TypeScript  ')).toBe('typescript');
    });

    it('should dedupe skill names case-insensitively while keeping first casing', () => {
        expect(dedupeSkillNames(['TypeScript', ' typescript ', 'Go', ''])).toEqual(['TypeScript', 'Go']);
    });
});
