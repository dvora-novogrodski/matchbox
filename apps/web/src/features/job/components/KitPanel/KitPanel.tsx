import { zodResolver } from '@hookform/resolvers/zod';
import type { ApplicationKit, UpdateApplicationKit } from '@matchbox/shared';
import { UpdateApplicationKitSchema } from '@matchbox/shared';
import { Alert, Button, CircularProgress, Stack, TextField, Typography } from '@matchbox/ui';
import { useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useApplicationKit, useDownloadKitPdf, useUpdateApplicationKit } from '../../api/job.queries';

type KitPanelProps = {
    applicationId: string;
    companyName: string;
    title: string;
};

type KitFieldName = keyof UpdateApplicationKit;

export function KitPanel({ applicationId, companyName, title }: KitPanelProps) {
    const { t } = useTranslation('job');
    const kit = useApplicationKit(applicationId);

    if (kit.isPending) {
        return <CircularProgress data-test="kit-loading" />;
    }

    if (kit.isError || !kit.data) {
        return <Alert severity="error">{t('kit.loadFailed')}</Alert>;
    }

    return <KitForm applicationId={applicationId} companyName={companyName} kit={kit.data} title={title} />;
}

type KitFormProps = KitPanelProps & {
    kit: ApplicationKit;
};

function KitForm({ applicationId, companyName, title, kit }: KitFormProps) {
    const { t } = useTranslation('job');
    const update = useUpdateApplicationKit(applicationId);
    const download = useDownloadKitPdf();
    const [copied, setCopied] = useState<string | null>(null);
    const [copyFailed, setCopyFailed] = useState(false);
    const {
        formState: { errors },
        getValues,
        handleSubmit,
        register,
    } = useForm<UpdateApplicationKit>({
        resolver: zodResolver(UpdateApplicationKitSchema),
        values: formValues(kit, t('kit.coverLetterTemplate', { company: companyName, title })),
    });

    async function copyField(field: KitFieldName, label: string) {
        try {
            await navigator.clipboard.writeText(getValues(field));
            setCopied(label);
            setCopyFailed(false);
        } catch {
            setCopied(null);
            setCopyFailed(true);
        }
    }

    return (
        <Stack spacing={3}>
            <Typography color="text.secondary">{t('kit.intro')}</Typography>
            {update.isError ? <Alert severity="error">{t('kit.saveFailed')}</Alert> : null}
            {update.isSuccess ? <Alert severity="success">{t('kit.saved')}</Alert> : null}
            {copied ? (
                <Typography role="status">{t('kit.copied', { field: copied })}</Typography>
            ) : null}
            {copyFailed ? <Alert severity="error">{t('kit.copyFailed')}</Alert> : null}
            {download.isError ? <Alert severity="error">{t('kit.downloadFailed')}</Alert> : null}
            <Stack
                component="form"
                noValidate
                onSubmit={(event) => {
                    void handleSubmit((input) => {
                        update.mutate(input);
                    })(event);
                }}
                spacing={2}
            >
                <KitField
                    copyLabel={t('kit.copyCoverLetter')}
                    error={Boolean(errors.coverLetter)}
                    label={t('kit.coverLetterTitle')}
                    onCopy={() => {
                        void copyField('coverLetter', t('kit.coverLetterTitle'));
                    }}
                    registration={register('coverLetter')}
                    testId="cover-letter"
                />
                <KitField
                    copyLabel={t('kit.copyWhyCompany')}
                    error={Boolean(errors.whyCompany)}
                    label={t('kit.whyCompany')}
                    onCopy={() => {
                        void copyField('whyCompany', t('kit.whyCompany'));
                    }}
                    registration={register('whyCompany')}
                    testId="why-company"
                />
                <KitField
                    copyLabel={t('kit.copyWhyRole')}
                    error={Boolean(errors.whyRole)}
                    label={t('kit.whyRole')}
                    onCopy={() => {
                        void copyField('whyRole', t('kit.whyRole'));
                    }}
                    registration={register('whyRole')}
                    testId="why-role"
                />
                <KitField
                    copyLabel={t('kit.copyAboutYou')}
                    error={Boolean(errors.aboutYou)}
                    label={t('kit.aboutYou')}
                    onCopy={() => {
                        void copyField('aboutYou', t('kit.aboutYou'));
                    }}
                    registration={register('aboutYou')}
                    testId="about-you"
                />
                <Button data-test="kit-save-button" disabled={update.isPending} type="submit" variant="contained">
                    {t('kit.save')}
                </Button>
            </Stack>
            <Button
                data-test="kit-download-cv-button"
                disabled={download.isPending}
                onClick={() => {
                    download.mutate(applicationId);
                }}
                type="button"
                variant="outlined"
            >
                {t('kit.downloadCv')}
            </Button>
        </Stack>
    );
}

type KitFieldProps = {
    label: string;
    copyLabel: string;
    testId: string;
    error: boolean;
    registration: UseFormRegisterReturn;
    onCopy: () => void;
};

function KitField({ label, copyLabel, testId, error, registration, onCopy }: KitFieldProps) {
    const { t } = useTranslation('job');

    return (
        <Stack spacing={1}>
            <TextField
                data-test={`kit-${testId}-input`}
                error={error}
                helperText={error ? t('validation.tooLong') : undefined}
                label={label}
                minRows={3}
                multiline
                {...registration}
            />
            <Button data-test={`kit-copy-${testId}-button`} onClick={onCopy} type="button" variant="text">
                {copyLabel}
            </Button>
        </Stack>
    );
}

function formValues(kit: ApplicationKit, coverLetterTemplate: string): UpdateApplicationKit {
    if (!kit.saved) {
        return {
            coverLetter: coverLetterTemplate,
            whyCompany: '',
            whyRole: '',
            aboutYou: '',
        };
    }
    return {
        coverLetter: kit.coverLetter,
        whyCompany: kit.whyCompany,
        whyRole: kit.whyRole,
        aboutYou: kit.aboutYou,
    };
}
