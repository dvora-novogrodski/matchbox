import type { ZodError } from 'zod';

export function firstZodIssueMessage(error: ZodError): string {
    const issue = error.issues[0];
    if (!issue) {
        return 'Validation failed';
    }
    return issue.message;
}
