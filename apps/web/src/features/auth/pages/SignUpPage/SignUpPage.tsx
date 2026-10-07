import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, GoogleIcon, Stack, TextField } from '@matchbox/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import type { z } from 'zod';

import { useEmailSignUp, useGoogleSignIn } from '../../api/auth.queries';
import { type AuthErrorKey, toAuthErrorKey } from '../../auth.errors';
import { SignUpSchema } from '../../auth.schemas';
import { AuthLayout } from '../../components/AuthLayout/AuthLayout';

type SignUpForm = z.infer<typeof SignUpSchema>;

export function SignUpPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<AuthErrorKey>();
  const [isComplete, setIsComplete] = useState(false);
  const emailSignUp = useEmailSignUp();
  const googleSignIn = useGoogleSignIn();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<SignUpForm>({ resolver: zodResolver(SignUpSchema) });
  const isAuthPending = isSubmitting || emailSignUp.isPending || googleSignIn.isPending;

  const submit = async ({ displayName, email, password }: SignUpForm) => {
    setAuthError(undefined);
    try {
      await emailSignUp.mutateAsync({ displayName, email, password });
      setIsComplete(true);
    } catch (error) {
      setAuthError(toAuthErrorKey(error));
    }
  };

  const signUpGoogle = async () => {
    setAuthError(undefined);
    try {
      await googleSignIn.mutateAsync();
      await navigate('/');
    } catch (error) {
      setAuthError(toAuthErrorKey(error));
    }
  };

  return (
    <AuthLayout subtitle={t('signup.subtitle')} title={t('signup.title')}>
      {isComplete ? (
        <Stack spacing={2}>
          <Alert severity="success">{t('signup.verificationSent')}</Alert>
          <Button component={Link} data-test="auth-signup-continue-link" to="/login">
            {t('signup.continue')}
          </Button>
        </Stack>
      ) : (
        <Stack
          component="form"
          noValidate
          spacing={2}
          onSubmit={(event) => void handleSubmit(submit)(event)}
        >
          {authError ? <Alert severity="error">{t(authError)}</Alert> : null}
          <TextField
            autoComplete="name"
            data-test="auth-signup-name-input"
            error={Boolean(errors.displayName)}
            helperText={errors.displayName ? t('validation.displayNameRequired') : undefined}
            label={t('fields.displayName')}
            {...register('displayName')}
          />
          <TextField
            autoComplete="email"
            data-test="auth-signup-email-input"
            error={Boolean(errors.email)}
            helperText={errors.email ? t('validation.email') : undefined}
            label={t('fields.email')}
            type="email"
            {...register('email')}
          />
          <TextField
            autoComplete="new-password"
            data-test="auth-signup-password-input"
            error={Boolean(errors.password)}
            helperText={errors.password ? t('validation.passwordLength') : undefined}
            label={t('fields.password')}
            type="password"
            {...register('password')}
          />
          <TextField
            autoComplete="new-password"
            data-test="auth-signup-confirm-password-input"
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword ? t('validation.passwordMismatch') : undefined}
            label={t('fields.confirmPassword')}
            type="password"
            {...register('confirmPassword')}
          />
          <Button data-test="auth-signup-submit-button" disabled={isAuthPending} type="submit" variant="contained">
            {t('signup.submit')}
          </Button>
          <Button
            data-test="auth-signup-google-button"
            disabled={isAuthPending}
            onClick={() => void signUpGoogle()}
            startIcon={<GoogleIcon />}
            type="button"
          >
            {t('signup.google')}
          </Button>
          <Button component={Link} data-test="auth-signup-existing-account-link" to="/login">
            {t('signup.existingAccount')}
          </Button>
        </Stack>
      )}
    </AuthLayout>
  );
}
