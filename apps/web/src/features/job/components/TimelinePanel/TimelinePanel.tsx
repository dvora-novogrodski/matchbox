import type { ApplicationEvent, Status } from '@matchbox/shared';
import { Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { statusLabel } from 'src/features/pipeline';
import { formatDate } from 'src/utils/format.utils';

type TimelinePanelProps = {
    events: ApplicationEvent[];
    statuses: Status[];
};

export function TimelinePanel({ events, statuses }: TimelinePanelProps) {
    const { t, i18n } = useTranslation('job');
    const { t: tCommon } = useTranslation('common');

    if (events.length === 0) {
        return <Typography color="text.secondary">{t('timeline.empty')}</Typography>;
    }

    return (
        <Stack component="ol" spacing={2} sx={{ m: 0, pl: 3 }}>
            {events.map((event) => (
                <Stack component="li" key={event.id} spacing={0.5}>
                    <Typography color="text.secondary" variant="body2">
                        {formatDate(event.occurredAt, i18n.language)}
                    </Typography>
                    <EventText event={event} statuses={statuses} t={t} tCommon={tCommon} />
                </Stack>
            ))}
        </Stack>
    );
}

function EventText({
    event,
    statuses,
    t,
    tCommon,
}: {
    event: ApplicationEvent;
    statuses: Status[];
    t: ReturnType<typeof useTranslation<'job'>>['t'];
    tCommon: ReturnType<typeof useTranslation<'common'>>['t'];
}) {
    if (event.type === 'status_changed') {
        if (!event.fromStatusId || !event.toStatusId) {
            return <Typography>{t('timeline.statusChangedUnknown')}</Typography>;
        }
        const from = statuses.find((status) => status.id === event.fromStatusId);
        const to = statuses.find((status) => status.id === event.toStatusId);
        return (
            <Typography>
                {t('timeline.statusChanged', {
                    from: from ? statusLabel(from, tCommon) : t('timeline.unknownStatus'),
                    to: to ? statusLabel(to, tCommon) : t('timeline.unknownStatus'),
                })}
            </Typography>
        );
    }
    if (event.type === 'note') {
        return (
            <Stack spacing={0.5}>
                <Typography variant="subtitle2">{t('timeline.note')}</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{event.text}</Typography>
            </Stack>
        );
    }
    if (event.type === 'email') {
        return <Typography>{t('timeline.email')}</Typography>;
    }
    if (event.type === 'follow_up') {
        return <Typography>{t('timeline.followUp')}</Typography>;
    }
    return <Typography>{t('timeline.created')}</Typography>;
}
