import type { Profile } from '@matchbox/shared';

import { composeCvDocument, pruneSelection, selectionFromProfile } from './compose-base-cv';

const EXPERIENCE_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd201';
const OTHER_EXPERIENCE_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd202';
const SKILL_ID = '0199bcdf-20fc-744f-bc8b-6ef7c25cd203';

const profile: Profile = {
    experience: [
        {
            id: EXPERIENCE_ID,
            title: 'Engineer',
            organization: 'Acme',
            startDate: '2020-01-01',
            endDate: null,
            tech: ['TypeScript'],
            bullets: [{ id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd204', text: 'Shipped the API.' }],
        },
        {
            id: OTHER_EXPERIENCE_ID,
            title: 'Intern',
            organization: null,
            startDate: null,
            endDate: null,
            tech: [],
            bullets: [],
        },
    ],
    projects: [],
    education: [],
    skills: [{ id: SKILL_ID, name: 'TypeScript' }],
};

describe('compose base CV', () => {
    it('should include every profile item when no selection has been saved', () => {
        const selection = selectionFromProfile(profile, { displayName: 'Ada Lovelace', email: 'ada@example.com' });

        expect(selection.header.fullName).toBe('Ada Lovelace');
        expect(selection.experienceItemIds).toEqual([EXPERIENCE_ID, OTHER_EXPERIENCE_ID]);
        expect(composeCvDocument(profile, selection).experience.map((entry) => entry.title)).toEqual([
            'Engineer',
            'Intern',
        ]);
    });

    it('should keep the saved order and drop items that no longer exist', () => {
        const selection = pruneSelection(profile, {
            ...selectionFromProfile(profile, { displayName: null, email: 'ada@example.com' }),
            experienceItemIds: [OTHER_EXPERIENCE_ID, '0199bcdf-20fc-744f-bc8b-6ef7c25cd299', EXPERIENCE_ID],
        });

        expect(selection.header.fullName).toBe('ada@example.com');
        expect(composeCvDocument(profile, selection).experience.map((entry) => entry.careerItemId)).toEqual([
            OTHER_EXPERIENCE_ID,
            EXPERIENCE_ID,
        ]);
        expect(composeCvDocument(profile, selection).experience[1]?.bullets).toEqual(['Shipped the API.']);
    });
});
