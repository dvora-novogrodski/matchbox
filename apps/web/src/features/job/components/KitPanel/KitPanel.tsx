import { Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

type KitPanelProps = {
    companyName: string;
    title: string;
};

export function KitPanel({ companyName, title }: KitPanelProps) {
    const { t } = useTranslation('job');

    return (
        <Stack spacing={2}>
            <Typography color="text.secondary">{t('kit.intro')}</Typography>
            <Stack spacing={1}>
                <Typography component="h2" variant="h5">
                    {t('kit.coverLetterTitle')}
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{t('kit.coverLetterTemplate', { company: companyName, title })}</Typography>
            </Stack>
            <Stack spacing={1}>
                <Typography component="h2" variant="h5">
                    {t('kit.answersTitle')}
                </Typography>
                <Typography>{t('kit.answersTemplate')}</Typography>
            </Stack>
        </Stack>
    );
}
