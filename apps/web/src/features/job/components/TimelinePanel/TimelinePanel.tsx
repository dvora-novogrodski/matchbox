import type { ApplicationEvent, Status } from '@matchbox/shared';
import type { Theme } from '@matchbox/ui';
import { Alert, Box, Button, Card, Stack, Typography, useTheme } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { EmptyIllustration } from 'src/components/EmptyIllustration';
import { illustrations } from 'src/constants/media';
import { statusDotColor, statusLabel } from 'src/features/pipeline';
import { formatDate } from 'src/utils/format.utils';

import { useRecordFollowUp } from '../../api/job.queries';

type TimelinePanelProps = {
    applicationId: string;
    jobId: string;
    events: ApplicationEvent[];
    statuses: Status[];
};

export function TimelinePanel({ applicationId, jobId, events, statuses }: TimelinePanelProps) {
    const { t, i18n } = useTranslation('job');
    const { t: tCommon } = useTranslation('common');
    const record = useRecordFollowUp(jobId);

    return (
        <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography component="h2" sx={{ fontSize: '1rem', fontWeight: 600 }} variant="h6">
                    {t('tabs.timeline')}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }} variant="body2">
                    {t('timeline.intro')}
                </Typography>
            </Stack>
            {record.isError ? <Alert severity="error">{t('timeline.recordFailed')}</Alert> : null}
            <Card sx={{ p: 2 }}>
                <Stack spacing={2}>
                    <Button
                        data-test="job-record-follow-up-button"
                        disabled={record.isPending}
                        onClick={() => {
                            record.mutate(applicationId);
                        }}
                        sx={{ alignSelf: 'flex-start' }}
                        variant="contained"
                    >
                        {t('timeline.record')}
                    </Button>
                    {events.length === 0 ? (
                        <Stack spacing={1.5} sx={{ alignItems: 'center', py: 2, textAlign: 'center' }}>
                            <EmptyIllustration src={illustrations.emptyTimeline} />
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('timeline.emptyTitle')}</Typography>
                            <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', maxWidth: 320 }} variant="body2">
                                {t('timeline.empty')}
                            </Typography>
                        </Stack>
                    ) : (
                        <Stack component="ol" spacing={0} sx={{ listStyle: 'none', m: 0, p: 0 }}>
                            {events.map((event, index) => (
                                <TimelineRow
                                    event={event}
                                    isLast={index === events.length - 1}
                                    key={event.id}
                                    language={i18n.language}
                                    statuses={statuses}
                                    t={t}
                                    tCommon={tCommon}
                                />
                            ))}
                        </Stack>
                    )}
                </Stack>
            </Card>
        </Stack>
    );
}

type TimelineRowProps = {
    event: ApplicationEvent;
    isLast: boolean;
    language: string;
    statuses: Status[];
    t: ReturnType<typeof useTranslation<'job'>>['t'];
    tCommon: ReturnType<typeof useTranslation<'common'>>['t'];
};

function TimelineRow({ event, isLast, language, statuses, t, tCommon }: TimelineRowProps) {
    const theme = useTheme();
    const dotColor = timelineDotColor(event, statuses, theme);

    return (
        <Stack component="li" direction="row" spacing={1.5}>
            <Stack sx={{ alignItems: 'center', flexShrink: 0, width: 12 }}>
                <Box
                    aria-hidden
                    sx={{
                        bgcolor: dotColor,
                        borderRadius: '50%',
                        flexShrink: 0,
                        height: 8,
                        mt: 0.75,
                        width: 8,
                    }}
                />
                {!isLast ? (
                    <Box
                        aria-hidden
                        sx={{
                            bgcolor: 'divider',
                            flex: 1,
                            minHeight: 32,
                            mt: 0.5,
                            width: 2,
                        }}
                    />
                ) : null}
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, pb: isLast ? 0 : 2.5 }}>
                <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }} variant="body2">
                    {formatDate(event.occurredAt, language)}
                </Typography>
                <EventText event={event} statuses={statuses} t={t} tCommon={tCommon} />
            </Stack>
        </Stack>
    );
}

function timelineDotColor(event: ApplicationEvent, statuses: Status[], theme: Theme) {
    if (event.type === 'status_changed' && event.toStatusId) {
        const to = statuses.find((status) => status.id === event.toStatusId);
        if (to) {
            return statusDotColor(to, theme);
        }
    }
    if (event.type === 'follow_up') {
        return theme.palette.accent.main;
    }
    return theme.palette.text.tertiary;
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
            return <Typography sx={{ fontSize: '0.875rem' }}>{t('timeline.statusChangedUnknown')}</Typography>;
        }
        const from = statuses.find((status) => status.id === event.fromStatusId);
        const to = statuses.find((status) => status.id === event.toStatusId);
        return (
            <Typography sx={{ fontSize: '0.875rem' }}>
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
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('timeline.note')}</Typography>
                <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{event.text}</Typography>
            </Stack>
        );
    }
    if (event.type === 'email') {
        return <Typography sx={{ fontSize: '0.875rem' }}>{t('timeline.email')}</Typography>;
    }
    if (event.type === 'follow_up') {
        return <Typography sx={{ fontSize: '0.875rem' }}>{t('timeline.followUp')}</Typography>;
    }
    return <Typography sx={{ fontSize: '0.875rem' }}>{t('timeline.created')}</Typography>;
}
