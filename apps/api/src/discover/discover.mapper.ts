import type { Application, DiscoverFitLine } from '@matchbox/shared';
import { JobRequirementSchema, MatchRequirementSchema } from '@matchbox/shared';
import { z } from 'zod';

import { toStatus } from '../statuses/statuses.mapper';
import type { SavedApplicationRecord } from './types/discover.types';

const MAX_FIT_LINES = 4;

export function toSavedApplication(application: SavedApplicationRecord): Application {
    return {
        id: application.id,
        job: application.job,
        status: toStatus(application.status),
        recruiterName: application.recruiterName,
        recruiterContact: application.recruiterContact,
        notes: application.notes,
        appliedAt: application.appliedAt?.toISOString() ?? null,
        lastActivityAt: application.lastActivityAt.toISOString(),
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
    };
}

export function toDiscoverFitLines(requirements: unknown, coverage: unknown): DiscoverFitLine[] {
    const jobRequirements = z.array(JobRequirementSchema).safeParse(requirements);
    const matchRequirements = z.array(MatchRequirementSchema).safeParse(coverage);
    if (!jobRequirements.success || !matchRequirements.success) {
        return [];
    }

    const lines: DiscoverFitLine[] = [];
    for (const item of matchRequirements.data) {
        const text = jobRequirements.data[item.requirement_index]?.text?.trim();
        if (!text) {
            continue;
        }
        if (item.coverage === 'covered') {
            lines.push({ text, tone: 'strength' });
        } else if (item.coverage === 'partial' || item.coverage === 'missing') {
            lines.push({ text, tone: 'gap' });
        }
        if (lines.length >= MAX_FIT_LINES) {
            break;
        }
    }
    return lines;
}
