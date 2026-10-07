import { z } from 'zod';

export const CurrentUserSchema = z.object({
    id: z.uuid(),
    email: z.email(),
    displayName: z.string().nullable(),
});

export type CurrentUser = z.infer<typeof CurrentUserSchema>;
