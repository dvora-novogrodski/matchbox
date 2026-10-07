import { z } from 'zod';

const defaultedString = (defaultValue: string) =>
  z.preprocess((value) => (value === '' ? undefined : value), z.string().trim().min(1).default(defaultValue));

const ClientEnvironmentSchema = z.object({
  VITE_API_URL: defaultedString('http://localhost:3000'),
  VITE_FIREBASE_API_KEY: defaultedString('demo-api-key'),
  VITE_FIREBASE_AUTH_DOMAIN: defaultedString('demo-matchbox.firebaseapp.com'),
  VITE_FIREBASE_PROJECT_ID: defaultedString('demo-matchbox'),
  VITE_FIREBASE_AUTH_EMULATOR_HOST: z.string().trim().min(1).optional(),
});

const result = ClientEnvironmentSchema.safeParse(import.meta.env);
if (!result.success) {
  throw new Error(`Invalid client environment:\n${z.prettifyError(result.error)}`);
}

export const env = {
  apiUrl: result.data.VITE_API_URL,
  firebase: {
    apiKey: result.data.VITE_FIREBASE_API_KEY,
    authDomain: result.data.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: result.data.VITE_FIREBASE_PROJECT_ID,
  },
  firebaseAuthEmulatorHost: result.data.VITE_FIREBASE_AUTH_EMULATOR_HOST,
} as const;
