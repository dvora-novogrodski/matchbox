import type { DiscoverFitLine, DiscoverItem, WorkMode } from '@matchbox/shared';
import {
    AIIcon,
    Box,
    Button,
    Card,
    CheckCircleOutlineIcon,
    Link,
    Stack,
    Typography,
    WarningAmberIcon,
} from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { CompanyLogo } from 'src/components/CompanyLogo';
import { CoverImage } from 'src/components/CoverImage';

type DiscoverCardProps = {
    item: DiscoverItem;
    isPending: boolean;
    onSave: () => void;
    onSkip: () => void;
};

export function DiscoverCard({ item, isPending, onSave, onSkip }: DiscoverCardProps) {
    const { t } = useTranslation('discover');
    const meta = [item.companyName, item.location, item.workMode ? workModeLabel(item.workMode, t) : null]
        .filter((part): part is string => part !== null && part.length > 0)
        .join(' · ');
    const fitLines = item.fitLines ?? [];

    return (
        <Card data-test={`discover-card-${item.jobId}`} sx={{ overflow: 'hidden', p: 0 }}>
            <CoverImage alt="" companyName={item.companyName} height={140} />
            <Stack spacing={1.5} sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                    <CompanyLogo companyName={item.companyName} jobUrl={item.url} size={36} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography component="h2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.title}</Typography>
                        <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }} variant="body2">{meta}</Typography>
                    </Box>
                </Stack>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <AIIcon aria-hidden color="accent" fontSize="small" />
                    <Typography sx={{ color: 'accentText', fontSize: '0.8125rem', fontWeight: 600 }}>
                        {t('card.score', { score: item.score })}
                    </Typography>
                </Stack>
                {fitLines.length > 0 ? (
                    <Stack spacing={1}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('card.whyItFits')}</Typography>
                        <Stack spacing={0.75}>
                            {fitLines.map((line) => (
                                <DiscoverFitLineRow key={line.text} line={line} />
                            ))}
                        </Stack>
                    </Stack>
                ) : item.description ? (
                    <Stack spacing={0.5}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('card.whyItFits')}</Typography>
                        <Typography sx={{ fontSize: '0.875rem' }} variant="body2">{item.description}</Typography>
                    </Stack>
                ) : null}
                {item.url ? (
                    <Link href={item.url} rel="noopener noreferrer" target="_blank" variant="body2">
                        {t('card.posting')}
                    </Link>
                ) : null}
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
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
                </Stack>
            </Stack>
        </Card>
    );
}

function DiscoverFitLineRow({ line }: { line: DiscoverFitLine }) {
    const icon =
        line.tone === 'strength' ? (
            <CheckCircleOutlineIcon color="success" fontSize="small" />
        ) : (
            <WarningAmberIcon color="warning" fontSize="small" />
        );

    return (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', flexShrink: 0, mt: 0.125 }}>{icon}</Box>
            <Typography sx={{ fontSize: '0.875rem' }} variant="body2">{line.text}</Typography>
        </Stack>
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
