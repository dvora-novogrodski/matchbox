import { Box, Button, Chip, Stack, TextField, Typography } from '@matchbox/ui';
import { PROFILE_LIMITS } from '@matchbox/shared';
import type { ProfileSkill } from '@matchbox/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useReplaceProfileSkills } from '../../api/profile.queries';

type SkillsSectionProps = {
    skills: ProfileSkill[];
};

function appendSkillName(names: string[], raw: string): string[] | null {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > PROFILE_LIMITS.maxSkillNameLength) {
        return null;
    }
    const key = trimmed.toLowerCase();
    if (names.some((name) => name.toLowerCase() === key)) {
        return null;
    }
    if (names.length >= PROFILE_LIMITS.maxSkills) {
        return null;
    }
    return [...names, trimmed];
}

export function SkillsSection({ skills }: SkillsSectionProps) {
    const { t } = useTranslation('profile');
    const replaceSkills = useReplaceProfileSkills();
    const [isEditing, setIsEditing] = useState(false);
    const [input, setInput] = useState('');
    const [editNames, setEditNames] = useState<string[]>([]);

    const skillNames = skills.map((skill) => skill.name);
    const hasSkills = skills.length > 0;

    const persist = (names: string[]) => {
        replaceSkills.mutate(names);
    };

    const commitInput = () => {
        const next = appendSkillName(editNames, input);
        if (!next) {
            setInput('');
            return;
        }
        setEditNames(next);
        setInput('');
        persist(next);
    };

    const removeSkill = (name: string) => {
        const next = editNames.filter((skill) => skill !== name);
        setEditNames(next);
        persist(next);
    };

    const startEdit = () => {
        setEditNames(skillNames);
        setInput('');
        setIsEditing(true);
    };

    const finishEdit = () => {
        setIsEditing(false);
        setInput('');
    };

    return (
        <Stack spacing={2}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography component="h2" variant="h5">
                    {t('sections.skill')}
                </Typography>
                {!isEditing ? (
                    <Button
                        data-test={hasSkills ? 'profile-skills-edit-button' : 'profile-skills-add-button'}
                        onClick={startEdit}
                        variant="text"
                    >
                        {hasSkills ? t('skills.edit') : t('sections.add')}
                    </Button>
                ) : null}
            </Stack>
            {replaceSkills.isError ? (
                <Typography color="error">{t('errors.saveFailed')}</Typography>
            ) : null}
            {isEditing ? (
                <Stack spacing={2}>
                    <Box
                        sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            p: 1.5,
                        }}
                    >
                        {editNames.map((name) => (
                            <Chip dir="auto" key={name} label={name} onDelete={() => removeSkill(name)} />
                        ))}
                        <TextField
                            data-test="profile-skills-input"
                            dir="auto"
                            disabled={replaceSkills.isPending}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    commitInput();
                                }
                            }}
                            placeholder={t('skills.placeholder')}
                            size="small"
                            sx={{ flex: '1 1 12rem', minWidth: 12 * 8 }}
                            value={input}
                            variant="standard"
                            slotProps={{
                                input: {
                                    disableUnderline: true,
                                },
                            }}
                        />
                    </Box>
                    <Box>
                        <Button disabled={replaceSkills.isPending} onClick={finishEdit} variant="contained">
                            {t('skills.done')}
                        </Button>
                    </Box>
                </Stack>
            ) : (
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {!hasSkills ? (
                        <Typography color="text.secondary">{t('sections.empty')}</Typography>
                    ) : (
                        skills.map((skill) => <Chip dir="auto" key={skill.id} label={skill.name} />)
                    )}
                </Stack>
            )}
        </Stack>
    );
}
