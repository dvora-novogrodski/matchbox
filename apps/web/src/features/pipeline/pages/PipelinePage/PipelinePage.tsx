import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import { useApplications, useChangeApplicationStatus, useStatuses } from '../../api/applications.queries';
import { PipelineBoard } from '../../components/PipelineBoard';
import { PipelineTable } from '../../components/PipelineTable';
import { type PipelineView, pipelineViewFromParam } from '../../pipeline-view';

export function PipelinePage() {
    const { t } = useTranslation('pipeline');
    const [searchParams, setSearchParams] = useSearchParams();
    const view = pipelineViewFromParam(searchParams.get('view'));
    const statuses = useStatuses();
    const applications = useApplications();
    const changeStatus = useChangeApplicationStatus();

    function setView(next: PipelineView) {
        const params = new URLSearchParams(searchParams);
        if (next === 'board') {
            params.delete('view');
        } else {
            params.set('view', next);
        }
        setSearchParams(params, { replace: true });
    }

    const isPending = statuses.isPending || applications.isPending;
    const isError = statuses.isError || applications.isError;

    return (
        <Box component="main" sx={{ p: 4 }}>
            <Stack spacing={3}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between' }}
                >
                    <Stack spacing={1}>
                        <Typography component="h1" variant="h3">
                            {t('page.title')}
                        </Typography>
                        <Typography color="text.secondary">{t('page.description')}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Button component={RouterLink} data-test="pipeline-add-job-button" to="/jobs/new" variant="contained">
                            {t('actions.addJob')}
                        </Button>
                        <ToggleButtonGroup
                            aria-label={t('view.label')}
                            exclusive
                            onChange={(_event, next: unknown) => {
                                if (next === 'board' || next === 'table') {
                                    setView(next);
                                }
                            }}
                            value={view}
                        >
                            <ToggleButton data-test="pipeline-view-board-button" value="board">
                                {t('view.board')}
                            </ToggleButton>
                            <ToggleButton data-test="pipeline-view-table-button" value="table">
                                {t('view.table')}
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                </Stack>
                {changeStatus.isError ? <Alert severity="error">{t('errors.statusFailed')}</Alert> : null}
                {isPending ? (
                    <CircularProgress data-test="pipeline-loading" />
                ) : isError ? (
                    <Alert severity="error">{t('errors.loadFailed')}</Alert>
                ) : (
                    <Stack spacing={2}>
                        {applications.data.items.length === 0 ? <Typography>{t('empty')}</Typography> : null}
                        {view === 'board' ? (
                            <PipelineBoard
                                applications={applications.data.items}
                                onChangeStatus={(applicationId, statusId) =>
                                    changeStatus.mutate({ applicationId, statusId })
                                }
                                pendingApplicationId={
                                    changeStatus.isPending ? changeStatus.variables?.applicationId : undefined
                                }
                                statuses={statuses.data.items}
                            />
                        ) : (
                            <PipelineTable
                                applications={applications.data.items}
                                onChangeStatus={(applicationId, statusId) =>
                                    changeStatus.mutate({ applicationId, statusId })
                                }
                                pendingApplicationId={
                                    changeStatus.isPending ? changeStatus.variables?.applicationId : undefined
                                }
                                statuses={statuses.data.items}
                            />
                        )}
                    </Stack>
                )}
            </Stack>
        </Box>
    );
}
