/**
 * Copy SVGs from ~/Downloads/matchbox-svgs into public/images, stripping C2PA/metadata bloat.
 *
 * Usage: node apps/web/scripts/sync-matchbox-svgs.mjs [sourceDir]
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { homedir } from 'node:os';

const sourceDir = process.argv[2] ?? join(homedir(), 'Downloads', 'matchbox-svgs');
const publicRoot = join(import.meta.dirname, '..', 'public', 'images');

const ROUTES = {
    'empty-': 'illustrations',
    'office-': 'photos',
    'today-cover': 'photos',
    'signin-hero': 'photos',
    'profile-cover': 'photos',
    'nav-': 'nav',
    'logo-': 'brand',
};

function cleanSvg(raw) {
    return raw
        .replace(/<metadata>[\s\S]*?<\/metadata>/gi, '')
        .replace(/\sxmlns:c2pa="[^"]*"/g, '')
        .trim();
}

function targetSubdir(filename) {
    for (const [prefix, dir] of Object.entries(ROUTES)) {
        if (filename.startsWith(prefix) || filename === prefix.replace(/-$/, '') + '.svg') {
            return dir;
        }
        if (filename === 'today-cover.svg' || filename === 'signin-hero.svg' || filename === 'profile-cover.svg') {
            return 'photos';
        }
    }
    return null;
}

async function main() {
    const { readdir } = await import('node:fs/promises');
    const files = (await readdir(sourceDir)).filter((name) => name.endsWith('.svg'));

    for (const file of files) {
        const subdir = targetSubdir(file);
        if (!subdir) {
            console.warn(`skip (unknown name): ${file}`);
            continue;
        }
        const destDir = join(publicRoot, subdir);
        await mkdir(destDir, { recursive: true });
        const raw = await readFile(join(sourceDir, file), 'utf8');
        const cleaned = cleanSvg(raw);
        const dest = join(destDir, basename(file));
        await writeFile(dest, cleaned, 'utf8');
        console.log(`wrote ${dest} (${cleaned.length} bytes)`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
