import type { Application, Status } from '@matchbox/shared';
import { Box, Paper, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

import { statusLabel } from '../../status-label';
import { ApplicationCard } from '../ApplicationCard';

type PipelineBoardProps = {
    statuses: Status[];
    applications: Application[];
    pendingApplicationId?: string;
    onChangeStatus: (applicationId: string, statusId: string) => void;
};

export function PipelineBoard({ statuses, applications, pendingApplicationId, onChangeStatus }: PipelineBoardProps) {
    const { t } = useTranslation('pipeline');
    const { t: tCommon } = useTranslation('common');
    const hasApplications = applications.length > 0;

    return (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
            {statuses.map((status) => {
                const column = applications.filter((application) => application.status.id === status.id);
                const label = statusLabel(status, tCommon);
                return (
                    <Paper
                        aria-label={label}
                        component="section"
                        data-test={`pipeline-board-column-${status.id}`}
                        key={status.id}
                        sx={{ flex: '0 0 280px', p: 2 }}
                        variant="outlined"
                    >
                        <Stack spacing={2}>
                            <Stack spacing={0.5}>
                                <Typography component="h2" variant="h5">
                                    {label}
                                </Typography>
                                <Typography color="text.secondary" variant="body2">
                                    {t('board.count', { count: column.length })}
                                </Typography>
                            </Stack>
                            {column.length === 0 && hasApplications ? (
                                <Typography color="text.secondary" variant="body2">
                                    {t('board.emptyColumn')}
                                </Typography>
                            ) : null}
                            {column.map((application) => (
                                <ApplicationCard
                                    application={application}
                                    destinations={statuses.filter((candidate) => candidate.id !== status.id)}
                                    isPending={pendingApplicationId === application.id}
                                    key={application.id}
                                    onChangeStatus={(statusId) => onChangeStatus(application.id, statusId)}
                                />
                            ))}
                        </Stack>
                    </Paper>
                );
            })}
        </Box>
    );
}
