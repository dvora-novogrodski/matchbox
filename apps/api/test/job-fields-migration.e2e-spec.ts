import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Client } from 'pg';

const MIGRATION_SQL = readFileSync(
    path.resolve(__dirname, '../prisma/migrations/20261011190000_move_user_job_fields_to_application/migration.sql'),
    'utf8',
);

describe('user job field migration', () => {
    it('should copy existing posting text onto each application before dropping it from the job', async () => {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is not set');
        }

        const client = new Client({ connectionString: databaseUrl });
        await client.connect();
        try {
            await client.query('DROP SCHEMA IF EXISTS migration_rehearsal CASCADE');
            await client.query('CREATE SCHEMA migration_rehearsal');
            await client.query('SET search_path TO migration_rehearsal, public');
            await client.query(`
                CREATE TABLE jobs (
                    id UUID PRIMARY KEY,
                    company_name TEXT NOT NULL,
                    source job_source NOT NULL,
                    url TEXT,
                    normalized_url TEXT,
                    title TEXT NOT NULL,
                    location TEXT,
                    work_mode work_mode,
                    description TEXT,
                    updated_at TIMESTAMPTZ(3) NOT NULL
                )
            `);
            await client.query(`
                CREATE TABLE applications (
                    id UUID PRIMARY KEY,
                    user_id UUID NOT NULL,
                    job_id UUID NOT NULL,
                    updated_at TIMESTAMPTZ(3) NOT NULL
                )
            `);
            const jobId = '0199bcdf-20fc-744f-bc8b-6ef7c25cd901';
            await client.query(
                `INSERT INTO jobs (
                    id, company_name, source, url, normalized_url, title, location, work_mode, description, updated_at
                ) VALUES (
                    $1, 'Acme', 'manual', 'https://example.com/jobs/1?utm_source=li', 'https://example.com/jobs/1',
                    'Engineer', 'Tel Aviv', 'hybrid', $2, CURRENT_TIMESTAMP
                )`,
                [jobId, "A's text"],
            );
            await client.query(
                `INSERT INTO applications (id, user_id, job_id, updated_at) VALUES
                    ('0199bcdf-20fc-744f-bc8b-6ef7c25cd902', '0199bcdf-20fc-744f-bc8b-6ef7c25cd903', $1, CURRENT_TIMESTAMP),
                    ('0199bcdf-20fc-744f-bc8b-6ef7c25cd904', '0199bcdf-20fc-744f-bc8b-6ef7c25cd905', $1, CURRENT_TIMESTAMP)`,
                [jobId],
            );

            await client.query(MIGRATION_SQL);

            const applications = await client.query<{
                company_name: string;
                title: string;
                location: string;
                work_mode: string;
                url: string;
                description: string;
            }>('SELECT company_name, title, location, work_mode, url, description FROM applications ORDER BY id');
            expect(applications.rows).toEqual([
                {
                    company_name: 'Acme',
                    title: 'Engineer',
                    location: 'Tel Aviv',
                    work_mode: 'hybrid',
                    url: 'https://example.com/jobs/1?utm_source=li',
                    description: "A's text",
                },
                {
                    company_name: 'Acme',
                    title: 'Engineer',
                    location: 'Tel Aviv',
                    work_mode: 'hybrid',
                    url: 'https://example.com/jobs/1?utm_source=li',
                    description: "A's text",
                },
            ]);

            const jobs = await client.query('SELECT normalized_url, source FROM jobs');
            expect(jobs.rows).toEqual([{ normalized_url: 'https://example.com/jobs/1', source: 'manual' }]);

            const dropped = await client.query(
                `SELECT column_name
                 FROM information_schema.columns
                 WHERE table_schema = 'migration_rehearsal'
                   AND table_name = 'jobs'
                   AND column_name IN ('company_name', 'title', 'location', 'work_mode', 'url', 'description')`,
            );
            expect(dropped.rows).toEqual([]);
        } finally {
            await client.query('DROP SCHEMA IF EXISTS migration_rehearsal CASCADE');
            await client.end();
        }
    });
});
