import type { Application, Status } from '@matchbox/shared';
import { Link, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { formatDate, formatRelativeTime } from 'src/utils/format.utils';

import { statusLabel } from '../../status-label';

type PipelineTableProps = {
    statuses: Status[];
    applications: Application[];
    pendingApplicationId?: string;
    onChangeStatus: (applicationId: string, statusId: string) => void;
};

export function PipelineTable({ statuses, applications, pendingApplicationId, onChangeStatus }: PipelineTableProps) {
    const { t, i18n } = useTranslation('pipeline');
    const { t: tCommon } = useTranslation('common');

    return (
        <TableContainer>
            <Table data-test="pipeline-table">
                <TableHead>
                    <TableRow>
                        <TableCell>{t('table.company')}</TableCell>
                        <TableCell>{t('table.role')}</TableCell>
                        <TableCell>{t('table.status')}</TableCell>
                        <TableCell>{t('table.lastActivity')}</TableCell>
                        <TableCell>{t('table.applied')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {applications.map((application) => (
                        <TableRow data-test={`pipeline-application-row-${application.id}`} key={application.id}>
                            <TableCell>{application.job.companyName}</TableCell>
                            <TableCell>
                                <Link
                                    component={RouterLink}
                                    data-test={`pipeline-application-open-${application.id}`}
                                    to={`/jobs/${application.job.id}/overview`}
                                    underline="hover"
                                >
                                    {application.job.title}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <Select
                                    aria-label={t('table.statusFor', { title: application.job.title })}
                                    data-test={`pipeline-status-select-${application.id}`}
                                    disabled={pendingApplicationId === application.id}
                                    onChange={(event) => {
                                        const statusId = event.target.value;
                                        if (typeof statusId === 'string' && statusId !== application.status.id) {
                                            onChangeStatus(application.id, statusId);
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
                            </TableCell>
                            <TableCell>{formatRelativeTime(application.lastActivityAt, i18n.language)}</TableCell>
                            <TableCell>
                                {application.appliedAt ? (
                                    formatDate(application.appliedAt, i18n.language)
                                ) : (
                                    <Typography color="text.secondary" component="span">
                                        {t('table.appliedEmpty')}
                                    </Typography>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
