import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useSignOut } from 'src/features/auth';

export function App() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const signOut = useSignOut();

  return (
    <Box component="main" sx={{ mx: 'auto', maxWidth: 960, p: 4 }}>
      <Stack spacing={3}>
        <Typography component="h1" variant="h3">
          {t('app.title')}
        </Typography>
        {currentUser.isPending ? (
          <CircularProgress data-test="app-user-loading" />
        ) : currentUser.isError ? (
          <Alert severity="error">{t('errors.profileUnavailable')}</Alert>
        ) : (
          <Typography>{t('app.signedInAs', { email: currentUser.data.email })}</Typography>
        )}
        {signOut.isError ? <Alert severity="error">{t('errors.signOutFailed')}</Alert> : null}
        <Button
          data-test="app-pipeline-button"
          onClick={() => {
            void navigate('/pipeline');
          }}
          variant="contained"
        >
          {t('actions.openPipeline')}
        </Button>
        <Button
          data-test="app-career-profile-button"
          onClick={() => {
            void navigate('/profile');
          }}
          variant="contained"
        >
          {t('actions.openCareerProfile')}
        </Button>
        <Button
          data-test="app-cv-button"
          onClick={() => {
            void navigate('/cv');
          }}
          variant="outlined"
        >
          {t('actions.openCv')}
        </Button>
        <Button
          data-test="app-sign-out-button"
          disabled={signOut.isPending}
          onClick={() => signOut.mutate()}
          variant="outlined"
        >
          {t('actions.signOut')}
        </Button>
      </Stack>
    </Box>
  );
}
