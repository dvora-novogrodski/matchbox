import type { JobRequirement, MatchCoverage } from '@matchbox/shared';
import {
    AIIcon,
    Box,
    CheckCircleOutlineIcon,
    CircularProgress,
    RemoveCircleOutlineIcon,
    Stack,
    Typography,
    WarningAmberIcon,
} from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { AiUnavailable } from 'src/components/AiUnavailable/AiUnavailable';
import { EmptyIllustration } from 'src/components/EmptyIllustration';
import { illustrations } from 'src/constants/media';
import { ApiError } from 'src/lib/http/http-client';

import { useJobMatch } from '../../api/job.queries';

const COVERAGE_LABELS = {
    covered: 'match.covered',
    partial: 'match.partial',
    missing: 'match.missing',
} as const satisfies Record<MatchCoverage, `match.${MatchCoverage}`>;

type MatchPanelProps = {
    jobId: string;
    requirements: JobRequirement[];
};

export function MatchPanel({ jobId, requirements }: MatchPanelProps) {
    const { t } = useTranslation('job');
    const match = useJobMatch(jobId);
    const unavailable =
        match.error instanceof ApiError && (match.error.code === 'AI_UNAVAILABLE' || match.error.statusCode === 429);

    if (match.isPending) {
        return <CircularProgress data-test="job-match-loading" />;
    }
    if (match.isError) {
        return (
            <AiUnavailable
                message={unavailable ? t('match.unavailable') : t('match.loadFailed')}
                onRetry={() => {
                    void match.refetch();
                }}
                pending={match.isFetching}
            />
        );
    }
    if (!match.data.match) {
        return (
            <Stack data-test="job-match-empty" spacing={1.5} sx={{ alignItems: 'center', py: 3, textAlign: 'center' }}>
                <EmptyIllustration src={illustrations.emptyMatch} />
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('match.emptyTitle')}</Typography>
                <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', maxWidth: 360 }} variant="body2">
                    {t('match.empty')}
                </Typography>
            </Stack>
        );
    }

    return (
        <Stack spacing={2}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <AIIcon aria-hidden color="accent" fontSize="small" />
                <Typography component="h2" data-test="job-match-score" sx={{ color: 'accentText', fontWeight: 600 }} variant="h6">
                    {t('match.scoreLabel', { score: match.data.match.score })}
                </Typography>
            </Stack>
            <Stack component="ul" spacing={2} sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {match.data.match.requirements.map((requirement, position) => (
                    <Stack
                        component="li"
                        key={`${requirement.requirement_index}-${position}`}
                        spacing={0.75}
                        sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            p: 2,
                        }}
                    >
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            {requirements[requirement.requirement_index]?.text ?? t('match.requirementUnavailable')}
                        </Typography>
                        <MatchCoverageLabel coverage={requirement.coverage} label={t(COVERAGE_LABELS[requirement.coverage])} />
                        <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }} variant="body2">
                            {requirement.reason}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        </Stack>
    );
}

function MatchCoverageLabel({ coverage, label }: { coverage: MatchCoverage; label: string }) {
    const icon =
        coverage === 'covered' ? (
            <CheckCircleOutlineIcon color="success" fontSize="small" />
        ) : coverage === 'partial' ? (
            <WarningAmberIcon color="warning" fontSize="small" />
        ) : (
            <RemoveCircleOutlineIcon color="disabled" fontSize="small" />
        );

    return (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box sx={{ display: 'flex', flexShrink: 0 }}>{icon}</Box>
            <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', fontWeight: 500 }} variant="body2">
                {label}
            </Typography>
        </Stack>
    );
}
