/**
 * Strip C2PA/metadata from illustration SVGs only — does not change viewBox or art.
 *
 * Prefer `npm run sync:svgs` to copy from ~/Downloads/matchbox-svgs.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const illustrationsDir = join(import.meta.dirname, '..', 'public', 'images', 'illustrations');

function stripMetadata(raw) {
    return raw
        .replace(/<metadata>[\s\S]*?<\/metadata>/gi, '')
        .replace(/\sxmlns:c2pa="[^"]*"/g, '')
        .trim();
}

async function main() {
    const files = (await readdir(illustrationsDir)).filter((name) => name.endsWith('.svg'));
    for (const file of files) {
        const path = join(illustrationsDir, file);
        const cleaned = stripMetadata(await readFile(path, 'utf8'));
        await writeFile(path, cleaned, 'utf8');
        console.log(`cleaned ${file}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
