import { Autocomplete, Box, Button, Chip, Stack, TextField, Typography } from '@matchbox/ui';
import type { ProfileSkill } from '@matchbox/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useReplaceProfileSkills } from '../../api/profile.queries';

type SkillsSectionProps = {
    skills: ProfileSkill[];
};

export function SkillsSection({ skills }: SkillsSectionProps) {
    const { t } = useTranslation('profile');
    const replaceSkills = useReplaceProfileSkills();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<string[]>([]);

    const startEdit = () => {
        setDraft(skills.map((skill) => skill.name));
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setDraft([]);
    };

    const save = () => {
        replaceSkills.mutate(draft, {
            onSuccess: () => {
                setIsEditing(false);
                setDraft([]);
            },
        });
    };

    return (
        <Stack spacing={2}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography component="h2" variant="h5">
                    {t('sections.skill')}
                </Typography>
                {!isEditing ? (
                    <Button data-test="profile-skills-edit-button" onClick={startEdit} variant="text">
                        {t('skills.edit')}
                    </Button>
                ) : null}
            </Stack>
            {replaceSkills.isError ? (
                <Typography color="error">{t('errors.saveFailed')}</Typography>
            ) : null}
            {isEditing ? (
                <Stack spacing={2}>
                    <Autocomplete
                        freeSolo
                        multiple
                        onChange={(_event, value) => setDraft(value)}
                        options={[]}
                        renderInput={(params) => (
                            <TextField {...params} data-test="profile-skills-input" dir="auto" label={t('skills.label')} />
                        )}
                        value={draft}
                    />
                    <Box>
                        <Button
                            data-test="profile-skills-save-button"
                            disabled={replaceSkills.isPending}
                            onClick={save}
                            variant="contained"
                        >
                            {t('skills.save')}
                        </Button>
                        <Button disabled={replaceSkills.isPending} onClick={cancelEdit} variant="outlined">
                            {t('skills.cancel')}
                        </Button>
                    </Box>
                </Stack>
            ) : (
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {skills.length === 0 ? (
                        <Typography color="text.secondary">{t('sections.empty')}</Typography>
                    ) : (
                        skills.map((skill) => <Chip dir="auto" key={skill.id} label={skill.name} />)
                    )}
                </Stack>
            )}
        </Stack>
    );
}
