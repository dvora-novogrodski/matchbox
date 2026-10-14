import { Box, Divider, Stack, Typography } from '@matchbox/ui';
import type { ReactNode } from 'react';

import { CONTENT_MAX_WIDTH } from '../AppShell/app-layout.constants';

export type PageWidth = 'form' | 'content' | 'full';

const PAGE_MAX_WIDTH: Record<PageWidth, number | undefined> = {
    form: 640,
    content: CONTENT_MAX_WIDTH,
    full: undefined,
};

type PageLayoutProps = {
    actions?: ReactNode;
    children?: ReactNode;
    cover?: ReactNode;
    description?: string;
    title: string;
    width?: PageWidth;
};

export function PageLayout({ actions, children, cover, description, title, width = 'content' }: PageLayoutProps) {
    const maxWidth = PAGE_MAX_WIDTH[width];

    return (
        <Box sx={{ mx: maxWidth === undefined ? 0 : 'auto', maxWidth, width: '100%' }}>
            <Stack spacing={0}>
                {cover ? <Box sx={{ mb: 2.5 }}>{cover}</Box> : null}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between', pb: 3 }}
                >
                    <Stack spacing={0.5}>
                        <Typography component="h1" data-test="page-title" variant="h3">
                            {title}
                        </Typography>
                        {description ? (
                            <Typography color="text.secondary" variant="body2">
                                {description}
                            </Typography>
                        ) : null}
                    </Stack>
                    {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
                </Stack>
                <Divider sx={{ mb: 3 }} />
                {children}
            </Stack>
        </Box>
    );
}
