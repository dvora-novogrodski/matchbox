import { Alert, Box, Button, Card, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@matchbox/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import { ProfileItemsSection } from '../../sections/ProfileItemsSection';
import { SkillsSection } from '../../sections/SkillsSection';

export function ProfilePage() {
    const { t } = useTranslation('profile');
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

    return (
        <Box component="main" sx={{ mx: 'auto', maxWidth: 960, p: 4 }}>
            <Stack spacing={3}>
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'flex-start' }, justifyContent: 'space-between' }}>
                    <Stack spacing={1}>
                        <Typography component="h1" variant="h3">
                            {t('page.title')}
                        </Typography>
                        <Typography color="text.secondary">{t('page.description')}</Typography>
                    </Stack>
                    <Button data-test="profile-import-cv-button" onClick={() => setIsImportOpen(true)} variant="outlined">
                        {t('import.button')}
                    </Button>
                </Stack>
                {profile.isPending ? (
                    <CircularProgress data-test="profile-loading" />
                ) : profile.isError ? (
                    <Alert severity="error">{t('errors.loadFailed')}</Alert>
                ) : (
                    <Stack spacing={2}>
                        <Card variant="outlined">
                            <Box sx={{ p: 3 }}>
                                <Stack spacing={2}>
                                    {deleteExperience.isError ? (
                                        <Alert severity="error">{t('errors.deleteFailed')}</Alert>
                                    ) : null}
                                    <ProfileItemsSection
                                        deletingId={deleteExperience.isPending ? deleteExperience.variables : undefined}
                                        isPending={createExperience.isPending || updateExperience.isPending}
                                        items={profile.data.experience}
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
                        <Card variant="outlined">
                            <Box sx={{ p: 3 }}>
                                <Stack spacing={2}>
                                    {deleteProject.isError ? (
                                        <Alert severity="error">{t('errors.deleteFailed')}</Alert>
                                    ) : null}
                                    <ProfileItemsSection
                                        deletingId={deleteProject.isPending ? deleteProject.variables : undefined}
                                        isPending={createProject.isPending || updateProject.isPending}
                                        items={profile.data.projects}
                                        kind="project"
                                        onCreate={(input, handlers) => createProject.mutate(input, handlers)}
                                        onDelete={(itemId, title) => {
                                            if (confirmDelete(title)) {
                                                deleteProject.mutate(itemId);
                                            }
                                        }}
                                        onUpdate={(itemId, input, handlers) =>
                                            updateProject.mutate({ itemId, input }, handlers)
                                        }
                                    />
                                </Stack>
                            </Box>
                        </Card>
                        <Card variant="outlined">
                            <Box sx={{ p: 3 }}>
                                <SkillsSection skills={profile.data.skills} />
                            </Box>
                        </Card>
                        <Card variant="outlined">
                            <Box sx={{ p: 3 }}>
                                <Stack spacing={2}>
                                    {deleteEducation.isError ? (
                                        <Alert severity="error">{t('errors.deleteFailed')}</Alert>
                                    ) : null}
                                    <ProfileItemsSection
                                        deletingId={deleteEducation.isPending ? deleteEducation.variables : undefined}
                                        isPending={createEducation.isPending || updateEducation.isPending}
                                        items={profile.data.education}
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
                )}
            </Stack>
            <Dialog onClose={() => setIsImportOpen(false)} open={isImportOpen}>
                <DialogTitle>{t('import.title')}</DialogTitle>
                <DialogContent>
                    <Typography>{t('import.description')}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button data-test="profile-import-cv-close-button" onClick={() => setIsImportOpen(false)}>
                        {t('import.close')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
