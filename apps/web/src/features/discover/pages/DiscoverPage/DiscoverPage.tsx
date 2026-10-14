import { Alert, Button, CircularProgress, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { EmptyIllustration } from 'src/components/EmptyIllustration';
import { PageLayout } from 'src/components/PageLayout';
import { illustrations } from 'src/constants/media';

import { useDiscover, useSaveDiscoveredJob, useSkipDiscoveredJob } from '../../api/discover.queries';
import { DiscoverCard } from '../../components/DiscoverCard';

export function DiscoverPage() {
    const { t } = useTranslation('discover');
    const discover = useDiscover();
    const save = useSaveDiscoveredJob();
    const skip = useSkipDiscoveredJob();
    const pendingJobId = save.isPending ? save.variables : skip.isPending ? skip.variables : undefined;

    return (
        <PageLayout description={t('page.description')} title={t('page.title')} width="full">
            <Stack spacing={3}>
                {save.isError ? <Alert severity="error">{t('errors.saveFailed')}</Alert> : null}
                {skip.isError ? <Alert severity="error">{t('errors.skipFailed')}</Alert> : null}
                {discover.isPending ? (
                    <CircularProgress data-test="discover-loading" />
                ) : discover.isError ? (
                    <Alert severity="error">{t('errors.loadFailed')}</Alert>
                ) : discover.data.items.length === 0 ? (
                    <Stack data-test="discover-empty" spacing={1.5} sx={{ alignItems: 'center', py: 4, textAlign: 'center' }}>
                        <EmptyIllustration src={illustrations.emptyDiscover} />
                        <Typography component="h2" sx={{ fontSize: '1rem', fontWeight: 600 }} variant="h6">
                            {t('emptyTitle')}
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: '0.875rem', maxWidth: 360 }} variant="body2">
                            {t('empty')}
                        </Typography>
                        <Button component={RouterLink} to="/jobs/new" variant="outlined">
                            {t('actions.addJob')}
                        </Button>
                    </Stack>
                ) : (
                    <Stack spacing={2}>
                        {discover.data.items.map((item) => (
                            <DiscoverCard
                                isPending={pendingJobId === item.jobId}
                                item={item}
                                key={item.jobId}
                                onSave={() => {
                                    save.mutate(item.jobId);
                                }}
                                onSkip={() => {
                                    skip.mutate(item.jobId);
                                }}
                            />
                        ))}
                    </Stack>
                )}
            </Stack>
        </PageLayout>
    );
}
