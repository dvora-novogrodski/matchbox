import {
    AIIcon,
    Box,
    Button,
    ClickAwayListener,
    Grow,
    MenuItem,
    MenuList,
    Paper,
    Popper,
    Stack,
    Typography,
} from '@matchbox/ui';
import { Link as RouterLink } from 'react-router-dom';

export type NavMenuItem = {
    count?: number;
    description: string;
    title: string;
    to: string;
};

export type NavMenuGroup = {
    items: NavMenuItem[];
    label: string;
};

export type NavFeaturedBox = {
    buttonLabel: string;
    buttonTo: string;
    imageSrc: string;
    spark?: boolean;
    subtitle: string;
    title: string;
};

type NavDropdownPanelProps = {
    anchorEl: HTMLElement | null;
    featured?: NavFeaturedBox;
    groups: NavMenuGroup[];
    onClose: () => void;
    onPointerEnter?: () => void;
    onPointerLeave?: () => void;
    open: boolean;
};

export function NavDropdownPanel({
    anchorEl,
    featured,
    groups,
    onClose,
    onPointerEnter,
    onPointerLeave,
    open,
}: NavDropdownPanelProps) {
    return (
        <Popper anchorEl={anchorEl} open={open} placement="bottom-start" sx={{ zIndex: 1300 }} transition>
            {({ TransitionProps }) => (
                <Grow {...TransitionProps} style={{ transformOrigin: 'top left' }}>
                    <Box onMouseEnter={onPointerEnter} onMouseLeave={onPointerLeave} sx={{ pt: 1 }}>
                        <ClickAwayListener onClickAway={onClose}>
                            <Paper
                                elevation={8}
                                sx={{
                                    boxSizing: 'border-box',
                                    display: 'flex',
                                    gap: 2,
                                    maxWidth: 'min(720px, calc(100vw - 24px))',
                                    overflow: 'hidden',
                                    p: 3,
                                }}
                            >
                                <Stack direction="row" spacing={2} sx={{ flex: '1 1 auto', minWidth: 0 }}>
                                    {groups.map((group) => (
                                        <MenuList dense disablePadding key={group.label} sx={{ maxWidth: 200, minWidth: 168 }}>
                                            <Typography color="text.secondary" sx={{ px: 2, py: 1 }} variant="caption">
                                                {group.label}
                                            </Typography>
                                            {group.items.map((item) => (
                                                <MenuItem
                                                    component={RouterLink}
                                                    key={item.to}
                                                    onClick={onClose}
                                                    sx={{ alignItems: 'flex-start', py: 1 }}
                                                    to={item.to}
                                                >
                                                    <Stack spacing={0.25} sx={{ width: '100%' }}>
                                                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                                                            <Typography variant="subtitle1">{item.title}</Typography>
                                                            {item.count !== undefined ? (
                                                                <Typography color="text.secondary" variant="body2">
                                                                    {item.count}
                                                                </Typography>
                                                            ) : null}
                                                        </Stack>
                                                        <Typography color="text.secondary" variant="body2">
                                                            {item.description}
                                                        </Typography>
                                                    </Stack>
                                                </MenuItem>
                                            ))}
                                        </MenuList>
                                    ))}
                                </Stack>
                                {featured ? <FeaturedBox featured={featured} onClose={onClose} /> : null}
                            </Paper>
                        </ClickAwayListener>
                    </Box>
                </Grow>
            )}
        </Popper>
    );
}

function FeaturedBox({ featured, onClose }: { featured: NavFeaturedBox; onClose: () => void }) {
    return (
        <Paper
            sx={{
                alignSelf: 'flex-start',
                boxSizing: 'border-box',
                flex: '0 0 200px',
                maxWidth: 200,
                minWidth: 0,
                overflow: 'hidden',
                p: 2,
            }}
            variant="outlined"
        >
            <Box
                sx={{
                    bgcolor: 'surface.100',
                    borderRadius: 1,
                    height: 80,
                    overflow: 'hidden',
                    width: '100%',
                }}
            >
                <Box
                    alt=""
                    component="img"
                    loading="lazy"
                    src={featured.imageSrc}
                    sx={{
                        display: 'block',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        width: '100%',
                    }}
                />
            </Box>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start', mt: 1.5, minWidth: 0 }}>
                {featured.spark ? (
                    <AIIcon color="accent" fontSize="small" sx={{ flexShrink: 0, mt: 0.125 }} />
                ) : null}
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 0 }}>{featured.title}</Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ fontSize: '0.8125rem', mt: 0.5 }} variant="body2">
                {featured.subtitle}
            </Typography>
            <Button
                component={RouterLink}
                onClick={onClose}
                size="small"
                sx={{ mt: 1.5 }}
                to={featured.buttonTo}
                variant="outlined"
            >
                {featured.buttonLabel}
            </Button>
        </Paper>
    );
}
