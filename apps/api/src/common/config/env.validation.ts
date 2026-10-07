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
  FIREBASE_PROJECT_ID: defaultedString('demo-matchbox'),
});

export type EnvironmentVariables = z.output<typeof EnvironmentSchema>;

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const result = EnvironmentSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
