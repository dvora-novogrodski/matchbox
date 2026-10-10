export function normalizeSkillName(name: string): string {
    return name.trim().toLowerCase();
}

export function dedupeSkillNames(names: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const name of names) {
        const trimmed = name.trim();
        if (!trimmed) {
            continue;
        }
        const key = normalizeSkillName(trimmed);
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(trimmed);
    }
    return result;
}
