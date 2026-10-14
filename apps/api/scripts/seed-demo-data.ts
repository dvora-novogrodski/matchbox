/**
 * Temporary UI demo data (Discover queue with "Why it fits" lines).
 *
 * Sign in once so your user row exists, then:
 *
 *   npx tsx scripts/seed-demo-data.ts
 *   npx tsx scripts/seed-demo-data.ts --email you@example.com
 *   npx tsx scripts/seed-demo-data.ts --reset
 *
 * Jobs use external ids `demo-ui-*` so --reset can remove them without touching real data.
 */
import { resolve } from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

import { PrismaClient } from '../src/generated/prisma/client';
import type { Prisma } from '../src/generated/prisma/client';

config({ path: resolve(__dirname, '../../../.env') });

const DEMO_PREFIX = 'demo-ui-';

type DemoMatch = {
    companyName: string;
    description: string;
    externalId: string;
    location: string;
    requirements: Prisma.InputJsonValue;
    score: number;
    coverage: Prisma.InputJsonValue;
    title: string;
    url: string;
    workMode: 'hybrid' | 'onsite' | 'remote';
};

const DEMO_MATCHES: DemoMatch[] = [
    {
        externalId: `${DEMO_PREFIX}riskified`,
        companyName: 'Riskified',
        title: 'Senior full-stack engineer',
        location: 'Tel Aviv',
        workMode: 'hybrid',
        url: 'https://www.riskified.com/careers/senior-full-stack-engineer',
        description:
            'Own features across the merchant-facing product. Strong TypeScript and React experience expected.',
        score: 88,
        requirements: [
            { text: 'TypeScript, Node.js, React', kind: 'must', category: 'skill', hard: true },
            { text: '5+ years backend experience', kind: 'must', category: 'experience', hard: true },
            { text: 'Payments or fraud domain', kind: 'nice', category: 'domain', hard: false },
        ],
        coverage: [
            {
                requirement_index: 0,
                coverage: 'covered',
                evidence_ids: [],
                reason: 'Listed on your profile',
            },
            {
                requirement_index: 1,
                coverage: 'missing',
                evidence_ids: [],
                reason: 'Profile shows ~4 years in role',
            },
            {
                requirement_index: 2,
                coverage: 'partial',
                evidence_ids: [],
                reason: 'Adjacent e-commerce experience',
            },
        ],
    },
    {
        externalId: `${DEMO_PREFIX}monday`,
        companyName: 'monday.com',
        title: 'Backend engineer',
        location: 'Tel Aviv',
        workMode: 'hybrid',
        url: 'https://monday.com/careers/backend-engineer',
        description: 'Build scalable services for the work-management platform.',
        score: 76,
        requirements: [
            { text: 'Node.js or Python services', kind: 'must', category: 'skill', hard: true },
            { text: 'PostgreSQL', kind: 'must', category: 'skill', hard: true },
            { text: 'Kubernetes', kind: 'nice', category: 'skill', hard: false },
        ],
        coverage: [
            { requirement_index: 0, coverage: 'covered', evidence_ids: [], reason: 'Recent projects' },
            { requirement_index: 1, coverage: 'covered', evidence_ids: [], reason: 'Used in last role' },
            { requirement_index: 2, coverage: 'missing', evidence_ids: [], reason: 'Not on profile yet' },
        ],
    },
    {
        externalId: `${DEMO_PREFIX}wix`,
        companyName: 'Wix',
        title: 'Software engineer',
        location: 'Tel Aviv',
        workMode: 'onsite',
        url: 'https://www.wix.com/jobs/software-engineer',
        description: 'Ship customer-facing features for the editor ecosystem.',
        score: 82,
        requirements: [
            { text: 'React and modern CSS', kind: 'must', category: 'skill', hard: true },
            { text: 'System design interviews', kind: 'must', category: 'other', hard: true },
        ],
        coverage: [
            { requirement_index: 0, coverage: 'covered', evidence_ids: [], reason: 'Strong frontend stack' },
            { requirement_index: 1, coverage: 'partial', evidence_ids: [], reason: 'Limited staff-level examples' },
        ],
    },
];

function parseArgs(argv: string[]): { email: string | null; reset: boolean } {
    let email: string | null = null;
    let reset = false;
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index];
        if (arg === '--email' && argv[index + 1]) {
            email = argv[++index];
        } else if (arg === '--reset') {
            reset = true;
        }
    }
    return { email, reset };
}

async function resetDemoData(prisma: PrismaClient, userId: string): Promise<void> {
    const jobs = await prisma.job.findMany({
        where: { externalId: { startsWith: DEMO_PREFIX } },
        select: { id: true },
    });
    if (jobs.length === 0) {
        console.log('No demo jobs to remove.');
        return;
    }
    const jobIds = jobs.map((job) => job.id);
    await prisma.jobMatch.deleteMany({ where: { userId, jobId: { in: jobIds } } });
    await prisma.job.deleteMany({ where: { id: { in: jobIds } } });
    console.log(`Removed ${jobs.length} demo job(s) and their matches.`);
}

async function seedDemoData(prisma: PrismaClient, userId: string): Promise<void> {
    for (const demo of DEMO_MATCHES) {
        let company = await prisma.company.findFirst({ where: { name: demo.companyName } });
        if (!company) {
            company = await prisma.company.create({ data: { name: demo.companyName } });
        }

        const job = await prisma.job.upsert({
            where: { source_externalId: { source: 'comeet', externalId: demo.externalId } },
            create: {
                source: 'comeet',
                externalId: demo.externalId,
                companyId: company.id,
                title: demo.title,
                location: demo.location,
                workMode: demo.workMode,
                url: demo.url,
                description: demo.description,
                requirements: demo.requirements,
            },
            update: {
                title: demo.title,
                location: demo.location,
                workMode: demo.workMode,
                url: demo.url,
                description: demo.description,
                requirements: demo.requirements,
                companyId: company.id,
            },
        });

        await prisma.jobMatch.upsert({
            where: { userId_jobId: { userId, jobId: job.id } },
            create: {
                userId,
                jobId: job.id,
                score: demo.score,
                coverage: demo.coverage,
                inputHash: demo.externalId,
                model: 'demo-seed',
                promptVersion: 'ui-preview',
                decision: 'pending',
            },
            update: {
                score: demo.score,
                coverage: demo.coverage,
                decision: 'pending',
                decidedAt: null,
            },
        });

        console.log(`  • ${demo.companyName} — ${demo.title} (${demo.score}% match)`);
    }
}

async function main(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set (check .env)');
    }

    const { email, reset } = parseArgs(process.argv.slice(2));
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    await prisma.$connect();

    try {
        const user = email
            ? await prisma.user.findFirst({ where: { email } })
            : await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
        if (!user) {
            throw new Error(
                email
                    ? `No user with email ${email}. Sign in once, or omit --email to use the first user.`
                    : 'No Matchbox user found. Sign in once so the API creates your user row.',
            );
        }

        console.log(`Demo data for ${user.email} (${user.id})`);

        if (reset) {
            await resetDemoData(prisma, user.id);
            return;
        }

        await resetDemoData(prisma, user.id);
        console.log('Seeding Discover queue:');
        await seedDemoData(prisma, user.id);
        console.log('\nOpen http://localhost:5173/discover (refresh if already open).');
        console.log('Today will also list these as new matches.');
        console.log('Remove with: npx tsx scripts/seed-demo-data.ts --reset');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
