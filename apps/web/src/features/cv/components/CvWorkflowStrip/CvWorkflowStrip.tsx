import { Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

const STEP_KEYS = ['workflow.pick', 'workflow.save', 'workflow.export'] as const;

export function CvWorkflowStrip() {
    const { t } = useTranslation('cv');

    return (
        <Stack
            data-test="cv-workflow"
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 2 }}
            sx={{ flexWrap: 'wrap' }}
        >
            {STEP_KEYS.map((key, index) => (
                <Stack direction="row" key={key} spacing={1} sx={{ alignItems: 'baseline' }}>
                    <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', fontWeight: 500 }} variant="body2">
                        {index + 1}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8125rem' }} variant="body2">{t(key)}</Typography>
                </Stack>
            ))}
        </Stack>
    );
}
