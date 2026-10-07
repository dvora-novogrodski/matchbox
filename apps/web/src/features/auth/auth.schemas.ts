import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email({ error: 'validation.email' }),
  password: z.string().min(1, { error: 'validation.passwordRequired' }),
});

export const SignUpSchema = z
  .object({
    displayName: z.string().trim().min(1, { error: 'validation.displayNameRequired' }),
    email: z.email({ error: 'validation.email' }),
    password: z.string().min(8, { error: 'validation.passwordLength' }),
    confirmPassword: z.string().min(1, { error: 'validation.passwordRequired' }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validation.passwordMismatch',
  });

export const ResetPasswordSchema = z.object({
  email: z.email({ error: 'validation.email' }),
});
