import { z } from 'zod';

const defaultedString = (defaultValue: string) =>
  z.preprocess((value) => (value === '' ? undefined : value), z.string().trim().min(1).default(defaultValue));

export const EnvironmentSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  /** Comma-separated list of allowed browser origins (CORS). */
  WEB_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  /** Base URL of the AI service. When unset, AI features return unavailable. */
  AI_SERVICE_URL: z.preprocess((value) => (value === '' ? undefined : value), z.url().optional()),
  AI_TIMEOUT_MS: z.coerce.number().int().min(1).max(120_000).default(15_000),
  FIREBASE_PROJECT_ID: defaultedString('demo-matchbox'),
  /** 32-byte key, base64. Required only when a GitHub token is stored. */
  TOKEN_ENCRYPTION_KEY: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().trim().min(1).optional(),
  ),
  /** Chromium or Chrome binary used to render CV PDFs. */
  CHROME_PATH: z.preprocess((value) => (value === '' ? undefined : value), z.string().trim().min(1).optional()),
});

export type EnvironmentVariables = z.output<typeof EnvironmentSchema>;

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const result = EnvironmentSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
