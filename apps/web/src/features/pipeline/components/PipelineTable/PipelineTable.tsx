import type { Application, Status } from '@matchbox/shared';
import {
    Button,
    Link,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    Typography,
} from '@matchbox/ui';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { CompanyLogo } from 'src/components/CompanyLogo';
import { formatDate, formatRelativeTime } from 'src/utils/format.utils';

import { StatusDotLabel } from '../StatusDotLabel';

type PipelineTableProps = {
    statuses: Status[];
    applications: Application[];
    pendingApplicationId?: string;
    onChangeStatus: (applicationId: string, statusId: string) => void;
};

type SortKey = 'company' | 'role' | 'status' | 'activity' | 'applied';
type SortDirection = 'asc' | 'desc';

const DEFAULT_ROWS_PER_PAGE = 10;

export function PipelineTable({ statuses, applications, pendingApplicationId, onChangeStatus }: PipelineTableProps) {
    const { t, i18n } = useTranslation('pipeline');
    const [searchParams, setSearchParams] = useSearchParams();
    const sort = sortKeyFromParam(searchParams.get('sort'));
    const direction: SortDirection = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    const requestedPage = Number(searchParams.get('page') ?? 0);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 0;
    const requestedRowsPerPage = Number(searchParams.get('rows') ?? DEFAULT_ROWS_PER_PAGE);
    const rowsPerPage = requestedRowsPerPage === 25 ? 25 : DEFAULT_ROWS_PER_PAGE;
    const sortedApplications = [...applications].sort((left, right) => {
        const comparison = compareApplications(left, right, sort);
        return direction === 'asc' ? comparison : -comparison;
    });
    const safePage = Math.min(page, Math.max(0, Math.ceil(applications.length / rowsPerPage) - 1));
    const visibleApplications = sortedApplications.slice(
        safePage * rowsPerPage,
        safePage * rowsPerPage + rowsPerPage,
    );

    function updateParams(update: Record<string, string | null>) {
        const params = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(update)) {
            if (value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        }
        setSearchParams(params, { replace: true });
    }

    function handleSort(nextSort: SortKey) {
        const nextDirection = sort === nextSort && direction === 'asc' ? 'desc' : 'asc';
        updateParams({ sort: nextSort, order: nextDirection, page: null });
    }

    return (
        <TableContainer component={Paper} variant="outlined">
            <Table data-test="pipeline-table" size="small">
                <TableHead>
                    <TableRow>
                        <SortableHeader
                            active={sort === 'company'}
                            direction={direction}
                            label={t('table.company')}
                            onSort={() => handleSort('company')}
                        />
                        <SortableHeader
                            active={sort === 'role'}
                            direction={direction}
                            label={t('table.role')}
                            onSort={() => handleSort('role')}
                        />
                        <SortableHeader
                            active={sort === 'status'}
                            direction={direction}
                            label={t('table.status')}
                            onSort={() => handleSort('status')}
                        />
                        <SortableHeader
                            active={sort === 'activity'}
                            direction={direction}
                            label={t('table.lastActivity')}
                            onSort={() => handleSort('activity')}
                        />
                        <SortableHeader
                            active={sort === 'applied'}
                            direction={direction}
                            label={t('table.applied')}
                            onSort={() => handleSort('applied')}
                        />
                        <TableCell align="right">{t('table.actions')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {visibleApplications.map((application) => (
                        <TableRow
                            data-clickable="true"
                            data-test={`pipeline-application-row-${application.id}`}
                            key={application.id}
                        >
                            <TableCell>
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                    <CompanyLogo companyName={application.job.companyName} jobUrl={application.job.url} size={24} />
                                    <span>{application.job.companyName}</span>
                                </Stack>
                            </TableCell>
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
                                    disableUnderline
                                    disabled={pendingApplicationId === application.id}
                                    onChange={(event) => {
                                        const statusId = event.target.value;
                                        if (typeof statusId === 'string' && statusId !== application.status.id) {
                                            onChangeStatus(application.id, statusId);
                                        }
                                    }}
                                    size="small"
                                    value={application.status.id}
                                    variant="standard"
                                >
                                    {statuses.map((status) => (
                                        <MenuItem key={status.id} value={status.id}>
                                            <StatusDotLabel status={status} />
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
                            <TableCell align="right">
                                <Button
                                    component={RouterLink}
                                    size="small"
                                    to={`/jobs/${application.job.id}/overview`}
                                    variant="text"
                                >
                                    {t('table.open')}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {visibleApplications.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6}>
                                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }} variant="body2">
                                    {t('table.noResults')}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : null}
                </TableBody>
            </Table>
            <TablePagination
                component="div"
                count={applications.length}
                labelRowsPerPage={t('table.rowsPerPage')}
                onPageChange={(_event, nextPage) => updateParams({ page: nextPage === 0 ? null : String(nextPage) })}
                onRowsPerPageChange={(event) =>
                    updateParams({ rows: event.target.value, page: null })
                }
                page={safePage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10, 25]}
            />
        </TableContainer>
    );
}

type SortableHeaderProps = {
    active: boolean;
    direction: SortDirection;
    label: string;
    onSort: () => void;
};

function SortableHeader({ active, direction, label, onSort }: SortableHeaderProps) {
    return (
        <TableCell sortDirection={active ? direction : false}>
            <TableSortLabel active={active} direction={active ? direction : 'asc'} onClick={onSort}>
                {label}
            </TableSortLabel>
        </TableCell>
    );
}

function sortKeyFromParam(value: string | null): SortKey {
    if (value === 'company' || value === 'role' || value === 'status' || value === 'applied') {
        return value;
    }
    return 'activity';
}

function compareApplications(left: Application, right: Application, sort: SortKey): number {
    if (sort === 'company') {
        return left.job.companyName.localeCompare(right.job.companyName);
    }
    if (sort === 'role') {
        return left.job.title.localeCompare(right.job.title);
    }
    if (sort === 'status') {
        return left.status.position - right.status.position;
    }
    if (sort === 'applied') {
        return (left.appliedAt ?? '').localeCompare(right.appliedAt ?? '');
    }
    return left.lastActivityAt.localeCompare(right.lastActivityAt);
}
