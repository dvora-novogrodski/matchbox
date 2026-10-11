import type { JobRequirement, MatchCoverage } from '@matchbox/shared';
import { Chip, CircularProgress, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { AiUnavailable } from 'src/components/AiUnavailable/AiUnavailable';
import { ApiError } from 'src/lib/http/http-client';

import { useJobMatch } from '../../api/job.queries';

const COVERAGE_LABELS = {
    covered: 'match.covered',
    partial: 'match.partial',
    missing: 'match.missing',
} as const satisfies Record<MatchCoverage, `match.${MatchCoverage}`>;

const COVERAGE_COLORS = {
    covered: 'success',
    partial: 'warning',
    missing: 'default',
} as const satisfies Record<MatchCoverage, 'success' | 'warning' | 'default'>;

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
        return <Typography data-test="job-match-empty">{t('match.empty')}</Typography>;
    }

    return (
        <Stack spacing={2}>
            <Typography component="h2" data-test="job-match-score" variant="h4">
                {t('match.score', { score: match.data.match.score })}
            </Typography>
            <Stack component="ul" spacing={2} sx={{ m: 0, pl: 3 }}>
                {match.data.match.requirements.map((requirement, position) => (
                    <Stack component="li" key={`${requirement.requirement_index}-${position}`} spacing={0.5}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Typography>
                                {requirements[requirement.requirement_index]?.text ?? t('match.requirementUnavailable')}
                            </Typography>
                            <Chip
                                color={COVERAGE_COLORS[requirement.coverage]}
                                label={t(COVERAGE_LABELS[requirement.coverage])}
                                size="small"
                            />
                        </Stack>
                        <Typography color="text.secondary">{requirement.reason}</Typography>
                    </Stack>
                ))}
            </Stack>
        </Stack>
    );
}
