import type { ApplicationCvVersionSummary } from '@matchbox/shared';
import { Button, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { formatDate } from 'src/utils/format.utils';

type CvPanelProps = {
    versions: ApplicationCvVersionSummary[];
};

export function CvPanel({ versions }: CvPanelProps) {
    const { t, i18n } = useTranslation('job');

    if (versions.length === 0) {
        return (
            <Stack spacing={2}>
                <Typography>{t('cv.empty')}</Typography>
                <Button component={RouterLink} data-test="job-open-base-cv-button" to="/cv" variant="outlined">
                    {t('actions.openBaseCv')}
                </Button>
            </Stack>
        );
    }

    return (
        <Stack component="ul" spacing={1} sx={{ m: 0, pl: 3 }}>
            {versions.map((version) => (
                <Typography component="li" key={version.id}>
                    {t('cv.version', {
                        date: formatDate(version.createdAt, i18n.language),
                        label: version.commitSha
                            ? t('cv.committed', { sha: version.commitSha.slice(0, 7) })
                            : t('cv.draft'),
                    })}
                </Typography>
            ))}
        </Stack>
    );
}
