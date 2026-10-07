import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Stack, TextField } from '@matchbox/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { z } from 'zod';

import { usePasswordReset } from '../../api/auth.queries';
import { type AuthErrorKey, toAuthErrorKey } from '../../auth.errors';
import { ResetPasswordSchema } from '../../auth.schemas';
import { AuthLayout } from '../../components/AuthLayout/AuthLayout';

type ResetPasswordForm = z.infer<typeof ResetPasswordSchema>;

export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const [authError, setAuthError] = useState<AuthErrorKey>();
  const [isComplete, setIsComplete] = useState(false);
  const passwordReset = usePasswordReset();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(ResetPasswordSchema) });

  const submit = async ({ email }: ResetPasswordForm) => {
    setAuthError(undefined);
    try {
      await passwordReset.mutateAsync({ email });
      setIsComplete(true);
    } catch (error) {
      setAuthError(toAuthErrorKey(error));
    }
  };

  if (isComplete) {
    return (
      <AuthLayout subtitle={t('reset.subtitle')} title={t('reset.title')}>
        <Stack spacing={2}>
          <Alert severity="success">{t('reset.sent')}</Alert>
          <Button component={Link} data-test="auth-reset-login-link" to="/login">
            {t('reset.backToLogin')}
          </Button>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout subtitle={t('reset.subtitle')} title={t('reset.title')}>
      <Stack
        component="form"
        noValidate
        spacing={2}
        onSubmit={(event) => void handleSubmit(submit)(event)}
      >
        {authError ? <Alert severity="error">{t(authError)}</Alert> : null}
        <TextField
          autoComplete="email"
          data-test="auth-reset-email-input"
          error={Boolean(errors.email)}
          helperText={errors.email ? t('validation.email') : undefined}
          label={t('fields.email')}
          type="email"
          {...register('email')}
        />
        <Button
          data-test="auth-reset-submit-button"
          disabled={isSubmitting || passwordReset.isPending}
          type="submit"
          variant="contained"
        >
          {t('reset.submit')}
        </Button>
        <Button component={Link} data-test="auth-reset-login-link" to="/login">
          {t('reset.backToLogin')}
        </Button>
      </Stack>
    </AuthLayout>
  );
}
