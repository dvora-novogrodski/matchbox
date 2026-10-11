import type { StatusCategory } from '@matchbox/shared';
import type { Theme } from '@matchbox/ui';

export function statusTone(
    theme: Theme,
    category: StatusCategory,
    color: string | null,
): { bg: string; fg: string } {
    if (color) {
        return { bg: color, fg: theme.palette.text.primary };
    }
    switch (category) {
        case 'active':
            return theme.palette.status.applied;
        case 'interviewing':
            return theme.palette.status.interview;
        case 'offer':
            return theme.palette.status.offer;
        case 'closed':
            return theme.palette.status.closed;
        case 'open':
            return { bg: theme.palette.surface[200], fg: theme.palette.text.primary };
    }
}
