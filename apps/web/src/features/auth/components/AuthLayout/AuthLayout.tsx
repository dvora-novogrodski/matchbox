import { Box, Stack, Typography } from '@matchbox/ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MatchboxWordmark } from 'src/components/MatchboxWordmark';
import { photos } from 'src/constants/media';

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <Box component="main" sx={{ display: 'grid', minHeight: '100vh', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
      <Box sx={{ bgcolor: 'background.default', display: 'grid', placeItems: 'center', px: 3, py: 5 }}>
        <Stack spacing={4} sx={{ maxWidth: 420, width: '100%' }}>
          <Stack spacing={1}>
            <MatchboxWordmark variant="h6" />
            <Typography component="h1" variant="h3">{title}</Typography>
            <Typography color="text.secondary" variant="body1">{subtitle}</Typography>
          </Stack>
          {children}
        </Stack>
      </Box>
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'relative',
        }}
      >
        <Box
          alt=""
          component="img"
          src={photos.signinHero}
          sx={{ filter: 'saturate(0.85)', height: '100vh', objectFit: 'cover', width: '100%' }}
        />
        <Box
          sx={{
            background: 'linear-gradient(to top, rgba(35,35,35,0.55) 0%, transparent 55%)',
            bottom: 0,
            left: 0,
            p: 4,
            position: 'absolute',
            right: 0,
          }}
        >
          <Typography sx={{ color: '#FFFFFE', fontSize: '1.5rem', fontWeight: 600 }} variant="h3">
            {t('auth:signIn.heroTitle')}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,254,0.9)', mt: 1 }}>{t('auth:marketing.tagline')}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
