const OFFICE_IMAGE_COUNT = 6;

export function domainFromJobUrl(url: string | null | undefined): string | null {
    if (!url) {
        return null;
    }
    try {
        const hostname = new URL(url).hostname.replace(/^www\./, '');
        return hostname.length > 0 ? hostname : null;
    } catch {
        return null;
    }
}

export function faviconUrlForDomain(domain: string): string {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function officeFallbackIndex(companyName: string): number {
    let hash = 0;
    for (let index = 0; index < companyName.length; index += 1) {
        hash = companyName.charCodeAt(index) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % OFFICE_IMAGE_COUNT) + 1;
}

export function officeCoverImagePath(companyName: string): string {
    const index = officeFallbackIndex(companyName);
    return `/images/photos/office-${index}.svg`;
}
