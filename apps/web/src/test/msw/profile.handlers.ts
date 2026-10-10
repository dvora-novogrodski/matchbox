import {
    CreateEducationSchema,
    CreateExperienceSchema,
    CreateProjectSchema,
    type Profile,
    ProfileSchema,
    ReplaceProfileSkillsSchema,
    UpdateEducationSchema,
    UpdateExperienceSchema,
    UpdateProjectSchema,
} from '@matchbox/shared';
import { http } from 'msw/core/http';

export type ProfileState = {
    profile: Profile;
};

function nextId() {
    return crypto.randomUUID();
}

function assignBullets(bullets: { id?: string; text: string }[]) {
    return bullets.map((bullet) => ({ id: bullet.id ?? nextId(), text: bullet.text }));
}

export function createProfileHandlers(state: ProfileState) {
    return [
        http.get('http://localhost:3000/api/v1/profile', () => Response.json(ProfileSchema.parse(state.profile))),
        http.post('http://localhost:3000/api/v1/profile/experience', async ({ request }) => {
            const input = CreateExperienceSchema.parse(await request.json());
            const item = {
                id: nextId(),
                title: input.title,
                organization: input.organization ?? null,
                startDate: input.startDate ?? null,
                endDate: input.endDate ?? null,
                tech: input.tech ?? [],
                bullets: assignBullets(input.bullets ?? []),
            };
            state.profile.experience = [item, ...state.profile.experience];
            return Response.json(item, { status: 201 });
        }),
        http.patch('http://localhost:3000/api/v1/profile/experience/:itemId', async ({ request, params }) => {
            const input = UpdateExperienceSchema.parse(await request.json());
            const itemId = String(params.itemId);
            state.profile.experience = state.profile.experience.map((item) =>
                item.id === itemId
                    ? {
                          ...item,
                          ...input,
                          bullets: input.bullets ? assignBullets(input.bullets) : item.bullets,
                      }
                    : item,
            );
            return Response.json(state.profile.experience.find((item) => item.id === itemId));
        }),
        http.delete('http://localhost:3000/api/v1/profile/experience/:itemId', ({ params }) => {
            const itemId = String(params.itemId);
            state.profile.experience = state.profile.experience.filter((item) => item.id !== itemId);
            return new Response(null, { status: 204 });
        }),
        http.put('http://localhost:3000/api/v1/profile/skills', async ({ request }) => {
            const input = ReplaceProfileSkillsSchema.parse(await request.json());
            const existing = new Map(state.profile.skills.map((skill) => [skill.name.toLowerCase(), skill]));
            state.profile.skills = input.skills.map((name) => {
                const match = existing.get(name.toLowerCase());
                return match ?? { id: nextId(), name };
            });
            return Response.json({ skills: state.profile.skills });
        }),
        http.post('http://localhost:3000/api/v1/profile/projects', async ({ request }) => {
            const input = CreateProjectSchema.parse(await request.json());
            const item = {
                id: nextId(),
                title: input.title,
                organization: input.organization ?? null,
                startDate: input.startDate ?? null,
                endDate: input.endDate ?? null,
                tech: input.tech ?? [],
                bullets: assignBullets(input.bullets ?? []),
            };
            state.profile.projects = [item, ...state.profile.projects];
            return Response.json(item, { status: 201 });
        }),
        http.patch('http://localhost:3000/api/v1/profile/projects/:itemId', async ({ request, params }) => {
            const input = UpdateProjectSchema.parse(await request.json());
            const itemId = String(params.itemId);
            state.profile.projects = state.profile.projects.map((item) =>
                item.id === itemId
                    ? {
                          ...item,
                          ...input,
                          bullets: input.bullets ? assignBullets(input.bullets) : item.bullets,
                      }
                    : item,
            );
            return Response.json(state.profile.projects.find((item) => item.id === itemId));
        }),
        http.delete('http://localhost:3000/api/v1/profile/projects/:itemId', ({ params }) => {
            state.profile.projects = state.profile.projects.filter((item) => item.id !== String(params.itemId));
            return new Response(null, { status: 204 });
        }),
        http.post('http://localhost:3000/api/v1/profile/education', async ({ request }) => {
            const input = CreateEducationSchema.parse(await request.json());
            const item = {
                id: nextId(),
                degree: input.degree,
                institution: input.institution ?? null,
                startDate: input.startDate ?? null,
                endDate: input.endDate ?? null,
                bullets: assignBullets(input.bullets ?? []),
            };
            state.profile.education = [item, ...state.profile.education];
            return Response.json(item, { status: 201 });
        }),
        http.patch('http://localhost:3000/api/v1/profile/education/:itemId', async ({ request, params }) => {
            const input = UpdateEducationSchema.parse(await request.json());
            const itemId = String(params.itemId);
            state.profile.education = state.profile.education.map((item) =>
                item.id === itemId
                    ? {
                          ...item,
                          ...input,
                          bullets: input.bullets ? assignBullets(input.bullets) : item.bullets,
                      }
                    : item,
            );
            return Response.json(state.profile.education.find((item) => item.id === itemId));
        }),
        http.delete('http://localhost:3000/api/v1/profile/education/:itemId', ({ params }) => {
            state.profile.education = state.profile.education.filter((item) => item.id !== String(params.itemId));
            return new Response(null, { status: 204 });
        }),
    ];
}

export function emptyProfile(): Profile {
    return { experience: [], projects: [], education: [], skills: [] };
}
