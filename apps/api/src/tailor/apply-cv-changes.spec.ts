import type { CvDocument } from '@matchbox/shared';

import { applyCvChanges, CvChangeApplyError } from './apply-cv-changes';

const ITEM_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd124';

function document(): CvDocument {
    return {
        header: {
            fullName: 'Ada Lovelace',
            headline: null,
            email: null,
            phone: null,
            location: null,
            links: [],
        },
        summary: '',
        experience: [
            {
                careerItemId: ITEM_ID,
                title: 'Engineer',
                organization: null,
                startDate: null,
                endDate: null,
                tech: [],
                bullets: ['Shipped the API'],
            },
        ],
        projects: [],
        skills: [
            { skillId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd125', name: 'TypeScript' },
            { skillId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd126', name: 'Postgres' },
        ],
        education: [],
    };
}

describe('applyCvChanges', () => {
    it('should replace a bullet and leave the source document unchanged', () => {
        const source = document();

        const next = applyCvChanges(source, [
            { path: 'experience[0].bullets[0]', op: 'replace', after: 'Shipped the public API' },
        ]);

        expect(next.experience[0]?.bullets).toEqual(['Shipped the public API']);
        expect(source.experience[0]?.bullets).toEqual(['Shipped the API']);
    });

    it('should let a later change to the same bullet win', () => {
        const next = applyCvChanges(document(), [
            { path: 'experience[0].bullets[0]', op: 'replace', after: 'First' },
            { path: 'experience[0].bullets[0]', op: 'replace', after: 'Second' },
        ]);

        expect(next.experience[0]?.bullets).toEqual(['Second']);
    });

    it('should insert a bullet and reorder skills listed on separate lines', () => {
        const next = applyCvChanges(document(), [
            { path: 'experience[0].bullets[1]', op: 'insert', after: 'Led the launch' },
            { path: 'skills', op: 'reorder', after: 'Postgres\nTypeScript' },
        ]);

        expect(next.experience[0]?.bullets).toEqual(['Shipped the API', 'Led the launch']);
        expect(next.skills.map((skill) => skill.name)).toEqual(['Postgres', 'TypeScript']);
    });

    it('should throw when an accepted change has nowhere to land', () => {
        expect(() => applyCvChanges(document(), [{ path: 'experience[3].bullets[0]', op: 'replace', after: 'Nope' }])).toThrow(
            CvChangeApplyError,
        );
    });
});
