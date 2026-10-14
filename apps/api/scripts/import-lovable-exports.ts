/**
 * One-off import from Lovable (Applied) CSV exports into the local Matchbox database.
 *
 *   npx tsx scripts/import-lovable-exports.ts \
 *     --applications ~/Downloads/applications-export-....csv \
 *     --cv-templates ~/Downloads/cv_templates-export-....csv
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import type { Prisma } from '../src/generated/prisma/client';

config({ path: resolve(__dirname, '../../../.env') });

const TRACKING_PARAM = /^utm_/i;

type SystemStatusKey =
    | 'saved'
    | 'applied'
    | 'screening'
    | 'technical'
    | 'hr'
    | 'offer'
    | 'rejected'
    | 'withdrawn';

type WorkMode = 'onsite' | 'hybrid' | 'remote';

type LovableApplicationRow = {
    lovableId: string;
    companyName: string;
    title: string;
    location: string | null;
    workMode: WorkMode | null;
    statusKey: SystemStatusKey;
    applicationDate: Date | null;
    jobLink: string | null;
    recruiterName: string | null;
    recruiterContact: string | null;
    description: string | null;
    lastActivityAt: Date;
    createdAt: Date;
};

type LovableCvRow = {
    lovableId: string;
    name: string;
    html: string;
    isBase: boolean;
    lovableApplicationId: string | null;
    githubPath: string | null;
    createdAt: Date;
};

const STATUS_BY_LABEL: Record<string, SystemStatusKey> = {
    saved: 'saved',
    applied: 'applied',
    screening: 'screening',
    technical: 'technical',
    hr: 'hr',
    offer: 'offer',
    rejected: 'rejected',
    withdrawn: 'withdrawn',
};

function parseArgs(argv: string[]): { applicationsPath: string; cvTemplatesPath: string | null } {
    let applicationsPath: string | null = null;
    let cvTemplatesPath: string | null = null;
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index];
        if (arg === '--applications' && argv[index + 1]) {
            applicationsPath = resolve(argv[++index]);
        } else if (arg === '--cv-templates' && argv[index + 1]) {
            cvTemplatesPath = resolve(argv[++index]);
        }
    }
    if (!applicationsPath) {
        throw new Error('Pass --applications <path-to-csv>');
    }
    return { applicationsPath, cvTemplatesPath };
}

function parseDelimitedRecords(text: string, delimiter: string): string[][] {
    const records: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let index = 0; index < text.length; index++) {
        const character = text[index];
        if (inQuotes) {
            if (character === '"') {
                if (text[index + 1] === '"') {
                    field += '"';
                    index++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += character;
            }
            continue;
        }
        if (character === '"') {
            inQuotes = true;
            continue;
        }
        if (character === delimiter) {
            row.push(field);
            field = '';
            continue;
        }
        if (character === '\n' || (character === '\r' && text[index + 1] === '\n')) {
            if (character === '\r') {
                index++;
            }
            row.push(field);
            field = '';
            if (row.some((cell) => cell.length > 0)) {
                records.push(row);
            }
            row = [];
            continue;
        }
        if (character === '\r') {
            continue;
        }
        field += character;
    }

    row.push(field);
    if (row.some((cell) => cell.length > 0)) {
        records.push(row);
    }
    return records;
}

function readCell(record: string[], columnIndex: Map<string, number>, column: string): string {
    const index = columnIndex.get(column);
    if (index === undefined || index >= record.length) {
        return '';
    }
    return record[index].trim();
}

function emptyToNull(value: string): string | null {
    return value.length === 0 ? null : value;
}

function parseLovableDate(raw: string): Date | null {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
        return null;
    }
    let normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    normalized = normalized.replace(/([+-]\d{2})$/, '$1:00');
    const parsed = Date.parse(normalized);
    return Number.isNaN(parsed) ? null : new Date(parsed);
}

function mapStatus(raw: string): SystemStatusKey | null {
    return STATUS_BY_LABEL[raw.trim().toLowerCase()] ?? null;
}

function mapWorkMode(raw: string): WorkMode | null {
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '');
    if (normalized.length === 0) {
        return null;
    }
    if (normalized === 'on-site' || normalized === 'onsite') {
        return 'onsite';
    }
    if (normalized === 'hybrid' || normalized === 'remote') {
        return normalized as WorkMode;
    }
    return null;
}

function buildRecruiterContact(email: string, phone: string): string | null {
    const parts = [email.trim(), phone.trim()].filter((part) => part.length > 0);
    return parts.length === 0 ? null : parts.join('\n');
}

function normalizeJobUrl(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return null;
    }
    let url: URL;
    try {
        url = new URL(trimmed);
    } catch {
        return null;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
    }
    url.hash = '';
    const params = [...url.searchParams.entries()]
        .filter(([key]) => !TRACKING_PARAM.test(key))
        .sort(([left], [right]) => left.localeCompare(right));
    url.search = '';
    for (const [key, param] of params) {
        url.searchParams.append(key, param);
    }
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
        url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
}

function parseApplicationsCsv(text: string): LovableApplicationRow[] {
    const records = parseDelimitedRecords(text.trim(), ';');
    const header = records[0].map((cell) => cell.trim().toLowerCase());
    const columnIndex = new Map(header.map((name, index) => [name, index]));
    const rows: LovableApplicationRow[] = [];

    for (let index = 1; index < records.length; index++) {
        const record = records[index];
        if (record.every((cell) => cell.trim().length === 0)) {
            continue;
        }
        const company = readCell(record, columnIndex, 'company');
        const title = readCell(record, columnIndex, 'role_title');
        const statusKey = mapStatus(readCell(record, columnIndex, 'status'));
        const createdAt = parseLovableDate(readCell(record, columnIndex, 'created_at'));
        const lastActivityAt = parseLovableDate(readCell(record, columnIndex, 'last_activity_at'));
        if (!statusKey || !createdAt || !lastActivityAt || company.length === 0 || title.length === 0) {
            throw new Error(`Invalid application row ${index + 1}`);
        }
        const applicationDateRaw = readCell(record, columnIndex, 'application_date');
        rows.push({
            lovableId: readCell(record, columnIndex, 'id'),
            companyName: company,
            title,
            location: emptyToNull(readCell(record, columnIndex, 'location')),
            workMode: mapWorkMode(readCell(record, columnIndex, 'work_mode')),
            statusKey,
            applicationDate: applicationDateRaw.length > 0 ? parseLovableDate(applicationDateRaw) : null,
            jobLink: emptyToNull(readCell(record, columnIndex, 'job_link')),
            recruiterName: emptyToNull(readCell(record, columnIndex, 'recruiter_name')),
            recruiterContact: buildRecruiterContact(
                readCell(record, columnIndex, 'recruiter_email'),
                readCell(record, columnIndex, 'recruiter_phone'),
            ),
            description: emptyToNull(readCell(record, columnIndex, 'notes')),
            lastActivityAt,
            createdAt,
        });
    }
    return rows;
}

function parseCvTemplatesCsv(text: string): LovableCvRow[] {
    const records = parseDelimitedRecords(text.trim(), ';');
    const header = records[0].map((cell) => cell.trim().toLowerCase());
    const columnIndex = new Map(header.map((name, index) => [name, index]));
    const rows: LovableCvRow[] = [];

    for (let index = 1; index < records.length; index++) {
        const record = records[index];
        if (record.every((cell) => cell.trim().length === 0)) {
            continue;
        }
        const createdAt = parseLovableDate(readCell(record, columnIndex, 'created_at'));
        if (!createdAt) {
            throw new Error(`Invalid CV template row ${index + 1}`);
        }
        const applicationId = readCell(record, columnIndex, 'application_id');
        rows.push({
            lovableId: readCell(record, columnIndex, 'id'),
            name: readCell(record, columnIndex, 'name'),
            html: readCell(record, columnIndex, 'html'),
            isBase: readCell(record, columnIndex, 'is_base').toLowerCase() === 'true',
            lovableApplicationId: applicationId.length > 0 ? applicationId : null,
            githubPath: emptyToNull(readCell(record, columnIndex, 'github_path')),
            createdAt,
        });
    }
    return rows;
}

function resolveAppliedAt(row: LovableApplicationRow): Date | null {
    if (row.statusKey === 'saved') {
        return null;
    }
    if (row.applicationDate) {
        return row.applicationDate;
    }
    return row.createdAt;
}

async function findOrCreateJob(prisma: PrismaClient, normalizedUrl: string | null) {
    if (normalizedUrl) {
        const existing = await prisma.job.findUnique({ where: { normalizedUrl } });
        if (existing) {
            return existing;
        }
    }
    try {
        return await prisma.job.create({
            data: { source: 'manual', normalizedUrl },
        });
    } catch {
        if (!normalizedUrl) {
            throw new Error('Failed to create job without URL');
        }
        const existing = await prisma.job.findUnique({ where: { normalizedUrl } });
        if (!existing) {
            throw new Error('Failed to create job');
        }
        return existing;
    }
}

async function importApplications(
    prisma: PrismaClient,
    userId: string,
    rows: LovableApplicationRow[],
): Promise<Map<string, string>> {
    const statusIds = new Map<SystemStatusKey, string>();
    for (const key of Object.keys(STATUS_BY_LABEL) as SystemStatusKey[]) {
        const status = await prisma.statusDef.findFirst({ where: { key } });
        if (!status) {
            throw new Error(`Missing system status: ${key}`);
        }
        statusIds.set(key, status.id);
    }
    const savedStatusId = statusIds.get('saved');
    const appliedStatusId = statusIds.get('applied');
    if (!savedStatusId || !appliedStatusId) {
        throw new Error('Missing saved/applied statuses');
    }

    const lovableToMatchbox = new Map<string, string>();
    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
        const normalizedUrl = row.jobLink ? normalizeJobUrl(row.jobLink) : null;
        const duplicate = normalizedUrl
            ? await prisma.application.findFirst({
                  where: { userId, job: { normalizedUrl } },
                  select: { id: true, jobId: true },
              })
            : await prisma.application.findFirst({
                  where: { userId, companyName: row.companyName, title: row.title, url: null },
                  select: { id: true, jobId: true },
              });
        if (duplicate) {
            if (row.lovableId) {
                lovableToMatchbox.set(row.lovableId, duplicate.id);
            }
            skipped++;
            continue;
        }

        const statusId = statusIds.get(row.statusKey);
        if (!statusId) {
            throw new Error(`Unsupported status ${row.statusKey}`);
        }

        const job = await findOrCreateJob(prisma, normalizedUrl);
        const appliedAt = resolveAppliedAt(row);

        const application = await prisma.$transaction(async (tx) => {
            const created = await tx.application.create({
                data: {
                    userId,
                    jobId: job.id,
                    statusId,
                    companyName: row.companyName,
                    title: row.title,
                    url: row.jobLink,
                    location: row.location,
                    workMode: row.workMode,
                    description: row.description,
                    recruiterName: row.recruiterName,
                    recruiterContact: row.recruiterContact,
                    appliedAt,
                    lastActivityAt: row.lastActivityAt,
                    createdAt: row.createdAt,
                },
            });

            const events: Prisma.EventCreateManyInput[] = [
                {
                    userId,
                    applicationId: created.id,
                    type: 'created',
                    payload: { source: 'lovable_import', lovableId: row.lovableId },
                    occurredAt: row.createdAt,
                },
            ];

            if (row.statusKey === 'applied' && appliedAt) {
                events.push({
                    userId,
                    applicationId: created.id,
                    type: 'status_changed',
                    payload: { fromStatusId: savedStatusId, toStatusId: appliedStatusId },
                    occurredAt: appliedAt,
                });
            } else if (row.statusKey === 'rejected' && appliedAt) {
                const rejectedStatusId = statusIds.get('rejected');
                if (!rejectedStatusId) {
                    throw new Error('Missing rejected status');
                }
                events.push({
                    userId,
                    applicationId: created.id,
                    type: 'status_changed',
                    payload: { fromStatusId: savedStatusId, toStatusId: appliedStatusId },
                    occurredAt: appliedAt,
                });
                events.push({
                    userId,
                    applicationId: created.id,
                    type: 'status_changed',
                    payload: { fromStatusId: appliedStatusId, toStatusId: rejectedStatusId },
                    occurredAt: row.lastActivityAt,
                });
            } else if (row.statusKey !== 'saved') {
                events.push({
                    userId,
                    applicationId: created.id,
                    type: 'status_changed',
                    payload: { fromStatusId: savedStatusId, toStatusId: statusId },
                    occurredAt: appliedAt ?? row.createdAt,
                });
            }

            await tx.event.createMany({ data: events });
            return created;
        });

        if (row.lovableId) {
            lovableToMatchbox.set(row.lovableId, application.id);
        }
        imported++;
    }

    console.log(`Applications: imported ${imported}, skipped ${skipped} (already present)`);
    return lovableToMatchbox;
}

async function importCvTemplates(
    prisma: PrismaClient,
    userId: string,
    rows: LovableCvRow[],
    lovableApplicationIds: Map<string, string>,
): Promise<void> {
    const templateDocument = await prisma.cvVersion.findFirst({
        where: { userId, status: 'saved' },
        orderBy: { createdAt: 'desc' },
        select: { cv: true, templateId: true },
    });
    if (!templateDocument) {
        console.log('CV templates: skipped (no saved CvVersion to copy JSON from; build base CV in Matchbox first)');
        return;
    }

    const cvJson = templateDocument.cv as Prisma.InputJsonValue;
    let created = 0;
    let skipped = 0;

    for (const row of rows) {
        if (row.isBase) {
            const existing = await prisma.cvVersion.findFirst({
                where: { userId, isBase: true },
                select: { id: true },
            });
            if (existing) {
                skipped++;
                continue;
            }
            await prisma.cvVersion.create({
                data: {
                    userId,
                    isBase: true,
                    cv: cvJson,
                    templateId: templateDocument.templateId,
                    gitPath: row.githubPath,
                    status: 'saved',
                    createdAt: row.createdAt,
                },
            });
            created++;
            continue;
        }

        const matchboxApplicationId = row.lovableApplicationId
            ? lovableApplicationIds.get(row.lovableApplicationId)
            : null;

        if (row.lovableApplicationId && !matchboxApplicationId) {
            console.warn(`CV "${row.name}": no Matchbox application for Lovable id ${row.lovableApplicationId}`);
            skipped++;
            continue;
        }

        if (matchboxApplicationId) {
            const existing = await prisma.cvVersion.findFirst({
                where: { userId, applicationId: matchboxApplicationId, status: 'saved' },
                select: { id: true },
            });
            if (existing) {
                skipped++;
                continue;
            }
        }

        await prisma.cvVersion.create({
            data: {
                userId,
                applicationId: matchboxApplicationId,
                isBase: false,
                cv: cvJson,
                templateId: templateDocument.templateId,
                gitPath: row.githubPath,
                status: 'saved',
                createdAt: row.createdAt,
            },
        });
        created++;
    }

    console.log(`CV template rows: created ${created}, skipped ${skipped}`);
    console.log('Note: Lovable HTML was not stored; Matchbox uses structured CV JSON. Git paths were preserved where present.');
}

async function main(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set (check .env)');
    }

    const { applicationsPath, cvTemplatesPath } = parseArgs(process.argv.slice(2));
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    await prisma.$connect();

    try {
        const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
        if (!user) {
            throw new Error('No Matchbox user found. Sign in once so the API creates your user row.');
        }
        console.log(`Importing for user ${user.email} (${user.id})`);

        const applicationRows = parseApplicationsCsv(readFileSync(applicationsPath, 'utf8'));
        const idMap = await importApplications(prisma, user.id, applicationRows);

        if (cvTemplatesPath) {
            const cvRows = parseCvTemplatesCsv(readFileSync(cvTemplatesPath, 'utf8'));
            await importCvTemplates(prisma, user.id, cvRows, idMap);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
