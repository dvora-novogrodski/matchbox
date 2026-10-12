const MAX_SLUG_LENGTH = 60;

/** LRM, RLM, ALM, and the bidi embedding, override, and isolate controls. */
const BIDI_CONTROLS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

/** `cvs/<yyyy-mm>-<company>-<role>.json` and the matching HTML file (F3). */
export function jobCvPaths(company: string, title: string, now: Date): { jsonPath: string; htmlPath: string } {
    const month = now.toISOString().slice(0, 7);
    const slug = slugify(`${company}-${title}`);
    const base = `cvs/${month}-${slug}`;
    return { jsonPath: `${base}.json`, htmlPath: `${base}.html` };
}

function slugify(value: string): string {
    const slug = value
        .normalize('NFC')
        .replace(BIDI_CONTROLS, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, MAX_SLUG_LENGTH)
        .replace(/-+$/g, '');
    return slug.length > 0 ? slug : 'role';
}
