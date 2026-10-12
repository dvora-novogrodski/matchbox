import type { UpdateApplication, WorkMode } from '@matchbox/shared';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Stack,
    Tab,
    Tabs,
    Typography,
    useTheme,
} from '@matchbox/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { statusLabel, statusTone, useStatuses } from 'src/features/pipeline';
import { ApiError } from 'src/lib/http/http-client';

import { useChangeJobStatus, useJobPage, useUpdateApplication } from '../../api/job.queries';
import { CvPanel } from '../../components/CvPanel';
import { KitPanel } from '../../components/KitPanel';
import { MatchPanel } from '../../components/MatchPanel';
import { OverviewPanel } from '../../components/OverviewPanel';
import { TimelinePanel } from '../../components/TimelinePanel';
import { type JobPrimaryAction, jobPrimaryAction } from '../../job-action';
import { isJobTab, jobPath, type JobTab } from '../../job-tab';

const WORK_MODE_LABELS = {
    onsite: 'workMode.onsite',
    hybrid: 'workMode.hybrid',
    remote: 'workMode.remote',
} as const satisfies Record<WorkMode, `workMode.${WorkMode}`>;

const PRIMARY_ACTION_LABELS = {
    tailorCv: 'actions.tailorCv',
    prepareToApply: 'actions.prepareToApply',
    markApplied: 'actions.markApplied',
} as const satisfies Record<JobPrimaryAction, `actions.${JobPrimaryAction}`>;

export function JobPage() {
    const { jobId = '', tab: tabParam } = useParams();
    const { t } = useTranslation('job');
    const { t: tCommon } = useTranslation('common');
    const navigate = useNavigate();
    const theme = useTheme();
    const [appliedStatusMissing, setAppliedStatusMissing] = useState(false);
    const job = useJobPage(jobId);
    const statuses = useStatuses();
    const updateApplication = useUpdateApplication(jobId);
    const changeStatus = useChangeJobStatus(jobId);

    if (jobId.length > 0 && tabParam !== undefined && !isJobTab(tabParam)) {
        return <Navigate replace to={jobPath(jobId)} />;
    }

    const tab: JobTab = isJobTab(tabParam) ? tabParam : 'overview';
    const isPending = job.isLoading || statuses.isLoading;
    const isError = job.isError || statuses.isError;
    const application = job.data?.application;
    const action =
        application === undefined
            ? null
            : jobPrimaryAction({
                  appliedAt: application.appliedAt,
                  category: application.status.category,
                  cvVersionCount: job.data?.cvVersions.length ?? 0,
                  tab,
              });

    function openTab(next: JobTab) {
        void navigate(jobPath(jobId, next));
    }

    function runPrimaryAction() {
        if (action === 'tailorCv') {
            openTab('cv');
            return;
        }
        if (action === 'prepareToApply') {
            openTab('kit');
            return;
        }
        if (!application) {
            return;
        }
        const applied = statuses.data?.items.find((status) => status.key === 'applied');
        if (!applied) {
            setAppliedStatusMissing(true);
            return;
        }
        setAppliedStatusMissing(false);
        changeStatus.mutate({ applicationId: application.id, statusId: applied.id });
    }

    return (
        <Box component="main" sx={{ p: 4 }}>
            <Stack spacing={3}>
                <Button component={RouterLink} data-test="job-back-button" sx={{ alignSelf: 'flex-start' }} to="/pipeline" variant="text">
                    {t('actions.backToPipeline')}
                </Button>
                {isPending ? (
                    <CircularProgress data-test="job-loading" />
                ) : isError ? (
                    <Alert severity="error">
                        {job.error instanceof ApiError && job.error.statusCode === 404
                            ? t('errors.notFound')
                            : t('errors.loadFailed')}
                    </Alert>
                ) : application && job.data && statuses.data ? (
                    <JobContent
                        action={action}
                        appliedStatusMissing={appliedStatusMissing}
                        onChangeStatus={(statusId) => changeStatus.mutate({ applicationId: application.id, statusId })}
                        onPrimaryAction={runPrimaryAction}
                        onSave={(input) => updateApplication.mutate({ applicationId: application.id, input })}
                        openTab={openTab}
                        page={job.data}
                        saveError={updateApplication.isError}
                        saving={updateApplication.isPending}
                        statusError={changeStatus.isError}
                        statusName={statusLabel(application.status, tCommon)}
                        statusPending={changeStatus.isPending}
                        statuses={statuses.data.items}
                        tab={tab}
                        tone={statusTone(theme, application.status.category, application.status.color)}
                        workModeLabel={application.job.workMode ? t(WORK_MODE_LABELS[application.job.workMode]) : null}
                    />
                ) : null}
            </Stack>
        </Box>
    );
}

type JobContentProps = {
    page: NonNullable<ReturnType<typeof useJobPage>['data']>;
    statuses: NonNullable<ReturnType<typeof useStatuses>['data']>['items'];
    tab: JobTab;
    action: JobPrimaryAction | null;
    statusName: string;
    workModeLabel: string | null;
    tone: { bg: string; fg: string };
    saving: boolean;
    statusPending: boolean;
    saveError: boolean;
    statusError: boolean;
    appliedStatusMissing: boolean;
    openTab: (tab: JobTab) => void;
    onPrimaryAction: () => void;
    onSave: (input: UpdateApplication) => void;
    onChangeStatus: (statusId: string) => void;
};

function JobContent({
    page,
    statuses,
    tab,
    action,
    statusName,
    workModeLabel,
    tone,
    saving,
    statusPending,
    saveError,
    statusError,
    appliedStatusMissing,
    openTab,
    onPrimaryAction,
    onSave,
    onChangeStatus,
}: JobContentProps) {
    const { t } = useTranslation('job');
    const application = page.application;

    return (
        <Stack spacing={3}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between' }}
            >
                <Stack spacing={1}>
                    <Typography component="h1" variant="h3">
                        {application.job.title}
                    </Typography>
                    <Typography color="text.secondary">{application.job.companyName}</Typography>
                    {application.job.location || workModeLabel ? (
                        <Stack direction="row" spacing={2}>
                            {application.job.location ? <Typography>{application.job.location}</Typography> : null}
                            {workModeLabel ? <Typography>{workModeLabel}</Typography> : null}
                        </Stack>
                    ) : null}
                    <Chip data-test="job-status-chip" label={statusName} size="small" sx={{ alignSelf: 'flex-start', bgcolor: tone.bg, color: tone.fg }} />
                </Stack>
                {action ? (
                    <Button
                        data-test="job-primary-action-button"
                        disabled={statusPending}
                        onClick={onPrimaryAction}
                        variant="contained"
                    >
                        {t(PRIMARY_ACTION_LABELS[action])}
                    </Button>
                ) : null}
            </Stack>
            {statusError ? <Alert severity="error">{t('errors.statusFailed')}</Alert> : null}
            {appliedStatusMissing ? <Alert severity="error">{t('errors.appliedStatusMissing')}</Alert> : null}
            <Tabs
                aria-label={t('tabs.label')}
                onChange={(_event, next: unknown) => {
                    if (typeof next === 'string' && isJobTab(next)) {
                        openTab(next);
                    }
                }}
                value={tab}
            >
                <Tab data-test="job-tab-overview" label={t('tabs.overview')} value="overview" />
                <Tab data-test="job-tab-match" label={t('tabs.match')} value="match" />
                <Tab data-test="job-tab-cv" label={t('tabs.cv')} value="cv" />
                <Tab data-test="job-tab-kit" label={t('tabs.kit')} value="kit" />
                <Tab data-test="job-tab-timeline" label={t('tabs.timeline')} value="timeline" />
            </Tabs>
            {tab === 'overview' ? (
                    <OverviewPanel
                    isSaving={saving}
                    isStatusPending={statusPending}
                    onChangeStatus={onChangeStatus}
                    onSave={onSave}
                    page={page}
                    saveError={saveError}
                    statuses={statuses}
                />
            ) : null}
            {tab === 'match' ? <MatchPanel jobId={application.job.id} requirements={page.requirements} /> : null}
            {tab === 'cv' ? <CvPanel applicationId={application.id} jobId={application.job.id} versions={page.cvVersions} /> : null}
            {tab === 'kit' ? <KitPanel companyName={application.job.companyName} title={application.job.title} /> : null}
            {tab === 'timeline' ? <TimelinePanel events={page.events} statuses={statuses} /> : null}
        </Stack>
    );
}
