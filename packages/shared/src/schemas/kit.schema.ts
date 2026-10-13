import { z } from 'zod';

export const KIT_TEXT_MAX_LENGTH = 20000;

const kitText = z.string().trim().max(KIT_TEXT_MAX_LENGTH);

export const UpdateApplicationKitSchema = z.object({
    coverLetter: kitText,
    whyCompany: kitText,
    whyRole: kitText,
    aboutYou: kitText,
});
export type UpdateApplicationKit = z.infer<typeof UpdateApplicationKitSchema>;

export const ApplicationKitSchema = UpdateApplicationKitSchema.extend({
    saved: z.boolean(),
});
export type ApplicationKit = z.infer<typeof ApplicationKitSchema>;
