import type { ApplicationCvVersionSummary, CvChange, CvChangeState } from '@matchbox/shared';
import { Alert, Button, Chip, CircularProgress, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { AiUnavailable } from 'src/components/AiUnavailable/AiUnavailable';
import { ApiError } from 'src/lib/http/http-client';
import { formatDate } from 'src/utils/format.utils';

import { useCvChanges, useDecideCvChange, useSaveJobCv, useTailorCv } from '../../api/job.queries';

const STATE_LABELS = {
    proposed: 'cv.proposed',
    accepted: 'cv.accepted',
    rejected: 'cv.rejected',
    blocked: 'cv.blocked',
} as const satisfies Record<CvChangeState, `cv.${CvChangeState}`>;

type CvPanelProps = {
    applicationId: string;
    jobId: string;
    versions: ApplicationCvVersionSummary[];
};

export function CvPanel({ applicationId, jobId, versions }: CvPanelProps) {
    const { t, i18n } = useTranslation('job');
    const changes = useCvChanges(applicationId);
    const tailor = useTailorCv(jobId, applicationId);
    const decide = useDecideCvChange(applicationId);
    const save = useSaveJobCv(jobId, applicationId);
    const items = changes.data?.changes ?? [];
    const canSave = items.some((change) => change.state === 'accepted');
    const tailorUnavailable =
        tailor.error instanceof ApiError && (tailor.error.code === 'AI_UNAVAILABLE' || tailor.error.statusCode === 429);

    return (
        <Stack spacing={3}>
            {tailor.isError ? (
                tailorUnavailable ? (
                    <AiUnavailable
                        message={t('cv.unavailable')}
                        onRetry={() => {
                            tailor.mutate();
                        }}
                        pending={tailor.isPending}
                    />
                ) : (
                    <Alert severity="error">{isDraftClosed(tailor.error) ? t('cv.draftClosed') : t('cv.tailorFailed')}</Alert>
                )
            ) : null}
            {save.isError ? (
                <Alert severity="error">{isDraftClosed(save.error) ? t('cv.draftClosed') : t('cv.saveFailed')}</Alert>
            ) : null}
            {save.data && !save.data.githubSynced ? <Alert severity="info">{t('cv.savedWithoutGithub')}</Alert> : null}
            <Button
                data-test="job-tailor-button"
                disabled={tailor.isPending}
                onClick={() => {
                    tailor.mutate();
                }}
                variant="contained"
            >
                {items.length > 0 ? t('actions.tailorAgain') : t('actions.tailorCv')}
            </Button>
            {changes.isPending ? <CircularProgress data-test="job-cv-loading" /> : null}
            {changes.isError ? <Alert severity="error">{t('cv.loadFailed')}</Alert> : null}
            {items.length > 0 ? (
                <Stack spacing={2}>
                    <Typography color="text.secondary">{t('cv.replaces')}</Typography>
                    {items.map((change) => (
                        <CvChangeCard
                            change={change}
                            key={change.id}
                            onDecide={(decision) => {
                                if (change.state !== decision) {
                                    decide.mutate({ changeId: change.id, decision });
                                }
                            }}
                            pending={decide.isPending}
                        />
                    ))}
                    <Button
                        data-test="job-save-cv-button"
                        disabled={!canSave || save.isPending}
                        onClick={() => {
                            save.mutate();
                        }}
                        variant="contained"
                    >
                        {t('actions.saveVersion')}
                    </Button>
                </Stack>
            ) : null}
            {!changes.isPending && items.length === 0 && versions.length === 0 ? (
                <Stack spacing={2}>
                    <Typography>{t('cv.empty')}</Typography>
                    <Button component={RouterLink} data-test="job-open-base-cv-button" to="/cv" variant="outlined">
                        {t('actions.openBaseCv')}
                    </Button>
                </Stack>
            ) : null}
            {versions.length > 0 ? (
                <Stack component="ul" spacing={1} sx={{ m: 0, pl: 3 }}>
                    {versions.map((version) => (
                        <Typography component="li" key={version.id}>
                            {t('cv.version', {
                                date: formatDate(version.createdAt, i18n.language),
                                label: version.commitSha
                                    ? t('cv.committed', { sha: version.commitSha.slice(0, 7) })
                                    : t('cv.savedLocally'),
                            })}
                        </Typography>
                    ))}
                </Stack>
            ) : null}
        </Stack>
    );
}

type CvChangeCardProps = {
    change: CvChange;
    pending: boolean;
    onDecide: (decision: 'accepted' | 'rejected') => void;
};

function isDraftClosed(error: unknown): boolean {
    return error instanceof ApiError && error.statusCode === 409;
}

function CvChangeCard({ change, pending, onDecide }: CvChangeCardProps) {
    const { t } = useTranslation('job');

    return (
        <Stack data-test={`cv-change-${change.id}`} spacing={1}>
            <Chip label={t(STATE_LABELS[change.state])} size="small" sx={{ alignSelf: 'flex-start' }} />
            {change.before ? <Typography color="text.secondary">{change.before}</Typography> : null}
            <Typography>{change.after}</Typography>
            {change.rationale ? <Typography color="text.secondary">{change.rationale}</Typography> : null}
            {change.evidence.length > 0 ? (
                <Typography color="text.secondary">
                    {t('cv.evidence')}: {change.evidence.map((item) => item.label || t('cv.evidenceUnavailable')).join(', ')}
                </Typography>
            ) : null}
            {change.state === 'blocked' ? (
                <Typography>{change.blocked_reason}</Typography>
            ) : (
                <Stack direction="row" spacing={1}>
                    <Button
                        data-test={`cv-change-accept-${change.id}`}
                        disabled={pending}
                        onClick={() => {
                            onDecide('accepted');
                        }}
                        variant={change.state === 'accepted' ? 'contained' : 'outlined'}
                    >
                        {t('actions.accept')}
                    </Button>
                    <Button
                        data-test={`cv-change-reject-${change.id}`}
                        disabled={pending}
                        onClick={() => {
                            onDecide('rejected');
                        }}
                        variant={change.state === 'rejected' ? 'contained' : 'text'}
                    >
                        {t('actions.reject')}
                    </Button>
                </Stack>
            )}
        </Stack>
    );
}
