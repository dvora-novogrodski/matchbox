import {
    type CreateEducation,
    CreateEducationSchema,
    type CreateExperience,
    CreateExperienceSchema,
    type CreateProject,
    CreateProjectSchema,
    type ProfileBulletInput,
    type UpdateEducation,
    UpdateEducationSchema,
    type UpdateExperience,
    UpdateExperienceSchema,
    type UpdateProject,
    UpdateProjectSchema,
} from '@matchbox/shared';
import {
    Alert,
    Autocomplete,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Stack,
    TextField,
    Typography,
} from '@matchbox/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BulletEditor } from '../../components/BulletEditor';
import { formatItemSubtitle, ProfileItemCard } from '../../components/ProfileItemCard';
import { firstZodIssueMessage } from '../../profile-form-validation';
import type { ProfileMutateHandlers } from '../../profile-mutate.types';

type BaseItem = {
    id: string;
    startDate: string | null;
    endDate: string | null;
    bullets: { id: string; text: string }[];
};

type ExperienceLikeItem = BaseItem & {
    title: string;
    organization: string | null;
    tech: string[];
};

type EducationItem = BaseItem & {
    degree: string;
    institution: string | null;
};

type ProfileItemsSectionCommonProps = {
    deletingId?: string;
    onDelete: (itemId: string, title: string) => void;
    isPending: boolean;
};

type ProfileItemsSectionProps =
    | (ProfileItemsSectionCommonProps & {
          kind: 'experience';
          items: ExperienceLikeItem[];
          onCreate: (input: CreateExperience, handlers?: ProfileMutateHandlers) => void;
          onUpdate: (itemId: string, input: UpdateExperience, handlers?: ProfileMutateHandlers) => void;
      })
    | (ProfileItemsSectionCommonProps & {
          kind: 'project';
          items: ExperienceLikeItem[];
          onCreate: (input: CreateProject, handlers?: ProfileMutateHandlers) => void;
          onUpdate: (itemId: string, input: UpdateProject, handlers?: ProfileMutateHandlers) => void;
      })
    | (ProfileItemsSectionCommonProps & {
          kind: 'education';
          items: EducationItem[];
          onCreate: (input: CreateEducation, handlers?: ProfileMutateHandlers) => void;
          onUpdate: (itemId: string, input: UpdateEducation, handlers?: ProfileMutateHandlers) => void;
      });

function toMonthValue(value: string | null): string {
    return value?.slice(0, 7) ?? '';
}

function toDateValue(value: string): string | null {
    return value ? `${value}-01` : null;
}

export function ProfileItemsSection({
    kind,
    items,
    deletingId,
    onCreate,
    onUpdate,
    onDelete,
    isPending,
}: ProfileItemsSectionProps) {
    const { t } = useTranslation('profile');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string>();
    const [isCurrent, setIsCurrent] = useState(false);
    const [title, setTitle] = useState('');
    const [organization, setOrganization] = useState('');
    const [degree, setDegree] = useState('');
    const [institution, setInstitution] = useState('');
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [tech, setTech] = useState<string[]>([]);
    const [bullets, setBullets] = useState<ProfileBulletInput[]>([]);
    const [dialogError, setDialogError] = useState<string | null>(null);

    const sectionTitle = t(`sections.${kind === 'project' ? 'project' : kind}`);
    const isEducation = kind === 'education';
    const supportsTech = kind === 'experience' || kind === 'project';
    const currentLabelKey = `form.current.${kind}`;

    const resetForm = () => {
        setEditingId(undefined);
        setTitle('');
        setOrganization('');
        setDegree('');
        setInstitution('');
        setStartDate(null);
        setEndDate(null);
        setTech([]);
        setBullets([]);
        setIsCurrent(false);
        setDialogError(null);
    };

    const openCreate = () => {
        resetForm();
        setDialogOpen(true);
    };

    const openEdit = (item: ExperienceLikeItem | EducationItem) => {
        setDialogError(null);
        setEditingId(item.id);
        if (isEducation) {
            const education = item as EducationItem;
            setDegree(education.degree);
            setInstitution(education.institution ?? '');
        } else {
            const experienceLike = item as ExperienceLikeItem;
            setTitle(experienceLike.title);
            setOrganization(experienceLike.organization ?? '');
            setTech(experienceLike.tech);
        }
        setStartDate(item.startDate);
        setEndDate(item.endDate);
        setIsCurrent(!item.endDate);
        setBullets(item.bullets.map((bullet) => ({ id: bullet.id, text: bullet.text })));
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        resetForm();
    };

    const normalizedBullets = () =>
        bullets
            .filter((bullet) => bullet.text.trim())
            .map((bullet) => ({
                ...(bullet.id ? { id: bullet.id } : {}),
                text: bullet.text.trim(),
            }));

    const mutateHandlers: ProfileMutateHandlers = {
        onSuccess: () => closeDialog(),
        onError: () => setDialogError(t('errors.saveFailed')),
    };

    const submit = () => {
        setDialogError(null);
        if (isEducation) {
            const payload = {
                degree: degree.trim(),
                institution: institution.trim() || null,
                startDate,
                endDate: isCurrent ? null : endDate,
                bullets: normalizedBullets(),
            };
            if (editingId) {
                const parsed = UpdateEducationSchema.safeParse(payload);
                if (!parsed.success) {
                    setDialogError(firstZodIssueMessage(parsed.error));
                    return;
                }
                onUpdate(editingId, parsed.data, mutateHandlers);
            } else {
                const parsed = CreateEducationSchema.safeParse(payload);
                if (!parsed.success) {
                    setDialogError(firstZodIssueMessage(parsed.error));
                    return;
                }
                onCreate(parsed.data, mutateHandlers);
            }
            return;
        }

        const payload = {
            title: title.trim(),
            organization: organization.trim() || null,
            startDate,
            endDate: isCurrent ? null : endDate,
            tech,
            bullets: normalizedBullets(),
        };
        if (kind === 'experience') {
            if (editingId) {
                const parsed = UpdateExperienceSchema.safeParse(payload);
                if (!parsed.success) {
                    setDialogError(firstZodIssueMessage(parsed.error));
                    return;
                }
                onUpdate(editingId, parsed.data, mutateHandlers);
            } else {
                const parsed = CreateExperienceSchema.safeParse(payload);
                if (!parsed.success) {
                    setDialogError(firstZodIssueMessage(parsed.error));
                    return;
                }
                onCreate(parsed.data, mutateHandlers);
            }
            return;
        }

        if (editingId) {
            const parsed = UpdateProjectSchema.safeParse(payload);
            if (!parsed.success) {
                setDialogError(firstZodIssueMessage(parsed.error));
                return;
            }
            onUpdate(editingId, parsed.data, mutateHandlers);
        } else {
            const parsed = CreateProjectSchema.safeParse(payload);
            if (!parsed.success) {
                setDialogError(firstZodIssueMessage(parsed.error));
                return;
            }
            onCreate(parsed.data, mutateHandlers);
        }
    };

    return (
        <Stack spacing={2}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography component="h2" variant="h5">
                    {sectionTitle}
                </Typography>
                <Button onClick={openCreate} variant="text">
                    {t('sections.add')}
                </Button>
            </Stack>
            {items.length === 0 ? <Typography color="text.secondary">{t('sections.empty')}</Typography> : null}
            {items.map((item) => {
                const cardTitle = isEducation ? (item as EducationItem).degree : (item as ExperienceLikeItem).title;
                const subtitle = formatItemSubtitle({
                    organization: !isEducation ? (item as ExperienceLikeItem).organization : undefined,
                    institution: isEducation ? (item as EducationItem).institution : undefined,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    presentLabel: t('item.present'),
                });
                return (
                    <ProfileItemCard
                        bullets={item.bullets}
                        isDeleting={deletingId === item.id}
                        key={item.id}
                        onDelete={() => onDelete(item.id, cardTitle)}
                        onEdit={() => openEdit(item)}
                        subtitle={subtitle}
                        title={cardTitle}
                    />
                );
            })}
            <Dialog fullWidth maxWidth="sm" onClose={closeDialog} open={dialogOpen}>
                <Stack
                    component="form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        submit();
                    }}
                    spacing={0}
                >
                    <DialogTitle>{editingId ? t('form.editTitle') : t(`form.addTitle.${kind}`)}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2}>
                            {dialogError ? <Alert severity="error">{dialogError}</Alert> : null}
                            {isEducation ? (
                                <>
                                    <TextField
                                        dir="auto"
                                        label={t('form.degree')}
                                        onChange={(event) => setDegree(event.target.value)}
                                        required
                                        value={degree}
                                    />
                                    <TextField
                                        dir="auto"
                                        label={t('form.institution')}
                                        onChange={(event) => setInstitution(event.target.value)}
                                        value={institution}
                                    />
                                </>
                            ) : (
                                <>
                                    <TextField
                                        dir="auto"
                                        label={t('form.title')}
                                        onChange={(event) => setTitle(event.target.value)}
                                        required
                                        value={title}
                                    />
                                    <TextField
                                        dir="auto"
                                        label={t('form.organization')}
                                        onChange={(event) => setOrganization(event.target.value)}
                                        value={organization}
                                    />
                                </>
                            )}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    label={t('form.startDate')}
                                    onChange={(event) => setStartDate(toDateValue(event.target.value))}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    type="month"
                                    value={toMonthValue(startDate)}
                                />
                                <TextField
                                    disabled={isCurrent}
                                    label={t('form.endDate')}
                                    onChange={(event) => setEndDate(toDateValue(event.target.value))}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                    type="month"
                                    value={toMonthValue(endDate)}
                                />
                            </Stack>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isCurrent}
                                        onChange={(event) => setIsCurrent(event.target.checked)}
                                    />
                                }
                                label={t(currentLabelKey)}
                            />
                            {supportsTech ? (
                                <Autocomplete
                                    freeSolo
                                    multiple
                                    onChange={(_event, value) => setTech(value)}
                                    options={[]}
                                    renderInput={(params) => <TextField {...params} label={t('form.tech')} />}
                                    value={tech}
                                />
                            ) : null}
                            <BulletEditor bullets={bullets} onChange={setBullets} />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeDialog} type="button" variant="outlined">
                            {t('form.cancel')}
                        </Button>
                        <Button disabled={isPending} type="submit" variant="contained">
                            {editingId ? t('form.saveChanges') : t('form.add')}
                        </Button>
                    </DialogActions>
                </Stack>
            </Dialog>
        </Stack>
    );
}
