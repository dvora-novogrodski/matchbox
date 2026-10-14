import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, GoogleIcon, Stack, TextField } from '@matchbox/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import type { z } from 'zod';

import { useEmailSignIn, useGoogleSignIn } from '../../api/auth.queries';
import { type AuthErrorKey, toAuthErrorKey } from '../../auth.errors';
import { LoginSchema } from '../../auth.schemas';
import { AuthLayout } from '../../components/AuthLayout/AuthLayout';

type LoginForm = z.infer<typeof LoginSchema>;

export function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<AuthErrorKey>();
  const emailSignIn = useEmailSignIn();
  const googleSignIn = useGoogleSignIn();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });
  const isAuthPending = isSubmitting || emailSignIn.isPending || googleSignIn.isPending;

  const submit = async ({ email, password }: LoginForm) => {
    setAuthError(undefined);
    try {
      await emailSignIn.mutateAsync({ email, password });
      await navigate('/today');
    } catch (error) {
      setAuthError(toAuthErrorKey(error));
    }
  };

  const signInGoogle = async () => {
    setAuthError(undefined);
    try {
      await googleSignIn.mutateAsync();
      await navigate('/today');
    } catch (error) {
      setAuthError(toAuthErrorKey(error));
    }
  };

  return (
    <AuthLayout subtitle={t('login.subtitle')} title={t('login.title')}>
      <Stack
        component="form"
        noValidate
        spacing={2}
        onSubmit={(event) => void handleSubmit(submit)(event)}
      >
        {authError ? <Alert severity="error">{t(authError)}</Alert> : null}
        <TextField
          autoComplete="email"
          data-test="auth-login-email-input"
          error={Boolean(errors.email)}
          helperText={errors.email ? t('validation.email') : undefined}
          label={t('fields.email')}
          type="email"
          {...register('email')}
        />
        <TextField
          autoComplete="current-password"
          data-test="auth-login-password-input"
          error={Boolean(errors.password)}
          helperText={errors.password ? t('validation.passwordRequired') : undefined}
          label={t('fields.password')}
          type="password"
          {...register('password')}
        />
        <Button data-test="auth-login-submit-button" disabled={isAuthPending} type="submit" variant="contained">
          {t('login.submit')}
        </Button>
        <Button
          data-test="auth-login-google-button"
          disabled={isAuthPending}
          onClick={() => void signInGoogle()}
          startIcon={<GoogleIcon />}
        >
          {t('login.google')}
        </Button>
        <Button component={Link} data-test="auth-login-reset-link" to="/reset-password">
          {t('login.forgotPassword')}
        </Button>
        <Button component={Link} data-test="auth-login-signup-link" to="/signup">
          {t('login.createAccount')}
        </Button>
      </Stack>
    </AuthLayout>
  );
}
