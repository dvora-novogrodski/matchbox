import { Alert, Button, CircularProgress } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from 'src/components/PageLayout';

import { useBaseCv } from '../../api/cv.queries';
import { CvWorkspace } from '../../components/CvWorkspace';

export function CvPage() {
    const { t } = useTranslation('cv');
    const navigate = useNavigate();
    const cv = useBaseCv();

    return (
        <PageLayout
            actions={
                <Button
                    data-test="cv-open-profile-button"
                    onClick={() => {
                        void navigate('/profile');
                    }}
                    variant="outlined"
                >
                    {t('actions.openProfile')}
                </Button>
            }
            description={t('page.description')}
            title={t('page.titleLong')}
            width="full"
        >
            {cv.isPending ? <CircularProgress data-test="cv-loading" /> : null}
            {cv.isError ? <Alert severity="error">{t('errors.loadFailed')}</Alert> : null}
            {cv.data ? <CvWorkspace editor={cv.data} /> : null}
        </PageLayout>
    );
}
