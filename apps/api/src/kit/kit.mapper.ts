import { type ApplicationKit, type UpdateApplicationKit, UpdateApplicationKitSchema } from '@matchbox/shared';

const EMPTY_KIT: ApplicationKit = {
    coverLetter: '',
    whyCompany: '',
    whyRole: '',
    aboutYou: '',
    saved: false,
};

export function toApplicationKit(kit: unknown): ApplicationKit {
    if (kit === null || kit === undefined) {
        return EMPTY_KIT;
    }
    const parsed = UpdateApplicationKitSchema.safeParse(kit);
    if (!parsed.success) {
        return EMPTY_KIT;
    }
    return { ...parsed.data, saved: true };
}

export function toStoredKit(kit: UpdateApplicationKit): UpdateApplicationKit {
    return UpdateApplicationKitSchema.parse(kit);
}
