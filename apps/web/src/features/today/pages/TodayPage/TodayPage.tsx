import type { Today, TodayApplication, TodayMatch } from '@matchbox/shared';
import { AIIcon, Alert, Box, Button, Card, CircularProgress, Divider, Link, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { CoverImage } from 'src/components/CoverImage';
import { EmptyIllustration } from 'src/components/EmptyIllustration';
import { PageLayout } from 'src/components/PageLayout';
import { illustrations, photos } from 'src/constants/media';
import { useCurrentUser } from 'src/features/auth';

import { useToday } from '../../api/today.queries';
import { TodayApplicationCard, TodayMatchCard } from '../../components/TodayCard';
import { TodayStatTiles } from '../../components/TodayStatTiles';
import { dayPeriodFromHour, needsYouCount } from '../../today-greeting.utils';

export function TodayPage() {
    const { t, i18n } = useTranslation('today');
    const { t: tCommon } = useTranslation();
    const currentUser = useCurrentUser();
    const today = useToday();

    const name =
        currentUser.data?.displayName?.trim() ||
        currentUser.data?.email?.split('@')[0] ||
        tCommon('nav.userFallback');
    const period = dayPeriodFromHour(new Date().getHours());
    const dateLabel = new Intl.DateTimeFormat(i18n.language, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(new Date());

    const description =
        today.data === undefined
            ? undefined
            : needsYouCount(today.data.stats) === 0
              ? t('greeting.caughtUp', { date: dateLabel })
              : t('greeting.needsYou', {
                    count: needsYouCount(today.data.stats),
                    date: dateLabel,
                });

    return (
        <PageLayout
            cover={<CoverImage alt="" height={180} src={photos.todayCover} />}
            description={description}
            title={t(`greeting.${period}`, { name })}
        >
            {today.isPending ? (
                <CircularProgress data-test="today-loading" />
            ) : today.isError ? (
                <Alert severity="error">{t('errors.loadFailed')}</Alert>
            ) : (
                <TodayContent today={today.data} />
            )}
        </PageLayout>
    );
}

function TodayContent({ today }: { today: Today }) {
    const { t } = useTranslation('today');
    const nextItems = buildNextUpItems(today);
    const caughtUp = nextItems.length === 0;
    const topMatch = today.matches[0];

    return (
        <Stack spacing={3}>
            <TodayStatTiles stats={today.stats} />
            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', lg: topMatch ? '1fr 280px' : '1fr' },
                }}
            >
                <Card sx={{ p: 0 }}>
                    <Stack
                        direction="row"
                        sx={{
                            alignItems: 'center',
                            borderBottom: 1,
                            borderColor: 'divider',
                            justifyContent: 'space-between',
                            px: 2,
                            py: 1.5,
                        }}
                    >
                        <Typography component="h2" sx={{ fontSize: '1rem', fontWeight: 600 }} variant="h6">
                            {t('sections.nextUp')}
                        </Typography>
                        <Link component={RouterLink} sx={{ fontSize: '0.8125rem' }} to="/pipeline" underline="hover">
                            {t('sections.viewAll')}
                        </Link>
                    </Stack>
                    {caughtUp ? (
                        <Stack spacing={1.5} sx={{ alignItems: 'center', p: 3, textAlign: 'center' }}>
                            <EmptyIllustration src={illustrations.emptyToday} />
                            <Typography sx={{ fontWeight: 600 }}>{t('empty')}</Typography>
                            <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', maxWidth: 360 }} variant="body2">
                                {t('emptyHint')}
                            </Typography>
                            <Button component={RouterLink} to="/discover" variant="outlined">
                                {t('actions.openDiscover')}
                            </Button>
                        </Stack>
                    ) : (
                        nextItems.map((item, index) => (
                            <Box key={item.kind === 'match' ? item.data.jobId : item.data.applicationId}>
                                {item.kind === 'match' ? (
                                    <TodayMatchCard item={item.data} />
                                ) : (
                                    <TodayApplicationCard item={item.data} kind={item.kind} />
                                )}
                                {index < nextItems.length - 1 ? <Divider /> : null}
                            </Box>
                        ))
                    )}
                </Card>
                {topMatch ? (
                    <Card>
                        <Stack spacing={1.5} sx={{ p: 2 }}>
                            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                                <AIIcon color="accent" fontSize="small" />
                                <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>
                                    {t('sections.aiCardTitle', { count: today.stats.matches })}
                                </Typography>
                            </Stack>
                            <Typography sx={{ fontSize: '0.8125rem' }}>
                                {t('sections.aiCardTopMatch', { company: topMatch.companyName })}
                            </Typography>
                            <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }} variant="body2">
                                {t('sections.aiCardRole', { score: topMatch.score, title: topMatch.title })}
                            </Typography>
                            <Button color="accent" component={RouterLink} to="/discover" variant="contained">
                                {t('actions.openDiscover')}
                            </Button>
                        </Stack>
                    </Card>
                ) : null}
            </Box>
        </Stack>
    );
}

type NextUpItem =
    | { data: TodayMatch; kind: 'match' }
    | { data: TodayApplication; kind: 'follow-up' | 'tailor' };

function buildNextUpItems(today: Today): NextUpItem[] {
    const items: NextUpItem[] = [];
    for (const item of today.followUps) {
        items.push({ kind: 'follow-up', data: item });
    }
    for (const item of today.toTailor) {
        items.push({ kind: 'tailor', data: item });
    }
    for (const item of today.matches) {
        items.push({ kind: 'match', data: item });
    }
    return items;
}
