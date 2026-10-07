import { Box, Paper, Stack, Typography } from '@matchbox/ui';
import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <Box component="main" sx={{ display: 'grid', minHeight: '100vh', placeItems: 'center', px: 2, py: 4 }}>
      <Paper elevation={2} sx={{ maxWidth: 440, p: 4, width: '100%' }}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography component="h1" variant="h4">
              {title}
            </Typography>
            <Typography color="text.secondary">{subtitle}</Typography>
          </Stack>
          {children}
        </Stack>
      </Paper>
    </Box>
  );
}
