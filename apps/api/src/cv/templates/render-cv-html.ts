import { type CvDocument,DEFAULT_CV_TEMPLATE_ID } from '@matchbox/shared';
import { BadRequestException } from '@nestjs/common';

import { UnknownCvTemplateError } from '../cv.errors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function renderCvHtml(document: CvDocument, templateId: string): string {
    if (templateId !== DEFAULT_CV_TEMPLATE_ID) {
        throw new UnknownCvTemplateError(templateId);
    }
    return renderDefaultTemplate(document);
}

function renderDefaultTemplate(document: CvDocument): string {
    const { header } = document;
    const contact = [
        header.email,
        header.phone,
        header.location,
        ...header.links.map((link) => renderLink(link.label, link.url)),
    ].filter((part): part is string => Boolean(part));

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(header.fullName)}</title>
<style>
  @page { size: A4; margin: 14mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #232323; font-family: "Liberation Sans", Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; }
  h1 { font-size: 22pt; font-weight: 700; margin: 0; }
  .headline, .contact, .dates, .tech { color: #555555; }
  .headline { margin: 2px 0 0; }
  .contact { margin: 8px 0 0; }
  .contact a { color: #078080; text-decoration: none; }
  h2 { font-size: 11pt; letter-spacing: 0.08em; text-transform: uppercase; color: #078080; border-bottom: 1px solid #d7d3ce; margin: 18px 0 8px; padding-bottom: 3px; }
  p { margin: 0; }
  .item { margin: 0 0 10px; }
  .item-head { display: flex; justify-content: space-between; gap: 12px; }
  .item-title { font-weight: 700; }
  ul { margin: 4px 0 0; padding-left: 18px; }
  .tech { margin: 2px 0 0; font-size: 9.5pt; }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(header.fullName)}</h1>
  ${header.headline ? `<p class="headline">${escapeHtml(header.headline)}</p>` : ''}
  ${contact.length > 0 ? `<p class="contact">${contact.join(' · ')}</p>` : ''}
</header>
${renderSummary(document.summary)}
${renderRoles('Experience', document.experience)}
${renderRoles('Projects', document.projects)}
${renderSkills(document.skills)}
${renderEducation(document.education)}
</body>
</html>
`;
}

function renderSummary(summary: string): string {
    if (!summary) {
        return '';
    }
    return `<section><h2>Summary</h2><p>${escapeHtml(summary)}</p></section>`;
}

function renderRoles(title: string, entries: CvDocument['experience']): string {
    if (entries.length === 0) {
        return '';
    }
    const items = entries
        .map((entry) => {
            const range = formatCvRange(entry.startDate, entry.endDate);
            const bullets =
                entry.bullets.length > 0
                    ? `<ul>${entry.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
                    : '';
            const tech = entry.tech.length > 0 ? `<p class="tech">${escapeHtml(entry.tech.join(', '))}</p>` : '';
            return `<article class="item">
  <div class="item-head"><div><span class="item-title">${escapeHtml(entry.title)}</span>${entry.organization ? ` <span>${escapeHtml(entry.organization)}</span>` : ''}</div>${range ? `<div class="dates">${escapeHtml(range)}</div>` : ''}</div>
  ${bullets}
  ${tech}
</article>`;
        })
        .join('\n');
    return `<section><h2>${title}</h2>${items}</section>`;
}

function renderSkills(skills: CvDocument['skills']): string {
    if (skills.length === 0) {
        return '';
    }
    return `<section><h2>Skills</h2><p>${escapeHtml(skills.map((skill) => skill.name).join(', '))}</p></section>`;
}

function renderEducation(entries: CvDocument['education']): string {
    if (entries.length === 0) {
        return '';
    }
    const items = entries
        .map((entry) => {
            const range = formatCvRange(entry.startDate, entry.endDate);
            const bullets =
                entry.bullets.length > 0
                    ? `<ul>${entry.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
                    : '';
            return `<article class="item">
  <div class="item-head"><div><span class="item-title">${escapeHtml(entry.degree)}</span>${entry.institution ? ` <span>${escapeHtml(entry.institution)}</span>` : ''}</div>${range ? `<div class="dates">${escapeHtml(range)}</div>` : ''}</div>
  ${bullets}
</article>`;
        })
        .join('\n');
    return `<section><h2>Education</h2>${items}</section>`;
}

function renderLink(label: string, url: string): string | null {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return escapeHtml(label);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return escapeHtml(label);
    }
    return `<a href="${escapeHtml(parsed.href)}">${escapeHtml(label)}</a>`;
}

export function formatCvRange(start: string | null, end: string | null): string | null {
    if (!start && !end) {
        return null;
    }
    const startLabel = start ? formatMonthYear(start) : null;
    const endLabel = end ? formatMonthYear(end) : 'Present';
    return startLabel ? `${startLabel} – ${endLabel}` : endLabel;
}

function formatMonthYear(isoDate: string): string {
    const [year, month] = isoDate.split('-');
    const monthName = MONTHS[Number(month) - 1];
    if (!year || !monthName) {
        throw new BadRequestException('CV date is invalid');
    }
    return `${monthName} ${year}`;
}

export function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
