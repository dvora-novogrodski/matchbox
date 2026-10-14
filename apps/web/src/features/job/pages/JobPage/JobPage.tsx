import type { UpdateApplication, WorkMode } from '@matchbox/shared';
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    Stack,
    Tab,
    Tabs,
} from '@matchbox/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStatuses } from 'src/features/pipeline';
import { ApiError } from 'src/lib/http/http-client';

import { useChangeJobStatus, useJobPage, useUpdateApplication } from '../../api/job.queries';
import { CvPanel } from '../../components/CvPanel';
import { JobHeader } from '../../components/JobHeader';
import { KitPanel } from '../../components/KitPanel';
import { MatchPanel } from '../../components/MatchPanel';
import { OverviewPanel } from '../../components/OverviewPanel';
import { TimelinePanel } from '../../components/TimelinePanel';
import { jobPrimaryAction } from '../../job-action';
import { isJobTab, jobPath, type JobTab } from '../../job-tab';

const WORK_MODE_LABELS = {
    onsite: 'workMode.onsite',
    hybrid: 'workMode.hybrid',
    remote: 'workMode.remote',
} as const satisfies Record<WorkMode, `workMode.${WorkMode}`>;

export function JobPage() {
    const { jobId = '', tab: tabParam } = useParams();
    const { t, i18n } = useTranslation('job');
    const navigate = useNavigate();
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
                    language={i18n.language}
                    onChangeStatus={(statusId) => changeStatus.mutate({ applicationId: application.id, statusId })}
                    onPrimaryAction={runPrimaryAction}
                    onSave={(input) => updateApplication.mutate({ applicationId: application.id, input })}
                    openTab={openTab}
                    page={job.data}
                    saveError={updateApplication.isError}
                    saving={updateApplication.isPending}
                    statusError={changeStatus.isError}
                    statusPending={changeStatus.isPending}
                    statuses={statuses.data.items}
                    tab={tab}
                    workModeLabel={application.job.workMode ? t(WORK_MODE_LABELS[application.job.workMode]) : null}
                />
            ) : null}
        </Stack>
    );
}

type JobContentProps = {
    page: NonNullable<ReturnType<typeof useJobPage>['data']>;
    statuses: NonNullable<ReturnType<typeof useStatuses>['data']>['items'];
    tab: JobTab;
    action: ReturnType<typeof jobPrimaryAction>;
    workModeLabel: string | null;
    language: string;
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
    workModeLabel,
    language,
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
            <JobHeader
                action={action}
                application={application}
                language={language}
                onChangeStatus={onChangeStatus}
                onPrimaryAction={onPrimaryAction}
                statusPending={statusPending}
                statuses={statuses}
                workModeLabel={workModeLabel}
            />
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
                <Tab
                    aria-label={t('tabs.cv')}
                    data-test="job-tab-cv"
                    label={
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                            <span>{t('tabs.cv')}</span>
                            <Chip
                                label={t('tabs.aiBadge')}
                                size="small"
                                sx={{ bgcolor: 'accentTint', color: 'accentText', height: 20 }}
                            />
                        </Stack>
                    }
                    value="cv"
                />
                <Tab data-test="job-tab-kit" label={t('tabs.kit')} value="kit" />
                <Tab data-test="job-tab-timeline" label={t('tabs.timeline')} value="timeline" />
            </Tabs>
            {tab === 'overview' ? (
                <OverviewPanel isSaving={saving} onSave={onSave} page={page} saveError={saveError} />
            ) : null}
            {tab === 'match' ? <MatchPanel jobId={application.job.id} requirements={page.requirements} /> : null}
            {tab === 'cv' ? <CvPanel applicationId={application.id} jobId={application.job.id} versions={page.cvVersions} /> : null}
            {tab === 'kit' ? (
                <KitPanel
                    applicationId={application.id}
                    companyName={application.job.companyName}
                    title={application.job.title}
                />
            ) : null}
            {tab === 'timeline' ? (
                <TimelinePanel
                    applicationId={application.id}
                    events={page.events}
                    jobId={application.job.id}
                    statuses={statuses}
                />
            ) : null}
        </Stack>
    );
}
