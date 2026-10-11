import { zodResolver } from '@hookform/resolvers/zod';
import type { JobPage, Status, UpdateApplication } from '@matchbox/shared';
import { UpdateApplicationSchema } from '@matchbox/shared';
import { Alert, Button, Link, MenuItem, Select, Stack, TextField, Typography } from '@matchbox/ui';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { statusLabel } from 'src/features/pipeline';

type OverviewPanelProps = {
    page: JobPage;
    statuses: Status[];
    isSaving: boolean;
    isStatusPending: boolean;
    saveError: boolean;
    onSave: (input: UpdateApplication) => void;
    onChangeStatus: (statusId: string) => void;
};

export function OverviewPanel({
    page,
    statuses,
    isSaving,
    isStatusPending,
    saveError,
    onSave,
    onChangeStatus,
}: OverviewPanelProps) {
    const { t } = useTranslation('job');
    const { t: tCommon } = useTranslation('common');
    const application = page.application;
    const {
        formState: { errors },
        handleSubmit,
        register,
    } = useForm<UpdateApplication>({
        resolver: zodResolver(UpdateApplicationSchema),
        values: {
            recruiterName: application.recruiterName ?? '',
            recruiterContact: application.recruiterContact ?? '',
            notes: application.notes ?? '',
        },
    });

    return (
        <Stack spacing={3}>
            <Stack spacing={1}>
                <Typography component="h2" variant="h5">
                    {t('overview.description')}
                </Typography>
                {page.description ? (
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{page.description}</Typography>
                ) : (
                    <Typography color="text.secondary">{t('overview.descriptionEmpty')}</Typography>
                )}
                {application.job.url ? (
                    <Link data-test="job-posting-link" href={application.job.url} rel="noopener noreferrer" target="_blank">
                        {t('actions.openPosting')}
                    </Link>
                ) : null}
            </Stack>
            <Typography component="h2" variant="h5">
                {t('overview.status')}
            </Typography>
            <Select
                aria-label={t('overview.statusFor', { title: application.job.title })}
                data-test="job-status-select"
                disabled={isStatusPending}
                onChange={(event) => {
                    const statusId = event.target.value;
                    if (typeof statusId === 'string' && statusId !== application.status.id) {
                        onChangeStatus(statusId);
                    }
                }}
                size="small"
                value={application.status.id}
            >
                {statuses.map((status) => (
                    <MenuItem key={status.id} value={status.id}>
                        {statusLabel(status, tCommon)}
                    </MenuItem>
                ))}
            </Select>
            <Stack
                component="form"
                noValidate
                onSubmit={(event) => {
                    void handleSubmit(onSave)(event);
                }}
                spacing={2}
            >
                {saveError ? <Alert severity="error">{t('errors.saveFailed')}</Alert> : null}
                <TextField
                    data-test="job-recruiter-name-input"
                    error={Boolean(errors.recruiterName)}
                    helperText={errors.recruiterName ? t('validation.tooLong') : undefined}
                    label={t('overview.recruiterName')}
                    {...register('recruiterName')}
                />
                <TextField
                    data-test="job-recruiter-contact-input"
                    error={Boolean(errors.recruiterContact)}
                    helperText={errors.recruiterContact ? t('validation.tooLong') : undefined}
                    label={t('overview.recruiterContact')}
                    {...register('recruiterContact')}
                />
                <TextField
                    data-test="job-notes-input"
                    error={Boolean(errors.notes)}
                    helperText={errors.notes ? t('validation.tooLong') : undefined}
                    label={t('overview.notes')}
                    minRows={3}
                    multiline
                    {...register('notes')}
                />
                <Button data-test="job-save-button" disabled={isSaving} type="submit" variant="contained">
                    {t('actions.save')}
                </Button>
            </Stack>
        </Stack>
    );
}
