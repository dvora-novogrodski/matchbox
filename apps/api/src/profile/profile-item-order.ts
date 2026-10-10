import type { Prisma } from '../generated/prisma/client';

export const profileItemOrderBy: Prisma.CareerItemOrderByWithRelationInput[] = [
    { endDate: { sort: 'desc', nulls: 'first' } },
    { startDate: { sort: 'desc', nulls: 'last' } },
    { createdAt: 'desc' },
];
