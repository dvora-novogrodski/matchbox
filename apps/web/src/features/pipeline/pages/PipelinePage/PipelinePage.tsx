import type { Application } from '@matchbox/shared';
import { PLANS } from '@matchbox/shared';
import {
    Alert,
    Button,
    Card,
    CircularProgress,
    InputAdornment,
    MenuItem,
    SearchIcon,
    Select,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@matchbox/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { EmptyIllustration } from 'src/components/EmptyIllustration';
import { PageLayout } from 'src/components/PageLayout';
import { illustrations } from 'src/constants/media';

import { useApplications, useChangeApplicationStatus, useStatuses } from '../../api/applications.queries';
import { PipelineBoard } from '../../components/PipelineBoard';
import { PipelineTable } from '../../components/PipelineTable';
import { type PipelineView, pipelineViewFromParam } from '../../pipeline-view';

type PipelineFilter = 'all' | 'active' | 'follow-up' | 'interviews' | 'closed';

export function PipelinePage() {
    const { t } = useTranslation('pipeline');
    const [searchParams, setSearchParams] = useSearchParams();
    const view = pipelineViewFromParam(searchParams.get('view'));
    const statuses = useStatuses();
    const applications = useApplications();
    const changeStatus = useChangeApplicationStatus();
    const [renderedAt] = useState(() => Date.now());
    const filter = pipelineFilterFromParam(searchParams.get('filter'));
    const query = searchParams.get('q') ?? '';

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
    const applicationItems = applications.data?.items ?? [];
    const filteredApplications = applicationItems.filter((application) =>
        matchesPipelineFilter(application, filter, query, renderedAt),
    );
    const activeCount = applicationItems.filter(
        (application) => application.status.category !== 'closed',
    ).length;
    const description = applications.data
        ? t('page.summary', { active: activeCount, count: applicationItems.length })
        : t('page.description');

    function updateFilters(update: { filter?: PipelineFilter; query?: string }) {
        const params = new URLSearchParams(searchParams);
        if (update.filter !== undefined) {
            if (update.filter === 'all') {
                params.delete('filter');
            } else {
                params.set('filter', update.filter);
            }
        }
        if (update.query !== undefined) {
            const nextQuery = update.query.trimStart();
            if (nextQuery.length === 0) {
                params.delete('q');
            } else {
                params.set('q', nextQuery);
            }
        }
        params.delete('page');
        setSearchParams(params, { replace: true });
    }

    return (
        <PageLayout
            actions={
                <ToggleButtonGroup
                    aria-label={t('view.label')}
                    exclusive
                    onChange={(_event, next: unknown) => {
                        if (next === 'board' || next === 'table') {
                            setView(next);
                        }
                    }}
                    size="small"
                    value={view}
                >
                    <ToggleButton data-test="pipeline-view-board-button" value="board">
                        {t('view.board')}
                    </ToggleButton>
                    <ToggleButton data-test="pipeline-view-table-button" value="table">
                        {t('view.table')}
                    </ToggleButton>
                </ToggleButtonGroup>
            }
            description={description}
            title={t('page.title')}
            width="full"
        >
            <Stack spacing={3}>
                {changeStatus.isError ? <Alert severity="error">{t('errors.statusFailed')}</Alert> : null}
                {isPending ? (
                    <CircularProgress data-test="pipeline-loading" />
                ) : isError ? (
                    <Alert severity="error">{t('errors.loadFailed')}</Alert>
                ) : (
                    <Stack spacing={2}>
                        <Card sx={{ p: 2 }} variant="outlined">
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1.5}
                                sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
                            >
                                <Select
                                    aria-label={t('filters.label')}
                                    onChange={(event) =>
                                        updateFilters({ filter: pipelineFilterFromParam(event.target.value) })
                                    }
                                    size="small"
                                    value={filter}
                                >
                                    <MenuItem value="all">{t('filters.all')}</MenuItem>
                                    <MenuItem value="active">{t('filters.active')}</MenuItem>
                                    <MenuItem value="follow-up">{t('filters.followUp')}</MenuItem>
                                    <MenuItem value="interviews">{t('filters.interviews')}</MenuItem>
                                    <MenuItem value="closed">{t('filters.closed')}</MenuItem>
                                </Select>
                                <TextField
                                    aria-label={t('filters.search')}
                                    onChange={(event) => updateFilters({ query: event.target.value })}
                                    placeholder={t('filters.search')}
                                    size="small"
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                    value={query}
                                />
                            </Stack>
                        </Card>
                        {applicationItems.length === 0 ? (
                            <Stack spacing={1.5} sx={{ alignItems: 'center', py: 4, textAlign: 'center' }}>
                                <EmptyIllustration src={illustrations.emptyPipeline} />
                                <Typography component="h2" variant="h5">{t('emptyTitle')}</Typography>
                                <Typography color="text.secondary" variant="body2">{t('empty')}</Typography>
                                <Button component={RouterLink} to="/jobs/new" variant="contained">
                                    {t('actions.addJob')}
                                </Button>
                            </Stack>
                        ) : null}
                        {view === 'board' ? (
                            <PipelineBoard
                                applications={filteredApplications}
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
                                applications={filteredApplications}
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
        </PageLayout>
    );
}

function pipelineFilterFromParam(value: string | null): PipelineFilter {
    if (value === 'active' || value === 'follow-up' || value === 'interviews' || value === 'closed') {
        return value;
    }
    return 'all';
}

function matchesPipelineFilter(
    application: Application,
    filter: PipelineFilter,
    query: string,
    renderedAt: number,
): boolean {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matchesQuery =
        normalizedQuery.length === 0 ||
        application.job.companyName.toLocaleLowerCase().includes(normalizedQuery) ||
        application.job.title.toLocaleLowerCase().includes(normalizedQuery);
    if (!matchesQuery || filter === 'all') {
        return matchesQuery;
    }
    if (filter === 'active') {
        return application.status.category !== 'closed';
    }
    if (filter === 'interviews') {
        return application.status.category === 'interviewing';
    }
    if (filter === 'closed') {
        return application.status.category === 'closed';
    }
    const followUpThreshold =
        renderedAt - PLANS.owner['followUp.afterDays'] * 24 * 60 * 60 * 1000;
    return (
        (application.status.category === 'active' || application.status.category === 'interviewing') &&
        new Date(application.lastActivityAt).getTime() < followUpThreshold
    );
}
