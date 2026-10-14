export type DayPeriod = 'morning' | 'afternoon' | 'evening';

export function dayPeriodFromHour(hour: number): DayPeriod {
    if (hour < 12) {
        return 'morning';
    }
    if (hour < 17) {
        return 'afternoon';
    }
    return 'evening';
}

export function needsYouCount(stats: { followUps: number; matches: number; toTailor: number }): number {
    return stats.followUps + stats.matches + stats.toTailor;
}

export type StatTileKey = 'matches' | 'toTailor' | 'followUps' | 'inProgress';

export function highlightStatTile(stats: {
    followUps: number;
    inProgress: number;
    matches: number;
    toTailor: number;
}): StatTileKey | null {
    if (stats.followUps > 0) {
        return 'followUps';
    }
    if (stats.toTailor > 0) {
        return 'toTailor';
    }
    if (stats.matches > 0) {
        return 'matches';
    }
    if (stats.inProgress > 0) {
        return 'inProgress';
    }
    return null;
}
