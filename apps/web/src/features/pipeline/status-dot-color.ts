import type { Status } from '@matchbox/shared';
import type { Theme } from '@matchbox/ui';

export function statusDotColor(status: Status, theme: Theme): string {
    if (status.color) {
        return status.color;
    }
    if (status.category === 'active') {
        return theme.palette.info.main;
    }
    if (status.category === 'interviewing') {
        return theme.palette.warning.main;
    }
    if (status.category === 'offer') {
        return theme.palette.success.main;
    }
    return theme.palette.text.tertiary;
}
