import { Card, CircularProgress, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { PageLayout } from 'src/components/PageLayout';
import { useCurrentUser } from 'src/features/auth';

export function SettingsPage() {
    const { t } = useTranslation('settings');
    const currentUser = useCurrentUser();

    return (
        <PageLayout description={t('page.description')} title={t('page.title')} width="form">
            {currentUser.isPending ? <CircularProgress data-test="settings-loading" /> : null}
            {currentUser.data ? (
                <Card>
                    <Stack spacing={1} sx={{ p: 2 }}>
                        <Typography component="h2" sx={{ fontSize: '1rem', fontWeight: 600 }} variant="h6">
                            {t('account.title')}
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }} variant="body2">
                            {t('account.description')}
                        </Typography>
                        <Typography data-test="settings-email" sx={{ fontSize: '0.875rem', pt: 1 }}>
                            {currentUser.data.email}
                        </Typography>
                        {currentUser.data.displayName ? (
                            <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }} variant="body2">
                                {currentUser.data.displayName}
                            </Typography>
                        ) : null}
                    </Stack>
                </Card>
            ) : null}
        </PageLayout>
    );
}
