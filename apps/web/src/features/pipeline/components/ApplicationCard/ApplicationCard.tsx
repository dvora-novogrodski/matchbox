import type { Application, Status } from '@matchbox/shared';
import { Button, Card, Chip, Link, Menu, MenuItem, Stack, Typography, useTheme } from '@matchbox/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { formatRelativeTime } from 'src/utils/format.utils';

import { statusLabel } from '../../status-label';
import { statusTone } from '../../status-tone';

type ApplicationCardProps = {
    application: Application;
    destinations: Status[];
    isPending: boolean;
    onChangeStatus: (statusId: string) => void;
};

export function ApplicationCard({ application, destinations, isPending, onChangeStatus }: ApplicationCardProps) {
    const { t, i18n } = useTranslation('pipeline');
    const { t: tCommon } = useTranslation('common');
    const theme = useTheme();
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const tone = statusTone(theme, application.status.category, application.status.color);
    const when = formatRelativeTime(application.lastActivityAt, i18n.language);

    return (
        <Card data-test={`pipeline-application-card-${application.id}`} variant="outlined">
            <Stack spacing={1} sx={{ p: 2 }}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography component="h3" variant="subtitle1">
                        {application.job.companyName}
                    </Typography>
                    <Chip
                        label={statusLabel(application.status, tCommon)}
                        size="small"
                        sx={{ bgcolor: tone.bg, color: tone.fg }}
                    />
                </Stack>
                <Link
                    component={RouterLink}
                    data-test={`pipeline-application-open-${application.id}`}
                    to={`/jobs/${application.job.id}/overview`}
                    underline="hover"
                    variant="body1"
                >
                    {application.job.title}
                </Link>
                {application.job.location ? (
                    <Typography color="text.secondary" variant="body2">
                        {application.job.location}
                    </Typography>
                ) : null}
                <Typography color="text.secondary" variant="body2">
                    {t('card.lastActivity', { when })}
                </Typography>
                <Button
                    aria-label={t('card.moveTo', { title: application.job.title })}
                    data-test={`pipeline-application-move-button-${application.id}`}
                    disabled={isPending}
                    onClick={(event) => setAnchor(event.currentTarget)}
                    size="small"
                    variant="outlined"
                >
                    {t('card.move')}
                </Button>
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
                            {statusLabel(status, tCommon)}
                        </MenuItem>
                    ))}
                </Menu>
            </Stack>
        </Card>
    );
}
