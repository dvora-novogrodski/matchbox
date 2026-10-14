import { type Application, PLANS, type Status } from '@matchbox/shared';
import { Box, Card, IconButton, Link, Menu, MenuItem, MoreIcon, Stack, Typography } from '@matchbox/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { CompanyLogo } from 'src/components/CompanyLogo';
import { formatRelativeTime } from 'src/utils/format.utils';

import { StatusDotLabel } from '../StatusDotLabel';

type ApplicationCardProps = {
    application: Application;
    destinations: Status[];
    isPending: boolean;
    onChangeStatus: (statusId: string) => void;
};

export function ApplicationCard({ application, destinations, isPending, onChangeStatus }: ApplicationCardProps) {
    const { t, i18n } = useTranslation('pipeline');
    const activityDate = application.appliedAt ?? application.createdAt;
    const when = formatRelativeTime(activityDate, i18n.language);
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const [renderedAt] = useState(() => Date.now());
    const needsFollowUp =
        (application.status.category === 'active' || application.status.category === 'interviewing') &&
        renderedAt - new Date(application.lastActivityAt).getTime() >=
            PLANS.owner['followUp.afterDays'] * 24 * 60 * 60 * 1000;
    const workMode =
        application.job.workMode === 'onsite'
            ? t('workMode.onsite')
            : application.job.workMode === 'hybrid'
              ? t('workMode.hybrid')
              : application.job.workMode === 'remote'
                ? t('workMode.remote')
                : null;
    const meta = [application.job.location, workMode].filter((part): part is string => Boolean(part && part.length > 0)).join(' · ');

    return (
        <Card
            data-clickable="true"
            data-test={`pipeline-application-card-${application.id}`}
            sx={{ p: 1.5 }}
            variant="outlined"
        >
            <Stack spacing={1}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <CompanyLogo companyName={application.job.companyName} jobUrl={application.job.url} size={20} />
                    <Typography color="text.secondary" noWrap variant="body2">
                        {application.job.companyName}
                    </Typography>
                </Stack>
                <Link
                    color="inherit"
                    component={RouterLink}
                    data-test={`pipeline-application-open-${application.id}`}
                    sx={{ textDecoration: 'none' }}
                    to={`/jobs/${application.job.id}/overview`}
                    underline="none"
                    variant="subtitle1"
                >
                    {application.job.title}
                </Link>
                {meta ? (
                    <Typography color="text.secondary" variant="body2">{meta}</Typography>
                ) : null}
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', pt: 0.5 }}>
                    {needsFollowUp ? (
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                            <Box
                                aria-hidden
                                sx={{ bgcolor: 'accent.main', borderRadius: '50%', height: 8, width: 8 }}
                            />
                            <Typography sx={{ color: 'accentText' }} variant="body2">
                                {t('card.followUp')}
                            </Typography>
                        </Stack>
                    ) : (
                        <Typography color="text.secondary" variant="body2">
                            {application.appliedAt
                                ? t('card.applied', { when })
                                : t('card.saved', { when })}
                        </Typography>
                    )}
                    <IconButton
                        aria-label={t('card.moreActions', { title: application.job.title })}
                        data-test={`pipeline-application-move-button-${application.id}`}
                        disabled={isPending}
                        onClick={(event) => setAnchor(event.currentTarget)}
                        size="small"
                    >
                        <MoreIcon fontSize="small" />
                    </IconButton>
                </Stack>
                <Menu anchorEl={anchor} onClose={() => setAnchor(null)} open={Boolean(anchor)}>
                    {destinations.map((status) => (
                        <MenuItem
                            data-test={`pipeline-application-move-option-${application.id}-${status.id}`}
                            key={status.id}
                            onClick={() => {
                                setAnchor(null);
                                onChangeStatus(status.id);
                            }}
                        >
                            <StatusDotLabel status={status} />
                        </MenuItem>
                    ))}
                </Menu>
            </Stack>
        </Card>
    );
}
