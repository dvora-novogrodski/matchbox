import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Client } from 'pg';

const MIGRATION_SQL = readFileSync(
    path.resolve(__dirname, '../prisma/migrations/20261012120000_cv_version_status/migration.sql'),
    'utf8',
);

describe('CV version status migration', () => {
    it('should mark recorded versions saved and unmarked job drafts open', async () => {
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
                CREATE TABLE cv_versions (
                    id UUID PRIMARY KEY,
                    application_id UUID,
                    is_base BOOLEAN NOT NULL,
                    git_path TEXT,
                    commit_sha TEXT
                )
            `);
            await client.query(`
                INSERT INTO cv_versions (id, application_id, is_base, git_path, commit_sha) VALUES
                    ('0199bcdf-20fc-744f-bc8b-6ef7c25cd911', '0199bcdf-20fc-744f-bc8b-6ef7c25cd921', false, 'cvs/2026-10-acme-engineer.json', 'abc123'),
                    ('0199bcdf-20fc-744f-bc8b-6ef7c25cd912', '0199bcdf-20fc-744f-bc8b-6ef7c25cd921', false, 'cvs/2026-10-local.json', NULL),
                    ('0199bcdf-20fc-744f-bc8b-6ef7c25cd913', '0199bcdf-20fc-744f-bc8b-6ef7c25cd921', false, NULL, NULL),
                    ('0199bcdf-20fc-744f-bc8b-6ef7c25cd914', NULL, true, 'cvs/base.json', 'def456')
            `);

            await client.query(MIGRATION_SQL);

            const versions = await client.query<{ id: string; status: string }>(
                'SELECT id, status FROM cv_versions ORDER BY id',
            );
            expect(versions.rows).toEqual([
                { id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd911', status: 'saved' },
                { id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd912', status: 'saved' },
                { id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd913', status: 'open' },
                { id: '0199bcdf-20fc-744f-bc8b-6ef7c25cd914', status: 'saved' },
            ]);

            await client.query(`
                INSERT INTO cv_versions (id, application_id, is_base, git_path, commit_sha)
                VALUES ('0199bcdf-20fc-744f-bc8b-6ef7c25cd915', NULL, true, 'cvs/base-again.json', NULL)
            `);
            const inserted = await client.query<{ status: string }>(
                `SELECT status FROM cv_versions WHERE id = '0199bcdf-20fc-744f-bc8b-6ef7c25cd915'`,
            );
            expect(inserted.rows[0]?.status).toBe('saved');
        } finally {
            await client.query('DROP SCHEMA IF EXISTS migration_rehearsal CASCADE');
            await client.end();
        }
    });
});
