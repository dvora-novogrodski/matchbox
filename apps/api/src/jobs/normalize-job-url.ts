const TRACKING_PARAM = /^utm_/i;

export function normalizeJobUrl(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return null;
    }

    let url: URL;
    try {
        url = new URL(trimmed);
    } catch {
        return null;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
    }

    url.hash = '';
    const params = [...url.searchParams.entries()]
        .filter(([key]) => !TRACKING_PARAM.test(key))
        .sort(([left], [right]) => left.localeCompare(right));
    url.search = '';
    for (const [key, param] of params) {
        url.searchParams.append(key, param);
    }
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
        url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
}
