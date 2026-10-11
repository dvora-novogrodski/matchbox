import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useBaseCv } from '../../api/cv.queries';
import { CvWorkspace } from '../../components/CvWorkspace';

export function CvPage() {
    const { t } = useTranslation('cv');
    const navigate = useNavigate();
    const cv = useBaseCv();

    return (
        <Box component="main" sx={{ mx: 'auto', maxWidth: 1200, p: 4 }}>
            <Stack spacing={3}>
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between' }}>
                    <Stack spacing={1}>
                        <Typography component="h1" variant="h3">
                            {t('page.title')}
                        </Typography>
                        <Typography color="text.secondary">{t('page.description')}</Typography>
                    </Stack>
                    <Button
                        data-test="cv-open-profile-button"
                        onClick={() => {
                            void navigate('/profile');
                        }}
                        variant="outlined"
                    >
                        {t('actions.openProfile')}
                    </Button>
                </Stack>
                {cv.isPending ? <CircularProgress data-test="cv-loading" /> : null}
                {cv.isError ? <Alert severity="error">{t('errors.loadFailed')}</Alert> : null}
                {cv.data ? <CvWorkspace editor={cv.data} /> : null}
            </Stack>
        </Box>
    );
}
