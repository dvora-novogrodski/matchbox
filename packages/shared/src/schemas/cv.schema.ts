import { z } from 'zod';

import { CV_LIMITS } from '../constants/cv-limits';
import { DEFAULT_CV_TEMPLATE_ID } from '../constants/domain';
import { CalendarDateSchema } from './profile.schema';

const {
    maxContactLength,
    maxHeadlineLength,
    maxItemsPerSection,
    maxLinkLabelLength,
    maxLinkUrlLength,
    maxLinks,
    maxNameLength,
    maxPhoneLength,
    maxSummaryLength,
} = CV_LIMITS;

const nullableText = (max: number) => z.string().trim().max(max).nullable();

function uniqueIds(ids: string[], context: z.RefinementCtx): void {
    if (new Set(ids).size !== ids.length) {
        context.addIssue({ code: 'custom', message: 'Ids must be unique' });
    }
}

const idList = z.array(z.uuid()).max(maxItemsPerSection).superRefine(uniqueIds);

export const CvLinkSchema = z.object({
    label: z.string().trim().min(1).max(maxLinkLabelLength),
    url: z
        .url()
        .max(maxLinkUrlLength)
        .refine((value) => {
            const protocol = new URL(value).protocol;
            return protocol === 'http:' || protocol === 'https:';
        }, 'Link must use http or https'),
});

export const CvHeaderSchema = z.object({
    fullName: z.string().trim().min(1).max(maxNameLength),
    headline: nullableText(maxHeadlineLength),
    email: z.email().nullable(),
    phone: nullableText(maxPhoneLength),
    location: nullableText(maxContactLength),
    links: z.array(CvLinkSchema).max(maxLinks),
});

export const BaseCvSchema = z.object({
    header: CvHeaderSchema,
    summary: z.string().trim().max(maxSummaryLength),
    experienceItemIds: idList,
    projectItemIds: idList,
    skillIds: idList,
    educationItemIds: idList,
});

const nullableDate = CalendarDateSchema.nullable();

export const CvRoleEntrySchema = z.object({
    careerItemId: z.uuid(),
    title: z.string(),
    organization: z.string().nullable(),
    startDate: nullableDate,
    endDate: nullableDate,
    tech: z.array(z.string()),
    bullets: z.array(z.string()),
});

export const CvEducationEntrySchema = z.object({
    careerItemId: z.uuid(),
    degree: z.string(),
    institution: z.string().nullable(),
    startDate: nullableDate,
    endDate: nullableDate,
    bullets: z.array(z.string()),
});

export const CvSkillEntrySchema = z.object({
    skillId: z.uuid(),
    name: z.string(),
});

export const CvDocumentSchema = z.object({
    header: CvHeaderSchema,
    summary: z.string(),
    experience: z.array(CvRoleEntrySchema),
    projects: z.array(CvRoleEntrySchema),
    skills: z.array(CvSkillEntrySchema),
    education: z.array(CvEducationEntrySchema),
});

export const CvCatalogItemSchema = z.object({
    id: z.uuid(),
    title: z.string(),
    subtitle: z.string().nullable(),
});

export const CvCatalogSchema = z.object({
    experience: z.array(CvCatalogItemSchema),
    projects: z.array(CvCatalogItemSchema),
    skills: z.array(CvCatalogItemSchema),
    education: z.array(CvCatalogItemSchema),
});

export const CvVersionSchema = z.object({
    id: z.uuid(),
    isBase: z.boolean(),
    templateId: z.string(),
    gitPath: z.string().nullable(),
    commitSha: z.string().nullable(),
    createdAt: z.iso.datetime(),
});

export const CvGithubStatusSchema = z.object({
    repo: z.string().nullable(),
    connected: z.boolean(),
});

export const CvEditorSchema = z.object({
    selection: BaseCvSchema,
    document: CvDocumentSchema,
    html: z.string(),
    isCustomized: z.boolean(),
    catalog: CvCatalogSchema,
    latestVersion: CvVersionSchema.nullable(),
    removedItemCount: z.number().int().nonnegative(),
    github: CvGithubStatusSchema,
    templateId: z.literal(DEFAULT_CV_TEMPLATE_ID),
});

export const ConnectGithubSchema = z.object({
    repo: z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, 'Use owner/repository'),
    token: z.string().trim().min(1).max(500),
});

export const GithubConnectionSchema = z.object({
    repo: z.string(),
    connected: z.literal(true),
});

export type CvLink = z.infer<typeof CvLinkSchema>;
export type CvHeader = z.infer<typeof CvHeaderSchema>;
export type BaseCv = z.infer<typeof BaseCvSchema>;
export type CvDocument = z.infer<typeof CvDocumentSchema>;
export type CvCatalogItem = z.infer<typeof CvCatalogItemSchema>;
export type CvCatalog = z.infer<typeof CvCatalogSchema>;
export type CvVersion = z.infer<typeof CvVersionSchema>;
export type CvEditor = z.infer<typeof CvEditorSchema>;
export type ConnectGithub = z.infer<typeof ConnectGithubSchema>;
export type GithubConnection = z.infer<typeof GithubConnectionSchema>;
