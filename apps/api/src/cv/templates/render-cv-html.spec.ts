import { type CvDocument,DEFAULT_CV_TEMPLATE_ID } from '@matchbox/shared';

import { UnknownCvTemplateError } from '../cv.errors';
import { renderCvHtml } from './render-cv-html';

const document: CvDocument = {
    header: {
        fullName: 'Ada <Lovelace>',
        headline: 'Engineer',
        email: 'ada@example.com',
        phone: null,
        location: 'London',
        links: [{ label: 'Site', url: 'https://ada.example' }],
    },
    summary: 'Built early programs.',
    experience: [
        {
            careerItemId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd201',
            title: 'Engineer',
            organization: 'Analytical Engines',
            startDate: '2020-01-01',
            endDate: null,
            tech: ['Mathematics'],
            bullets: ['Wrote the notes.'],
        },
    ],
    projects: [],
    skills: [{ skillId: '0199bcdf-20fc-744f-bc8b-6ef7c25cd203', name: 'Mathematics' }],
    education: [],
};

describe('renderCvHtml', () => {
    it('should render the default template and escape profile text', () => {
        const html = renderCvHtml(document, DEFAULT_CV_TEMPLATE_ID);

        expect(html).toContain('Ada &lt;Lovelace&gt;');
        expect(html).not.toContain('<Lovelace>');
        expect(html).toContain('Jan 2020 – Present');
        expect(html).toContain('https://ada.example');
        expect(html).toContain('<h2>Experience</h2>');
        expect(html).toContain('<h2>Skills</h2>');
        expect(html).not.toContain('<h2>Projects</h2>');
        expect(html).not.toContain('<h2>Education</h2>');
    });

    it('should reject an unknown template id', () => {
        expect(() => renderCvHtml(document, 'compact')).toThrow(UnknownCvTemplateError);
    });
});
