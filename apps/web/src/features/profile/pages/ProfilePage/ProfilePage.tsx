import type { Profile } from '@matchbox/shared';
import { Alert, Box, Button, Card, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@matchbox/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'src/features/auth';

import {
    useCreateEducation,
    useCreateExperience,
    useCreateProject,
    useDeleteEducation,
    useDeleteExperience,
    useDeleteProject,
    useProfile,
    useUpdateEducation,
    useUpdateExperience,
    useUpdateProject,
} from '../../api/profile.queries';
import { ProfileHeader } from '../../components/ProfileHeader';
import { profileHeadline } from '../../profile-headline.utils';
import { ProfileItemsSection } from '../../sections/ProfileItemsSection';
import { SkillsSection } from '../../sections/SkillsSection';

export function ProfilePage() {
    const { t } = useTranslation('profile');
    const { t: tCommon } = useTranslation();
    const currentUser = useCurrentUser();
    const profile = useProfile();
    const createExperience = useCreateExperience();
    const updateExperience = useUpdateExperience();
    const deleteExperience = useDeleteExperience();
    const createProject = useCreateProject();
    const updateProject = useUpdateProject();
    const deleteProject = useDeleteProject();
    const createEducation = useCreateEducation();
    const updateEducation = useUpdateEducation();
    const deleteEducation = useDeleteEducation();
    const [isImportOpen, setIsImportOpen] = useState(false);

    const confirmDelete = (title: string) => window.confirm(t('item.confirmDelete', { title }));

    const displayName =
        currentUser.data?.displayName?.trim() ||
        currentUser.data?.email?.split('@')[0] ||
        tCommon('nav.userFallback');
    const headline =
        profile.data === undefined
            ? undefined
            : profileHeadline(profile.data) ?? t('header.headlineEmpty');

    return (
        <>
            <ProfileHeader
                actions={
                    <Button data-test="profile-import-cv-button" onClick={() => setIsImportOpen(true)} variant="outlined">
                        {t('import.button')}
                    </Button>
                }
                description={headline}
                title={displayName}
            />
            {profile.isPending ? (
                <CircularProgress data-test="profile-loading" />
            ) : profile.isError ? (
                <Alert severity="error">{t('errors.loadFailed')}</Alert>
            ) : (
                <ProfileSections
                    confirmDelete={confirmDelete}
                    createEducation={createEducation}
                    createExperience={createExperience}
                    createProject={createProject}
                    deleteEducation={deleteEducation}
                    deleteExperience={deleteExperience}
                    deleteProject={deleteProject}
                    profile={profile.data}
                    updateEducation={updateEducation}
                    updateExperience={updateExperience}
                    updateProject={updateProject}
                />
            )}
            <Dialog onClose={() => setIsImportOpen(false)} open={isImportOpen}>
                <DialogTitle>{t('import.title')}</DialogTitle>
                <DialogContent>
                    <Alert severity="info">{t('import.description')}</Alert>
                </DialogContent>
                <DialogActions>
                    <Button data-test="profile-import-cv-close-button" onClick={() => setIsImportOpen(false)}>
                        {t('import.close')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

type ProfileSectionsProps = {
    confirmDelete: (title: string) => boolean;
    createEducation: ReturnType<typeof useCreateEducation>;
    createExperience: ReturnType<typeof useCreateExperience>;
    createProject: ReturnType<typeof useCreateProject>;
    deleteEducation: ReturnType<typeof useDeleteEducation>;
    deleteExperience: ReturnType<typeof useDeleteExperience>;
    deleteProject: ReturnType<typeof useDeleteProject>;
    profile: Profile;
    updateEducation: ReturnType<typeof useUpdateEducation>;
    updateExperience: ReturnType<typeof useUpdateExperience>;
    updateProject: ReturnType<typeof useUpdateProject>;
};

function ProfileSections({
    confirmDelete,
    createEducation,
    createExperience,
    createProject,
    deleteEducation,
    deleteExperience,
    deleteProject,
    profile,
    updateEducation,
    updateExperience,
    updateProject,
}: ProfileSectionsProps) {
    const { t } = useTranslation('profile');

    return (
        <Stack spacing={2}>
            <Card>
                <Box sx={{ p: 2 }}>
                    <Stack spacing={2}>
                        {deleteExperience.isError ? <Alert severity="error">{t('errors.deleteFailed')}</Alert> : null}
                        <ProfileItemsSection
                            deletingId={deleteExperience.isPending ? deleteExperience.variables : undefined}
                            isPending={createExperience.isPending || updateExperience.isPending}
                            items={profile.experience}
                            kind="experience"
                            onCreate={(input, handlers) => createExperience.mutate(input, handlers)}
                            onDelete={(itemId, title) => {
                                if (confirmDelete(title)) {
                                    deleteExperience.mutate(itemId);
                                }
                            }}
                            onUpdate={(itemId, input, handlers) =>
                                updateExperience.mutate({ itemId, input }, handlers)
                            }
                        />
                    </Stack>
                </Box>
            </Card>
            <Card>
                <Box sx={{ p: 2 }}>
                    <Stack spacing={2}>
                        {deleteProject.isError ? <Alert severity="error">{t('errors.deleteFailed')}</Alert> : null}
                        <ProfileItemsSection
                            deletingId={deleteProject.isPending ? deleteProject.variables : undefined}
                            isPending={createProject.isPending || updateProject.isPending}
                            items={profile.projects}
                            kind="project"
                            onCreate={(input, handlers) => createProject.mutate(input, handlers)}
                            onDelete={(itemId, title) => {
                                if (confirmDelete(title)) {
                                    deleteProject.mutate(itemId);
                                }
                            }}
                            onUpdate={(itemId, input, handlers) => updateProject.mutate({ itemId, input }, handlers)}
                        />
                    </Stack>
                </Box>
            </Card>
            <Card>
                <Box sx={{ p: 2 }}>
                    <SkillsSection skills={profile.skills} />
                </Box>
            </Card>
            <Card>
                <Box sx={{ p: 2 }}>
                    <Stack spacing={2}>
                        {deleteEducation.isError ? <Alert severity="error">{t('errors.deleteFailed')}</Alert> : null}
                        <ProfileItemsSection
                            deletingId={deleteEducation.isPending ? deleteEducation.variables : undefined}
                            isPending={createEducation.isPending || updateEducation.isPending}
                            items={profile.education}
                            kind="education"
                            onCreate={(input, handlers) => createEducation.mutate(input, handlers)}
                            onDelete={(itemId, title) => {
                                if (confirmDelete(title)) {
                                    deleteEducation.mutate(itemId);
                                }
                            }}
                            onUpdate={(itemId, input, handlers) =>
                                updateEducation.mutate({ itemId, input }, handlers)
                            }
                        />
                    </Stack>
                </Box>
            </Card>
        </Stack>
    );
}
