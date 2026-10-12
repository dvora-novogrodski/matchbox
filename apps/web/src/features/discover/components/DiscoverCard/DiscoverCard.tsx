import type { DiscoverItem, WorkMode } from '@matchbox/shared';
import { Button, Card, Chip, Link, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

type DiscoverCardProps = {
    item: DiscoverItem;
    isPending: boolean;
    onSave: () => void;
    onSkip: () => void;
};

export function DiscoverCard({ item, isPending, onSave, onSkip }: DiscoverCardProps) {
    const { t } = useTranslation('discover');
    const details = [item.location, item.workMode ? workModeLabel(item.workMode, t) : null].filter(
        (part): part is string => part !== null && part.length > 0,
    );

    return (
        <Card data-test={`discover-card-${item.jobId}`} variant="outlined">
            <Stack spacing={1} sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography component="h2" variant="subtitle1">
                        {item.companyName}
                    </Typography>
                    <Chip label={t('card.score', { score: item.score })} size="small" />
                </Stack>
                <Typography variant="body1">{item.title}</Typography>
                {details.length > 0 ? (
                    <Typography color="text.secondary" variant="body2">
                        {details.join(' · ')}
                    </Typography>
                ) : null}
                {item.description ? <Typography variant="body2">{item.description}</Typography> : null}
                {item.url ? (
                    <Link href={item.url} rel="noopener noreferrer" target="_blank" variant="body2">
                        {t('card.posting')}
                    </Link>
                ) : null}
                <Stack direction="row" spacing={1}>
                    <Button
                        aria-label={t('card.saveLabel', { title: item.title })}
                        data-test={`discover-save-button-${item.jobId}`}
                        disabled={isPending}
                        onClick={onSave}
                        size="small"
                        variant="contained"
                    >
                        {t('card.save')}
                    </Button>
                    <Button
                        aria-label={t('card.skipLabel', { title: item.title })}
                        data-test={`discover-skip-button-${item.jobId}`}
                        disabled={isPending}
                        onClick={onSkip}
                        size="small"
                        variant="outlined"
                    >
                        {t('card.skip')}
                    </Button>
                </Stack>
            </Stack>
        </Card>
    );
}

function workModeLabel(
    mode: WorkMode,
    t: (key: 'workMode.onsite' | 'workMode.hybrid' | 'workMode.remote') => string,
): string {
    switch (mode) {
        case 'onsite':
            return t('workMode.onsite');
        case 'hybrid':
            return t('workMode.hybrid');
        case 'remote':
            return t('workMode.remote');
    }
}
