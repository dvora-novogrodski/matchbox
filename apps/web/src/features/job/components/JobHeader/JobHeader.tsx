import type { Application, Status } from '@matchbox/shared';
import {
    Box,
    Button,
    ChevronDownIcon,
    Link,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@matchbox/ui';
import { useTheme } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { CompanyLogo } from 'src/components/CompanyLogo';
import { CoverImage } from 'src/components/CoverImage';
import { statusLabel, statusTone } from 'src/features/pipeline';
import { StatusDotLabel } from 'src/features/pipeline/components/StatusDotLabel';
import { formatDate } from 'src/utils/format.utils';

import type { JobPrimaryAction } from '../../job-action';

const PRIMARY_ACTION_LABELS = {
    tailorCv: 'actions.tailorCv',
    prepareToApply: 'actions.prepareToApply',
    markApplied: 'actions.markApplied',
} as const satisfies Record<JobPrimaryAction, `actions.${JobPrimaryAction}`>;

type JobHeaderProps = {
    action: JobPrimaryAction | null;
    application: Application;
    language: string;
    onChangeStatus: (statusId: string) => void;
    onPrimaryAction: () => void;
    statusPending: boolean;
    statuses: Status[];
    workModeLabel: string | null;
};

export function JobHeader({
    action,
    application,
    language,
    onChangeStatus,
    onPrimaryAction,
    statusPending,
    statuses,
    workModeLabel,
}: JobHeaderProps) {
    const { t } = useTranslation('job');
    const theme = useTheme();
    const tone = statusTone(theme, application.status.category, application.status.color);
    const meta = buildMetaLine(application, workModeLabel, language, t);

    return (
        <Stack spacing={2}>
            <Box sx={{ position: 'relative' }}>
                <CoverImage alt="" companyName={application.job.companyName} height={140} />
                <Box
                    sx={{
                        bottom: 0,
                        left: 0,
                        position: 'absolute',
                        transform: 'translateY(50%)',
                    }}
                >
                    <CompanyLogo
                        companyName={application.job.companyName}
                        data-test="job-company-logo"
                        jobUrl={application.job.url}
                        size={56}
                    />
                </Box>
            </Box>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ alignItems: { md: 'flex-start' }, justifyContent: 'space-between', pt: 4 }}
            >
                <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                    <Typography component="h1" variant="h3">
                        {application.job.title}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {meta}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                    {application.job.url ? (
                        <Button
                            component={Link}
                            data-test="job-posting-link"
                            href={application.job.url}
                            rel="noopener noreferrer"
                            target="_blank"
                            variant="outlined"
                        >
                            {t('actions.openPosting')}
                        </Button>
                    ) : null}
                    <JobStatusSelect
                        application={application}
                        onChangeStatus={onChangeStatus}
                        statusPending={statusPending}
                        statuses={statuses}
                        tone={tone}
                    />
                    {action ? (
                        <Button
                            color={action === 'tailorCv' ? 'accent' : 'primary'}
                            data-test="job-primary-action-button"
                            disabled={statusPending}
                            onClick={onPrimaryAction}
                            variant="contained"
                        >
                            {t(PRIMARY_ACTION_LABELS[action])}
                        </Button>
                    ) : null}
                </Stack>
            </Stack>
        </Stack>
    );
}

type JobStatusSelectProps = {
    application: Application;
    onChangeStatus: (statusId: string) => void;
    statusPending: boolean;
    statuses: Status[];
    tone: { bg: string; fg: string };
};

function JobStatusSelect({
    application,
    onChangeStatus,
    statusPending,
    statuses,
    tone,
}: JobStatusSelectProps) {
    const { t } = useTranslation('job');
    const { t: tCommon } = useTranslation('common');

    return (
        <Select
            aria-label={t('overview.statusFor', { title: application.job.title })}
            data-test="job-status-chip"
            disabled={statusPending}
            onChange={(event) => {
                const statusId = event.target.value;
                if (typeof statusId === 'string' && statusId !== application.status.id) {
                    onChangeStatus(statusId);
                }
            }}
            renderValue={() => (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <StatusDotLabel status={application.status} />
                    <ChevronDownIcon fontSize="small" />
                </Stack>
            )}
            size="small"
            sx={{
                bgcolor: tone.bg,
                borderRadius: '999px',
                color: tone.fg,
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiSelect-icon': { display: 'none' },
                '& .MuiSelect-select': { py: 0.75 },
            }}
            value={application.status.id}
            variant="outlined"
        >
            {statuses.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                    {statusLabel(status, tCommon)}
                </MenuItem>
            ))}
        </Select>
    );
}

function buildMetaLine(
    application: Application,
    workModeLabel: string | null,
    language: string,
    t: ReturnType<typeof useTranslation<'job'>>['t'],
): string {
    const parts = [application.job.companyName, application.job.location, workModeLabel].filter(
        (part): part is string => Boolean(part && part.length > 0),
    );
    if (application.appliedAt) {
        parts.push(t('meta.applied', { date: formatDate(application.appliedAt, language) }));
    }
    return parts.join(' · ');
}
