/**
 * Nav thumbnails render in a 200×80 frame — use meet + inset viewBox so art stays inside.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const navDir = join(import.meta.dirname, '..', 'public', 'images', 'nav');

function normalizeNavSvg(raw) {
    let svg = raw
        .replace(/<metadata>[\s\S]*?<\/metadata>/gi, '')
        .replace(/\sxmlns:c2pa="[^"]*"/g, '')
        .replace(/<title>[^<]*<\/title>/gi, '');

    svg = svg.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
        const cleaned = attrs
            .replace(/\s(width|height)="[^"]*"/gi, '')
            .replace(/\spreserveAspectRatio="[^"]*"/gi, '');
        return `<svg${cleaned} viewBox="24 8 352 144" preserveAspectRatio="xMidYMid meet">`;
    });

    svg = svg.replace(/\sviewBox="0 0 400 160"/gi, '');

    return svg.trim();
}

async function main() {
    const files = (await readdir(navDir)).filter((name) => name.endsWith('.svg'));
    for (const file of files) {
        const path = join(navDir, file);
        await writeFile(path, normalizeNavSvg(await readFile(path, 'utf8')), 'utf8');
        console.log(`normalized ${file}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
