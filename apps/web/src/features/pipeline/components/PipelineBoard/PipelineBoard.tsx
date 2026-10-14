import type { Application, Status } from '@matchbox/shared';
import { Box, Paper, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

import { statusLabel } from '../../status-label';
import { ApplicationCard } from '../ApplicationCard';
import { StatusDotLabel } from '../StatusDotLabel';

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
                        data-surface="muted"
                        data-test={`pipeline-board-column-${status.id}`}
                        key={status.id}
                        sx={{ flex: '0 0 256px', p: 1.5 }}
                        variant="outlined"
                    >
                        <Stack spacing={1.5}>
                            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box component="h2" sx={{ m: 0 }}>
                                    <StatusDotLabel status={status} />
                                </Box>
                                <Typography color="text.secondary" variant="body2">
                                    {column.length}
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
