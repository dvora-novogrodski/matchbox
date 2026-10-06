import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export type TestGlobals = { postgresContainer?: StartedPostgreSqlContainer };

// Same image as docker-compose.yml, because the migrations create the vector extension.
const POSTGRES_IMAGE = 'pgvector/pgvector:pg16';

export default async function globalSetup(): Promise<void> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  process.env.DATABASE_URL = container.getConnectionUri();
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: path.resolve(__dirname, '../..'),
    env: process.env,
    stdio: 'ignore',
  });
  (globalThis as TestGlobals).postgresContainer = container;
}
