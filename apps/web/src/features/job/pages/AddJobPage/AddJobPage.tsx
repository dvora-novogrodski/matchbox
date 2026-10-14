import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateManualJob, WorkMode } from '@matchbox/shared';
import { CreateManualJobSchema } from '@matchbox/shared';
import { Alert, Box, Button, Card, MenuItem, Stack, TextField, Typography } from '@matchbox/ui';
import type { FieldError } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { PageLayout } from 'src/components/PageLayout';
import { ApiError } from 'src/lib/http/http-client';

import { useCreateManualJob } from '../../api/job.queries';
import { jobPath } from '../../job-tab';

const WORK_MODE_LABELS = {
    onsite: 'workMode.onsite',
    hybrid: 'workMode.hybrid',
    remote: 'workMode.remote',
} as const satisfies Record<WorkMode, `workMode.${WorkMode}`>;

export function AddJobPage() {
    const { t } = useTranslation('job');
    const navigate = useNavigate();
    const createJob = useCreateManualJob();
    const {
        control,
        formState: { errors },
        handleSubmit,
        register,
    } = useForm<CreateManualJob>({
        resolver: zodResolver(CreateManualJobSchema),
        defaultValues: {
            companyName: '',
            title: '',
            url: '',
            location: '',
            workMode: '',
            description: '',
        },
    });
    const existingJobId =
        createJob.error instanceof ApiError && createJob.error.code === 'APPLICATION_ALREADY_EXISTS'
            ? createJob.error.jobId
            : undefined;

    const submit = async (input: CreateManualJob) => {
        try {
            const application = await createJob.mutateAsync(input);
            await navigate(jobPath(application.job.id));
        } catch {
            // The mutation error is rendered below.
        }
    };

    return (
        <Stack spacing={2}>
            <Button component={RouterLink} data-test="add-job-back-button" sx={{ alignSelf: 'flex-start' }} to="/pipeline" variant="text">
                {t('actions.backToPipeline')}
            </Button>
            <PageLayout description={t('add.description')} title={t('add.title')} width="form">
                <Card>
                    <Stack
                        component="form"
                        noValidate
                        onSubmit={(event) => {
                            void handleSubmit(submit)(event);
                        }}
                        spacing={2}
                        sx={{ p: 2 }}
                    >
                        <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }} variant="body2">
                            {t('add.hint')}
                        </Typography>
                        {existingJobId ? (
                            <Alert
                                action={
                                    <Button component={RouterLink} data-test="add-job-open-existing-button" to={jobPath(existingJobId)}>
                                        {t('actions.openExisting')}
                                    </Button>
                                }
                                severity="info"
                            >
                                {t('add.alreadySaved')}
                            </Alert>
                        ) : null}
                        {createJob.isError && !existingJobId ? <Alert severity="error">{t('add.saveFailed')}</Alert> : null}
                        <TextField
                            data-test="add-job-company-input"
                            error={Boolean(errors.companyName)}
                            helperText={textError(errors.companyName, t('add.companyRequired'), t('add.tooLong'))}
                            label={t('add.company')}
                            {...register('companyName')}
                        />
                        <TextField
                            data-test="add-job-role-input"
                            error={Boolean(errors.title)}
                            helperText={textError(errors.title, t('add.roleRequired'), t('add.tooLong'))}
                            label={t('add.role')}
                            {...register('title')}
                        />
                        <TextField
                            data-test="add-job-url-input"
                            error={Boolean(errors.url)}
                            helperText={textError(errors.url, t('add.urlInvalid'), t('add.tooLong'))}
                            label={t('add.url')}
                            {...register('url')}
                        />
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                            <TextField
                                data-test="add-job-location-input"
                                error={Boolean(errors.location)}
                                helperText={errors.location ? t('add.tooLong') : undefined}
                                label={t('add.location')}
                                {...register('location')}
                            />
                            <Controller
                                control={control}
                                name="workMode"
                                render={({ field }) => (
                                    <TextField
                                        data-test="add-job-work-mode-input"
                                        label={t('add.workMode')}
                                        onChange={field.onChange}
                                        select
                                        value={field.value}
                                    >
                                        <MenuItem value="">{t('add.workModeEmpty')}</MenuItem>
                                        <MenuItem value="onsite">{t(WORK_MODE_LABELS.onsite)}</MenuItem>
                                        <MenuItem value="hybrid">{t(WORK_MODE_LABELS.hybrid)}</MenuItem>
                                        <MenuItem value="remote">{t(WORK_MODE_LABELS.remote)}</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Box>
                        <TextField
                            data-test="add-job-description-input"
                            error={Boolean(errors.description)}
                            helperText={errors.description ? t('add.tooLong') : undefined}
                            label={t('add.descriptionLabel')}
                            minRows={4}
                            multiline
                            {...register('description')}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                            <Button data-test="add-job-submit-button" disabled={createJob.isPending} type="submit" variant="contained">
                                {t('add.submit')}
                            </Button>
                        </Box>
                    </Stack>
                </Card>
            </PageLayout>
        </Stack>
    );
}

function textError(error: FieldError | undefined, invalid: string, tooLong: string): string | undefined {
    if (!error) {
        return undefined;
    }
    return error.type === 'too_big' ? tooLong : invalid;
}
