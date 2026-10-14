import type { TodayStats } from '@matchbox/shared';
import { Box, Card, Link, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { highlightStatTile, type StatTileKey } from '../../today-greeting.utils';

type TileConfig = {
    count: number;
    highlight: boolean;
    href: string;
    key: StatTileKey;
    labelKey: `tiles.${StatTileKey}Label`;
    linkKey: `tiles.${StatTileKey}Link`;
};

type TodayStatTilesProps = {
    stats: TodayStats;
};

export function TodayStatTiles({ stats }: TodayStatTilesProps) {
    const { t } = useTranslation('today');
    const highlighted = highlightStatTile(stats);

    const tiles: TileConfig[] = [
        {
            key: 'matches',
            count: stats.matches,
            labelKey: 'tiles.matchesLabel',
            linkKey: 'tiles.matchesLink',
            href: '/discover',
            highlight: highlighted === 'matches',
        },
        {
            key: 'toTailor',
            count: stats.toTailor,
            labelKey: 'tiles.toTailorLabel',
            linkKey: 'tiles.toTailorLink',
            href: '/pipeline',
            highlight: highlighted === 'toTailor',
        },
        {
            key: 'followUps',
            count: stats.followUps,
            labelKey: 'tiles.followUpsLabel',
            linkKey: 'tiles.followUpsLink',
            href: '/pipeline?filter=follow-up',
            highlight: highlighted === 'followUps',
        },
        {
            key: 'inProgress',
            count: stats.inProgress,
            labelKey: 'tiles.inProgressLabel',
            linkKey: 'tiles.inProgressLink',
            href: '/pipeline',
            highlight: highlighted === 'inProgress',
        },
    ];

    return (
        <Card sx={{ p: 0 }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                }}
            >
                {tiles.map((tile, index) => (
                    <Box
                        data-test={`today-stat-tile-${tile.key}`}
                        key={tile.key}
                        sx={{
                            borderRight: index < tiles.length - 1 ? { md: 1 } : 0,
                            borderBottom: index < 2 ? { xs: 1, md: 0 } : 0,
                            borderColor: 'divider',
                            p: 2,
                        }}
                    >
                        <Stack spacing={0.5}>
                            <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }}>{t(tile.labelKey)}</Typography>
                            <Typography
                                sx={{
                                    color: tile.highlight && tile.count > 0 ? 'accentText' : 'text.primary',
                                    fontSize: '1.5rem',
                                    fontWeight: 600,
                                    lineHeight: 1.2,
                                }}
                            >
                                {tile.count}
                            </Typography>
                            <Link
                                component={RouterLink}
                                sx={{ fontSize: '0.8125rem', fontWeight: 500 }}
                                to={tile.href}
                                underline="hover"
                            >
                                {t(tile.linkKey)}
                            </Link>
                        </Stack>
                    </Box>
                ))}
            </Box>
        </Card>
    );
}
