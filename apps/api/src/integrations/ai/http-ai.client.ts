import { CV_CHANGE_OPS } from '@matchbox/shared';
import { z } from 'zod';

import { TailorUnavailableError } from './ai.errors';
import { AiClient, type TailorInput, type TailorOutput } from './ai-client.port';

const AiCvChangeSchema = z.object({
    path: z.string(),
    op: z.enum(CV_CHANGE_OPS),
    before: z.string().nullable(),
    after: z.string(),
    evidence_ids: z.array(z.uuid()),
    rationale: z.string(),
    state: z.enum(['proposed', 'blocked']),
    blocked_reason: z.string().nullable(),
});

const AiTailorResponseSchema = z.object({
    model: z.string().min(1),
    prompt_version: z.string().min(1),
    run_id: z.uuid().nullable().optional(),
    changes: z.array(AiCvChangeSchema),
});

export class HttpAiClient extends AiClient {
    constructor(
        private readonly baseUrl: string | undefined,
        private readonly timeoutMs: number,
    ) {
        super();
    }

    async tailor(input: TailorInput): Promise<TailorOutput> {
        if (!this.baseUrl) {
            throw new TailorUnavailableError();
        }
        try {
            const response = await fetch(new URL('/v1/tailor', this.baseUrl), {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    job: input.job,
                    cv: input.cv,
                    evidence: input.evidence,
                }),
                signal: AbortSignal.timeout(this.timeoutMs),
            });
            if (!response.ok) {
                throw new TailorUnavailableError();
            }
            return parseTailorResponse(await response.json());
        } catch (error) {
            if (error instanceof TailorUnavailableError) {
                throw error;
            }
            throw new TailorUnavailableError();
        }
    }
}

function parseTailorResponse(payload: unknown): TailorOutput {
    const parsed = AiTailorResponseSchema.safeParse(payload);
    if (!parsed.success) {
        throw new TailorUnavailableError();
    }
    return {
        model: parsed.data.model,
        promptVersion: parsed.data.prompt_version,
        runId: parsed.data.run_id ?? null,
        changes: parsed.data.changes.map((change) => ({
            path: change.path,
            op: change.op,
            before: change.before,
            after: change.after,
            evidenceIds: change.evidence_ids,
            rationale: change.rationale,
            state: change.state,
            blockedReason: change.blocked_reason,
        })),
    };
}
