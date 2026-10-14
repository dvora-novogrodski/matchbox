import { zodResolver } from '@hookform/resolvers/zod';
import type { JobPage, UpdateApplication } from '@matchbox/shared';
import { UpdateApplicationSchema } from '@matchbox/shared';
import { Alert, Button, Card, Stack, TextField, Typography } from '@matchbox/ui';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type OverviewPanelProps = {
    page: JobPage;
    isSaving: boolean;
    saveError: boolean;
    onSave: (input: UpdateApplication) => void;
};

export function OverviewPanel({ page, isSaving, saveError, onSave }: OverviewPanelProps) {
    const { t } = useTranslation('job');
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
            <Card sx={{ p: 2 }}>
                <Stack spacing={1}>
                    <Typography component="h2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {t('overview.description')}
                    </Typography>
                    {page.description ? (
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{page.description}</Typography>
                    ) : (
                        <Typography color="text.secondary">{t('overview.descriptionEmpty')}</Typography>
                    )}
                </Stack>
            </Card>
            <Card
                component="form"
                noValidate
                onSubmit={(event) => {
                    void handleSubmit(onSave)(event);
                }}
                sx={{ p: 2 }}
            >
                <Stack spacing={2}>
                    <Typography component="h2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {t('overview.details')}
                    </Typography>
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
            </Card>
        </Stack>
    );
}
