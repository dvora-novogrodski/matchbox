import type { TodayApplication, TodayMatch } from '@matchbox/shared';
import { AIIcon, Box, Button, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { CompanyLogo } from 'src/components/CompanyLogo';
import { formatRelativeTime } from 'src/utils/format.utils';

import { TodayMatchScore } from '../TodayMatchScore';

type TodayMatchCardProps = {
    item: TodayMatch;
};

export function TodayMatchCard({ item }: TodayMatchCardProps) {
    const { t } = useTranslation('today');

    return (
        <Stack
            data-test={`today-match-${item.jobId}`}
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}
        >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
                <CompanyLogo
                    companyName={item.companyName}
                    data-test={`today-match-logo-${item.jobId}`}
                    jobUrl={item.jobUrl}
                    size={28}
                />
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }} noWrap>
                        {t('card.matchTitle', { title: item.title })}
                    </Typography>
                    <Typography color="text.secondary" noWrap sx={{ fontSize: '0.8125rem' }} variant="body2">
                        {item.companyName}
                    </Typography>
                </Box>
            </Stack>
            <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: 'center', flexShrink: 0, justifyContent: 'flex-end' }}
            >
                <TodayMatchScore score={item.score} />
                <Button
                    aria-label={t('actions.reviewLabel', { title: item.title })}
                    component={RouterLink}
                    data-test={`today-review-${item.jobId}`}
                    size="small"
                    to="/discover"
                    variant="outlined"
                >
                    {t('actions.review')}
                </Button>
            </Stack>
        </Stack>
    );
}

type TodayApplicationCardProps = {
    item: TodayApplication;
    kind: 'tailor' | 'follow-up';
};

export function TodayApplicationCard({ item, kind }: TodayApplicationCardProps) {
    const { t, i18n } = useTranslation('today');
    const when = formatRelativeTime(item.lastActivityAt, i18n.language);
    const to = kind === 'tailor' ? `/jobs/${item.jobId}/cv` : `/jobs/${item.jobId}/timeline`;
    const label =
        kind === 'tailor' ? t('actions.tailorLabel', { title: item.title }) : t('actions.openLabel', { title: item.title });
    const title =
        kind === 'tailor'
            ? t('card.tailorTitle')
            : t('card.followUpTitle', { company: item.companyName });

    return (
        <Stack
            data-test={`today-${kind}-${item.applicationId}`}
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}
        >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
                <CompanyLogo
                    companyName={item.companyName}
                    data-test={`today-application-logo-${item.applicationId}`}
                    jobUrl={item.jobUrl}
                    size={28}
                />
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }} noWrap>{title}</Typography>
                    <Typography color="text.secondary" noWrap sx={{ fontSize: '0.8125rem' }} variant="body2">
                        {item.title} · {item.companyName} · {t('card.lastActivity', { when })}
                    </Typography>
                </Box>
            </Stack>
            <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: 'center', flexShrink: 0, justifyContent: 'flex-end' }}
            >
                {kind === 'follow-up' ? (
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        <Box
                            aria-hidden
                            sx={{ bgcolor: 'accent.main', borderRadius: '50%', flexShrink: 0, height: 8, width: 8 }}
                        />
                        <Typography sx={{ color: 'accentText', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                            {t('card.statusFollowUp')}
                        </Typography>
                    </Stack>
                ) : (
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        <Box
                            aria-hidden
                            sx={{ bgcolor: 'text.secondary', borderRadius: '50%', flexShrink: 0, height: 8, width: 8 }}
                        />
                        <Typography sx={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }} variant="body2">
                            {t('card.statusToTailor')}
                        </Typography>
                    </Stack>
                )}
                <Button
                    aria-label={label}
                    color={kind === 'tailor' ? 'accent' : 'primary'}
                    component={RouterLink}
                    data-test={`today-${kind}-button-${item.applicationId}`}
                    size="small"
                    startIcon={kind === 'tailor' ? <AIIcon fontSize="small" /> : undefined}
                    to={to}
                    variant={kind === 'tailor' ? 'text' : 'outlined'}
                >
                    {kind === 'tailor' ? t('actions.tailor') : t('actions.followUp')}
                </Button>
            </Stack>
        </Stack>
    );
}
