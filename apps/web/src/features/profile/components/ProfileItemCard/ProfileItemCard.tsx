import type { ProfileBullet } from '@matchbox/shared';
import { Button, Card, MenuItem, MenuList, Popover, Stack, Typography } from '@matchbox/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type ProfileItemCardProps = {
    title: string;
    subtitle?: string;
    bullets: ProfileBullet[];
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
};

function displayDate(value: string | null): string | null {
    return value
        ? new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(value))
        : null;
}

export function ProfileItemCard({ title, subtitle, bullets, onEdit, onDelete, isDeleting }: ProfileItemCardProps) {
    const { t } = useTranslation('profile');
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

    return (
        <Card sx={{ p: 3 }} variant="outlined">
            <Stack spacing={1}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Stack spacing={0.5}>
                        <Typography component="h3" dir="auto" variant="h6">
                            {title}
                        </Typography>
                        {subtitle ? (
                            <Typography color="text.secondary" dir="auto">
                                {subtitle}
                            </Typography>
                        ) : null}
                    </Stack>
                    <Button
                        aria-label={t('item.actions')}
                        data-test="profile-item-actions-button"
                        onClick={(event) => setMenuAnchor(event.currentTarget)}
                        variant="text"
                    >
                        {t('item.more')}
                    </Button>
                </Stack>
                {bullets.length > 0 ? (
                    <Typography component="div">
                        <ul>
                            {bullets.map((bullet) => (
                                <li dir="auto" key={bullet.id}>
                                    {bullet.text}
                                </li>
                            ))}
                        </ul>
                    </Typography>
                ) : null}
                <Popover anchorEl={menuAnchor} onClose={() => setMenuAnchor(null)} open={Boolean(menuAnchor)}>
                    <MenuList>
                        <MenuItem
                            onClick={() => {
                                setMenuAnchor(null);
                                onEdit();
                            }}
                        >
                            {t('item.edit')}
                        </MenuItem>
                        <MenuItem disabled={isDeleting} onClick={() => {
                            setMenuAnchor(null);
                            onDelete();
                        }}>
                            {t('item.delete')}
                        </MenuItem>
                    </MenuList>
                </Popover>
            </Stack>
        </Card>
    );
}

export function formatItemSubtitle(parts: {
    organization?: string | null;
    institution?: string | null;
    startDate: string | null;
    endDate: string | null;
    presentLabel: string;
}): string | undefined {
    const dateRange = [displayDate(parts.startDate), parts.endDate ? displayDate(parts.endDate) : parts.presentLabel]
        .filter(Boolean)
        .join(' – ');
    return [parts.organization ?? parts.institution, dateRange].filter(Boolean).join(' · ');
}
