import { Box, Card, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

type CvPaperPreviewProps = {
    html: string;
    status: 'dirty' | 'saved';
};

export function CvPaperPreview({ html, status }: CvPaperPreviewProps) {
    const { t } = useTranslation('cv');

    return (
        <Card data-test="cv-paper-preview" sx={{ overflow: 'hidden', p: 0 }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{
                    alignItems: { sm: 'center' },
                    borderBottom: 1,
                    borderColor: 'divider',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.5,
                }}
            >
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('preview.heading')}</Typography>
                <Typography
                    color={status === 'dirty' ? 'warning.main' : 'text.secondary'}
                    sx={{ fontSize: '0.8125rem' }}
                    variant="body2"
                >
                    {status === 'dirty' ? t('preview.dirtyShort') : t('preview.savedShort')}
                </Typography>
            </Stack>
            <Box sx={{ bgcolor: 'background.default', p: 2.5 }}>
                <Box
                    sx={{
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        boxShadow: '0 2px 8px rgba(35, 35, 35, 0.08)',
                        mx: 'auto',
                        maxWidth: 595,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        component="iframe"
                        data-test="cv-preview"
                        sandbox=""
                        srcDoc={html}
                        sx={{ border: 0, display: 'block', height: 760, width: '100%' }}
                        title={t('preview.title')}
                    />
                </Box>
            </Box>
        </Card>
    );
}
