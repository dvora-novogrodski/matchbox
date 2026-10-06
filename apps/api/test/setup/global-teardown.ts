import type { TestGlobals } from './global-setup';

export default async function globalTeardown(): Promise<void> {
  await (globalThis as TestGlobals).postgresContainer?.stop();
}
