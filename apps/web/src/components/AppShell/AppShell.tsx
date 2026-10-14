import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    AppBar,
    Badge,
    Box,
    Button,
    ChevronDownIcon,
    ChevronUpIcon,
    Drawer,
    IconButton,
    ListItemIcon,
    LogoutIcon,
    Menu,
    MenuIcon,
    MenuItem,
    NotificationIcon,
    PlusIcon,
    SearchIcon,
    SettingsIcon,
    Stack,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
    XIcon,
} from '@matchbox/ui';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { MatchboxWordmark } from 'src/components/MatchboxWordmark';
import { UserAvatar } from 'src/components/UserAvatar';
import { navThumbnails } from 'src/constants/media';
import { useSignOut } from 'src/features/auth';
import { useToday } from 'src/features/today/api/today.queries';

import { CONTENT_MAX_WIDTH, CONTENT_PADDING_X } from './app-layout.constants';
import { NavDropdownPanel, type NavFeaturedBox, type NavMenuGroup } from './NavDropdownPanel';

type NavSection = 'discover' | 'pipeline' | 'career';

export function AppShell() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { t } = useTranslation();
    const location = useLocation();
    const signOut = useSignOut();
    const today = useToday();
    const discoverCount = today?.data?.stats.matches ?? 0;
    const followUpCount = today?.data?.stats.followUps ?? 0;
    const hasNotifications = followUpCount > 0;
    const fullBleed = location.pathname.startsWith('/pipeline');

    const [openMenu, setOpenMenu] = useState<NavSection | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [menuLocationKey, setMenuLocationKey] = useState(location.key);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
    const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const visibleMenu = menuLocationKey === location.key ? openMenu : null;

    useEffect(
        () => () => {
            if (closeTimer.current) {
                clearTimeout(closeTimer.current);
            }
            if (openTimer.current) {
                clearTimeout(openTimer.current);
            }
        },
        [],
    );

    function clearTimers() {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
        if (openTimer.current) {
            clearTimeout(openTimer.current);
            openTimer.current = null;
        }
    }

    function openSection(section: NavSection, anchor: HTMLElement, delayed = true) {
        clearTimers();
        setMenuAnchor(anchor);
        setMenuLocationKey(location.key);
        if (delayed) {
            openTimer.current = setTimeout(() => setOpenMenu(section), 80);
            return;
        }
        setOpenMenu(section);
    }

    function scheduleClose() {
        clearTimers();
        closeTimer.current = setTimeout(() => setOpenMenu(null), 200);
    }

    function toggleSection(section: NavSection, anchor: HTMLElement) {
        clearTimers();
        setMenuAnchor(anchor);
        setMenuLocationKey(location.key);
        setOpenMenu((current) => (current === section ? null : section));
    }

    const discoverGroups: NavMenuGroup[] = [
        {
            label: t('navMenus.discover.findJobs'),
            items: [
                {
                    title: t('navMenus.discover.newMatches'),
                    description: t('navMenus.discover.newMatchesDesc'),
                    to: '/discover',
                    count: discoverCount > 0 ? discoverCount : undefined,
                },
                {
                    title: t('navMenus.discover.skipped'),
                    description: t('navMenus.discover.skippedDesc'),
                    to: '/discover?filter=skipped',
                },
            ],
        },
        {
            label: t('navMenus.discover.settings'),
            items: [
                {
                    title: t('navMenus.discover.searchPreferences'),
                    description: t('navMenus.discover.searchPreferencesDesc'),
                    to: '/settings',
                },
            ],
        },
    ];
    const discoverFeatured: NavFeaturedBox = {
        title: t('navMenus.discover.featuredTitle', { count: discoverCount }),
        subtitle: t('navMenus.discover.featuredSubtitle'),
        buttonLabel: t('navMenus.discover.featuredButton'),
        buttonTo: '/discover',
        imageSrc: navThumbnails.discover,
        spark: true,
    };

    const pipelineGroups: NavMenuGroup[] = [
        {
            label: t('navMenus.pipeline.views'),
            items: [
                {
                    title: t('navMenus.pipeline.board'),
                    description: t('navMenus.pipeline.boardDesc'),
                    to: '/pipeline?view=board',
                },
                {
                    title: t('navMenus.pipeline.table'),
                    description: t('navMenus.pipeline.tableDesc'),
                    to: '/pipeline?view=table',
                },
            ],
        },
        {
            label: t('navMenus.pipeline.filters'),
            items: [
                {
                    title: t('navMenus.pipeline.active'),
                    description: t('navMenus.pipeline.activeDesc'),
                    to: '/pipeline?view=board&filter=active',
                },
                {
                    title: t('navMenus.pipeline.followUp'),
                    description: t('navMenus.pipeline.followUpDesc'),
                    to: '/pipeline?view=board&filter=follow-up',
                    count: followUpCount > 0 ? followUpCount : undefined,
                },
                {
                    title: t('navMenus.pipeline.interviews'),
                    description: t('navMenus.pipeline.interviewsDesc'),
                    to: '/pipeline?view=board&filter=interviews',
                },
                {
                    title: t('navMenus.pipeline.closed'),
                    description: t('navMenus.pipeline.closedDesc'),
                    to: '/pipeline?view=board&filter=closed',
                },
            ],
        },
    ];
    const pipelineFeatured: NavFeaturedBox = {
        title: t('navMenus.pipeline.featuredTitle'),
        subtitle: t('navMenus.pipeline.featuredSubtitle'),
        buttonLabel: t('actions.addJob'),
        buttonTo: '/jobs/new',
        imageSrc: navThumbnails.pipeline,
    };

    const careerGroups: NavMenuGroup[] = [
        {
            label: t('navMenus.career.profile'),
            items: [
                {
                    title: t('navMenus.career.experience'),
                    description: t('navMenus.career.experienceDesc'),
                    to: '/profile#experience',
                },
                {
                    title: t('navMenus.career.projects'),
                    description: t('navMenus.career.projectsDesc'),
                    to: '/profile#projects',
                },
                {
                    title: t('navMenus.career.skills'),
                    description: t('navMenus.career.skillsDesc'),
                    to: '/profile#skills',
                },
                {
                    title: t('navMenus.career.import'),
                    description: t('navMenus.career.importDesc'),
                    to: '/profile',
                },
            ],
        },
        {
            label: t('navMenus.career.cv'),
            items: [
                {
                    title: t('navMenus.career.baseCv'),
                    description: t('navMenus.career.baseCvDesc'),
                    to: '/cv',
                },
                {
                    title: t('navMenus.career.tailored'),
                    description: t('navMenus.career.tailoredDesc'),
                    to: '/pipeline',
                },
                {
                    title: t('navMenus.career.download'),
                    description: t('navMenus.career.downloadDesc'),
                    to: '/cv',
                },
            ],
        },
    ];
    const careerFeatured: NavFeaturedBox = {
        title: t('navMenus.career.featuredTitle'),
        subtitle: t('navMenus.career.featuredSubtitle'),
        buttonLabel: t('navMenus.career.featuredButton'),
        buttonTo: '/profile',
        imageSrc: navThumbnails.career,
    };

    function sectionActive(prefix: string) {
        return location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);
    }

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <AppBar data-floating="true" position="sticky">
                <Toolbar sx={{ px: CONTENT_PADDING_X }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
                        {isMobile ? (
                            <IconButton
                                aria-label={t('nav.openMenu')}
                                data-test="app-shell-menu-button"
                                onClick={() => setMobileOpen(true)}
                            >
                                <MenuIcon />
                            </IconButton>
                        ) : null}
                        <Box
                            component={RouterLink}
                            data-test="app-shell-logo"
                            sx={{ color: 'text.primary', display: 'inline-block', textDecoration: 'none' }}
                            to="/today"
                        >
                            <MatchboxWordmark />
                        </Box>
                        {!isMobile ? (
                            <Stack
                                aria-label={t('nav.main')}
                                component="nav"
                                direction="row"
                                spacing={0.5}
                                sx={{ alignSelf: 'stretch', alignItems: 'stretch' }}
                            >
                                <Button
                                    color={sectionActive('/today') ? 'primary' : 'secondary'}
                                    component={RouterLink}
                                    data-active={sectionActive('/today')}
                                    data-nav="true"
                                    data-test="app-shell-nav-today"
                                    to="/today"
                                    variant="text"
                                >
                                    {t('nav.today')}
                                </Button>
                                <NavMenuTrigger
                                    active={sectionActive('/discover')}
                                    badge={discoverCount > 0 ? discoverCount : undefined}
                                    label={t('nav.discover')}
                                    menuLabel={t('nav.menuFor', { section: t('nav.discover') })}
                                    onEnter={(anchor) => openSection('discover', anchor)}
                                    onKeyOpen={(anchor) => openSection('discover', anchor, false)}
                                    onLeave={scheduleClose}
                                    onToggle={(anchor) => toggleSection('discover', anchor)}
                                    open={visibleMenu === 'discover'}
                                />
                                <NavMenuTrigger
                                    active={sectionActive('/pipeline')}
                                    label={t('nav.pipeline')}
                                    menuLabel={t('nav.menuFor', { section: t('nav.pipeline') })}
                                    onEnter={(anchor) => openSection('pipeline', anchor)}
                                    onKeyOpen={(anchor) => openSection('pipeline', anchor, false)}
                                    onLeave={scheduleClose}
                                    onToggle={(anchor) => toggleSection('pipeline', anchor)}
                                    open={visibleMenu === 'pipeline'}
                                />
                                <NavMenuTrigger
                                    active={sectionActive('/profile') || sectionActive('/cv')}
                                    label={t('nav.career')}
                                    menuLabel={t('nav.menuFor', { section: t('nav.career') })}
                                    onEnter={(anchor) => openSection('career', anchor)}
                                    onKeyOpen={(anchor) => openSection('career', anchor, false)}
                                    onLeave={scheduleClose}
                                    onToggle={(anchor) => toggleSection('career', anchor)}
                                    open={visibleMenu === 'career'}
                                />
                            </Stack>
                        ) : null}
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <IconButton aria-label={t('search.placeholder')} data-test="app-shell-search-button">
                            <SearchIcon />
                        </IconButton>
                        <IconButton
                            aria-label={t('nav.notifications')}
                            data-test="app-shell-notifications-button"
                            onClick={(event) => setNotificationAnchor(event.currentTarget)}
                        >
                            {hasNotifications ? (
                                <Badge badgeContent={followUpCount} color="accent">
                                    <NotificationIcon />
                                </Badge>
                            ) : (
                                <NotificationIcon />
                            )}
                        </IconButton>
                        <Button
                            aria-label={t('actions.addJob')}
                            component={RouterLink}
                            data-test="pipeline-add-job-button"
                            startIcon={isMobile ? undefined : <PlusIcon />}
                            to="/jobs/new"
                            variant="contained"
                        >
                            {isMobile ? <PlusIcon /> : t('actions.addJob')}
                        </Button>
                        <IconButton
                            aria-label={t('nav.userMenu')}
                            data-test="app-shell-user-menu-button"
                            onClick={(event) => setUserMenuAnchor(event.currentTarget)}
                        >
                            <UserAvatar size={32} />
                        </IconButton>
                    </Stack>
                </Toolbar>
            </AppBar>

            {!isMobile ? (
                <>
                    <NavDropdownPanel
                        anchorEl={menuAnchor}
                        featured={discoverFeatured}
                        groups={discoverGroups}
                        onClose={() => setOpenMenu(null)}
                        onPointerEnter={clearTimers}
                        onPointerLeave={scheduleClose}
                        open={visibleMenu === 'discover'}
                    />
                    <NavDropdownPanel
                        anchorEl={menuAnchor}
                        featured={pipelineFeatured}
                        groups={pipelineGroups}
                        onClose={() => setOpenMenu(null)}
                        onPointerEnter={clearTimers}
                        onPointerLeave={scheduleClose}
                        open={visibleMenu === 'pipeline'}
                    />
                    <NavDropdownPanel
                        anchorEl={menuAnchor}
                        featured={careerFeatured}
                        groups={careerGroups}
                        onClose={() => setOpenMenu(null)}
                        onPointerEnter={clearTimers}
                        onPointerLeave={scheduleClose}
                        open={visibleMenu === 'career'}
                    />
                </>
            ) : null}

            <Box
                component="main"
                sx={{
                    mx: 'auto',
                    maxWidth: fullBleed ? undefined : CONTENT_MAX_WIDTH,
                    px: CONTENT_PADDING_X,
                    py: 4,
                    width: '100%',
                }}
            >
                <Outlet />
            </Box>

            <Menu anchorEl={userMenuAnchor} onClose={() => setUserMenuAnchor(null)} open={Boolean(userMenuAnchor)}>
                <MenuItem
                    component={RouterLink}
                    data-test="app-shell-settings-link"
                    onClick={() => setUserMenuAnchor(null)}
                    to="/settings"
                >
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    {t('nav.settings')}
                </MenuItem>
                <MenuItem
                    data-test="app-sign-out-button"
                    disabled={signOut.isPending}
                    onClick={() => {
                        setUserMenuAnchor(null);
                        signOut.mutate();
                    }}
                >
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    {t('actions.signOut')}
                </MenuItem>
            </Menu>

            <Menu
                anchorEl={notificationAnchor}
                onClose={() => setNotificationAnchor(null)}
                open={Boolean(notificationAnchor)}
            >
                {hasNotifications ? (
                    <MenuItem
                        component={RouterLink}
                        onClick={() => setNotificationAnchor(null)}
                        to="/pipeline?view=board&filter=follow-up"
                    >
                        {t('nav.followUpNotifications', { count: followUpCount })}
                    </MenuItem>
                ) : (
                    <MenuItem disabled>{t('nav.noNotifications')}</MenuItem>
                )}
            </Menu>

            <Drawer anchor="right" onClose={() => setMobileOpen(false)} open={mobileOpen}>
                <Box sx={{ p: 2, width: { xs: '100vw', sm: 360 } }}>
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <MatchboxWordmark />
                        <IconButton
                            aria-label={t('nav.closeMenu')}
                            data-test="app-shell-close-menu-button"
                            onClick={() => setMobileOpen(false)}
                        >
                            <XIcon />
                        </IconButton>
                    </Stack>
                    <Button
                        color={sectionActive('/today') ? 'primary' : 'secondary'}
                        component={RouterLink}
                        fullWidth
                        onClick={() => setMobileOpen(false)}
                        sx={{ justifyContent: 'flex-start' }}
                        to="/today"
                        variant="text"
                    >
                        {t('nav.today')}
                    </Button>
                    <MobileNavSection
                        groups={discoverGroups}
                        label={t('nav.discover')}
                        onNavigate={() => setMobileOpen(false)}
                    />
                    <MobileNavSection
                        groups={pipelineGroups}
                        label={t('nav.pipeline')}
                        onNavigate={() => setMobileOpen(false)}
                    />
                    <MobileNavSection
                        groups={careerGroups}
                        label={t('nav.career')}
                        onNavigate={() => setMobileOpen(false)}
                    />
                </Box>
            </Drawer>
        </Box>
    );
}

type NavMenuTriggerProps = {
    active: boolean;
    badge?: number;
    label: string;
    menuLabel: string;
    onEnter: (anchor: HTMLElement) => void;
    onKeyOpen: (anchor: HTMLElement) => void;
    onLeave: () => void;
    onToggle: (anchor: HTMLElement) => void;
    open: boolean;
};

function NavMenuTrigger({
    active,
    badge,
    label,
    menuLabel,
    onEnter,
    onKeyOpen,
    onLeave,
    onToggle,
    open,
}: NavMenuTriggerProps) {
    return (
        <Badge
            badgeContent={badge}
            color="accent"
            invisible={badge === undefined}
            onMouseEnter={(event) => onEnter(event.currentTarget)}
            onMouseLeave={onLeave}
            sx={{ alignSelf: 'stretch' }}
        >
            <Button
                aria-expanded={open}
                aria-haspopup="true"
                aria-label={menuLabel}
                color={active ? 'primary' : 'secondary'}
                data-active={active}
                data-nav="true"
                endIcon={open ? <ChevronUpIcon fontSize="small" /> : <ChevronDownIcon fontSize="small" />}
                onClick={(event) => onToggle(event.currentTarget)}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        onKeyOpen(event.currentTarget);
                    }
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        onToggle(event.currentTarget);
                    }
                }}
                variant="text"
            >
                {label}
            </Button>
        </Badge>
    );
}

type MobileNavSectionProps = {
    groups: NavMenuGroup[];
    label: string;
    onNavigate: () => void;
};

function MobileNavSection({ groups, label, onNavigate }: MobileNavSectionProps) {
    return (
        <Accordion disableGutters elevation={0}>
            <AccordionSummary
                data-test={`app-shell-mobile-${label.toLowerCase()}-button`}
                expandIcon={<ChevronDownIcon />}
            >
                <Typography variant="subtitle1">{label}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Stack spacing={2}>
                    {groups.map((group) => (
                        <Stack key={group.label} spacing={0.5}>
                            <Typography color="text.secondary" variant="caption">
                                {group.label}
                            </Typography>
                            {group.items.map((item) => (
                                <Button
                                    component={RouterLink}
                                    key={item.to}
                                    onClick={onNavigate}
                                    sx={{ justifyContent: 'flex-start' }}
                                    to={item.to}
                                    variant="text"
                                >
                                    {item.title}
                                </Button>
                            ))}
                        </Stack>
                    ))}
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
}
