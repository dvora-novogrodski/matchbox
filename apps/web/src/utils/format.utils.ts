const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
    { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
    { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
    { unit: 'day', ms: 1000 * 60 * 60 * 24 },
    { unit: 'hour', ms: 1000 * 60 * 60 },
    { unit: 'minute', ms: 1000 * 60 },
];

export function formatRelativeTime(iso: string, language: string, now = new Date()): string {
    const diff = new Date(iso).getTime() - now.getTime();
    const formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    const unit = UNITS.find(({ ms }) => Math.abs(diff) >= ms);
    if (!unit) {
        return formatter.format(0, 'second');
    }
    return formatter.format(Math.round(diff / unit.ms), unit.unit);
}

export function formatDate(iso: string, language: string): string {
    return new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(new Date(iso));
}
