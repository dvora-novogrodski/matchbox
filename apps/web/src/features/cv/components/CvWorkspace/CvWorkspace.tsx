import { type BaseCv, CV_LIMITS, type CvEditor, type CvHeader,CvLinkSchema } from '@matchbox/shared';
import { Alert, Box, Button, Card, Stack, TextField, Typography } from '@matchbox/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from 'src/lib/http/http-client';

import { parseBaseCv, parseGithubConnection } from '../../api/cv.api';
import {
    useConnectGithub,
    useDisconnectGithub,
    useDownloadCvPdf,
    useSaveBaseCv,
    useSaveCvVersion,
} from '../../api/cv.queries';
import { CvSectionList } from '../CvSectionList';

type CvWorkspaceProps = {
    editor: CvEditor;
};

type HeaderDraft = {
    fullName: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    links: CvHeader['links'];
};

function draftFromHeader(header: CvHeader): HeaderDraft {
    return {
        fullName: header.fullName,
        headline: header.headline ?? '',
        email: header.email ?? '',
        phone: header.phone ?? '',
        location: header.location ?? '',
        links: header.links,
    };
}

function emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function CvWorkspace({ editor }: CvWorkspaceProps) {
    const { t } = useTranslation('cv');
    const save = useSaveBaseCv();
    const saveVersion = useSaveCvVersion();
    const download = useDownloadCvPdf();
    const connect = useConnectGithub();
    const disconnect = useDisconnectGithub();
    const [header, setHeader] = useState<HeaderDraft>(() => draftFromHeader(editor.selection.header));
    const [summary, setSummary] = useState(editor.selection.summary);
    const [experienceItemIds, setExperienceItemIds] = useState(editor.selection.experienceItemIds);
    const [projectItemIds, setProjectItemIds] = useState(editor.selection.projectItemIds);
    const [skillIds, setSkillIds] = useState(editor.selection.skillIds);
    const [educationItemIds, setEducationItemIds] = useState(editor.selection.educationItemIds);
    const [linkLabel, setLinkLabel] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [repo, setRepo] = useState(editor.github.repo ?? '');
    const [token, setToken] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const selection: BaseCv = {
        header: {
            fullName: header.fullName,
            headline: emptyToNull(header.headline),
            email: emptyToNull(header.email),
            phone: emptyToNull(header.phone),
            location: emptyToNull(header.location),
            links: header.links,
        },
        summary,
        experienceItemIds,
        projectItemIds,
        skillIds,
        educationItemIds,
    };
    const isDirty = JSON.stringify(selection) !== JSON.stringify(editor.selection);
    const latestVersion = saveVersion.data ?? editor.latestVersion;

    function saveSelection() {
        const parsed = parseBaseCv(selection);
        if (!parsed.success) {
            setFormError(t('errors.invalid'));
            return;
        }
        setFormError(null);
        save.mutate(parsed.data, {
            onSuccess: (next) => {
                setHeader(draftFromHeader(next.selection.header));
                setSummary(next.selection.summary);
                setExperienceItemIds(next.selection.experienceItemIds);
                setProjectItemIds(next.selection.projectItemIds);
                setSkillIds(next.selection.skillIds);
                setEducationItemIds(next.selection.educationItemIds);
            },
        });
    }

    function addLink() {
        const parsed = CvLinkSchema.safeParse({ label: linkLabel, url: linkUrl });
        if (!parsed.success || header.links.length >= CV_LIMITS.maxLinks) {
            setFormError(t('errors.invalidLink'));
            return;
        }
        setFormError(null);
        setHeader((current) => ({ ...current, links: [...current.links, parsed.data] }));
        setLinkLabel('');
        setLinkUrl('');
    }

    function connectRepository() {
        const parsed = parseGithubConnection({ repo, token });
        if (!parsed.success) {
            setFormError(t('errors.githubFailed'));
            return;
        }
        setFormError(null);
        connect.mutate(parsed.data, { onSuccess: () => setToken('') });
    }

    return (
        <Stack spacing={3}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            {save.isError ? <Alert severity="error">{t('errors.saveFailed')}</Alert> : null}
            {editor.removedItemCount > 0 ? (
                <Alert data-test="cv-removed-items" severity="warning">
                    {t('removed.items', { count: editor.removedItemCount })}
                </Alert>
            ) : null}
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' } }}>
                <Stack spacing={2}>
                    <Card variant="outlined">
                        <Stack spacing={2} sx={{ p: 3 }}>
                            <Typography component="h2" variant="h5">
                                {t('header.title')}
                            </Typography>
                            <TextField
                                label={t('header.fullName')}
                                onChange={(event) => setHeader((current) => ({ ...current, fullName: event.target.value }))}
                                value={header.fullName}
                            />
                            <TextField
                                label={t('header.headline')}
                                onChange={(event) => setHeader((current) => ({ ...current, headline: event.target.value }))}
                                value={header.headline}
                            />
                            <TextField
                                label={t('header.email')}
                                onChange={(event) => setHeader((current) => ({ ...current, email: event.target.value }))}
                                value={header.email}
                            />
                            <TextField
                                label={t('header.phone')}
                                onChange={(event) => setHeader((current) => ({ ...current, phone: event.target.value }))}
                                value={header.phone}
                            />
                            <TextField
                                label={t('header.location')}
                                onChange={(event) => setHeader((current) => ({ ...current, location: event.target.value }))}
                                value={header.location}
                            />
                            {header.links.map((link) => (
                                <Stack direction="row" key={`${link.label}-${link.url}`} spacing={1} sx={{ alignItems: 'center' }}>
                                    <Typography sx={{ flex: 1 }}>{link.label}</Typography>
                                    <Button
                                        data-test={`cv-remove-link-${link.label}`}
                                        onClick={() =>
                                            setHeader((current) => ({
                                                ...current,
                                                links: current.links.filter((item) => item !== link),
                                            }))
                                        }
                                    >
                                        {t('actions.removeLink', { label: link.label })}
                                    </Button>
                                </Stack>
                            ))}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                <TextField
                                    label={t('header.linkLabel')}
                                    onChange={(event) => setLinkLabel(event.target.value)}
                                    value={linkLabel}
                                />
                                <TextField
                                    label={t('header.linkUrl')}
                                    onChange={(event) => setLinkUrl(event.target.value)}
                                    value={linkUrl}
                                />
                                <Button data-test="cv-add-link-button" onClick={addLink}>
                                    {t('actions.addLink')}
                                </Button>
                            </Stack>
                        </Stack>
                    </Card>
                    <Card variant="outlined">
                        <Stack spacing={2} sx={{ p: 3 }}>
                            <Typography component="h2" variant="h5">
                                {t('summary.title')}
                            </Typography>
                            <TextField
                                label={t('summary.label')}
                                minRows={4}
                                multiline
                                onChange={(event) => setSummary(event.target.value)}
                                value={summary}
                            />
                        </Stack>
                    </Card>
                    <Card variant="outlined">
                        <Stack spacing={3} sx={{ p: 3 }}>
                            <CvSectionList
                                items={editor.catalog.experience}
                                kind="experience"
                                onChange={setExperienceItemIds}
                                selectedIds={experienceItemIds}
                            />
                            <CvSectionList
                                items={editor.catalog.projects}
                                kind="projects"
                                onChange={setProjectItemIds}
                                selectedIds={projectItemIds}
                            />
                            <CvSectionList items={editor.catalog.skills} kind="skills" onChange={setSkillIds} selectedIds={skillIds} />
                            <CvSectionList
                                items={editor.catalog.education}
                                kind="education"
                                onChange={setEducationItemIds}
                                selectedIds={educationItemIds}
                            />
                        </Stack>
                    </Card>
                    <Button data-test="cv-save-button" disabled={save.isPending} onClick={saveSelection} variant="contained">
                        {t('actions.save')}
                    </Button>
                </Stack>
                <Stack spacing={2}>
                    <Card variant="outlined">
                        <Stack spacing={1} sx={{ p: 2 }}>
                            <Typography color="text.secondary">{isDirty ? t('preview.dirty') : t('preview.saved')}</Typography>
                            <Box
                                component="iframe"
                                data-test="cv-preview"
                                sandbox=""
                                srcDoc={editor.html}
                                sx={{ border: 0, height: 720, width: '100%' }}
                                title={t('preview.title')}
                            />
                        </Stack>
                    </Card>
                    <Stack direction="row" spacing={1}>
                        <Button data-test="cv-download-pdf-button" disabled={download.isPending} onClick={() => download.mutate()}>
                            {t('actions.downloadPdf')}
                        </Button>
                        <Button
                            data-test="cv-save-version-button"
                            disabled={saveVersion.isPending}
                            onClick={() => saveVersion.mutate()}
                            variant="contained"
                        >
                            {t('actions.saveVersion')}
                        </Button>
                    </Stack>
                    {download.isError ? (
                        <Alert severity="error">
                            {download.error instanceof ApiError && download.error.statusCode === 503
                                ? t('errors.pdfUnavailable')
                                : t('errors.pdfFailed')}
                        </Alert>
                    ) : null}
                    {saveVersion.isError ? <Alert severity="error">{t('errors.versionFailed')}</Alert> : null}
                    <Typography>
                        {latestVersion
                            ? latestVersion.commitSha
                                ? t('version.committed', { sha: latestVersion.commitSha.slice(0, 7) })
                                : t('version.local')
                            : t('version.none')}
                    </Typography>
                    <Card variant="outlined">
                        <Stack spacing={2} sx={{ p: 3 }}>
                            <Typography component="h2" variant="h5">
                                {t('github.title')}
                            </Typography>
                            <Typography color="text.secondary">{t('github.description')}</Typography>
                            {editor.github.connected && editor.github.repo ? (
                                <Typography>{t('github.connected', { repo: editor.github.repo })}</Typography>
                            ) : (
                                <Typography>{t('github.notConnected')}</Typography>
                            )}
                            {connect.isError || disconnect.isError ? <Alert severity="error">{t('errors.githubFailed')}</Alert> : null}
                            <TextField label={t('github.repo')} onChange={(event) => setRepo(event.target.value)} value={repo} />
                            <TextField
                                label={t('github.token')}
                                onChange={(event) => setToken(event.target.value)}
                                type="password"
                                value={token}
                            />
                            <Stack direction="row" spacing={1}>
                                <Button
                                    data-test="cv-connect-github-button"
                                    disabled={connect.isPending}
                                    onClick={connectRepository}
                                    variant="contained"
                                >
                                    {t('actions.connectGithub')}
                                </Button>
                                {editor.github.connected ? (
                                    <Button
                                        data-test="cv-disconnect-github-button"
                                        disabled={disconnect.isPending}
                                        onClick={() => disconnect.mutate()}
                                    >
                                        {t('actions.disconnectGithub')}
                                    </Button>
                                ) : null}
                            </Stack>
                        </Stack>
                    </Card>
                </Stack>
            </Box>
        </Stack>
    );
}
