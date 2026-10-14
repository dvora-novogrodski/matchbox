import { Box, Divider, Stack, Typography } from '@matchbox/ui';
import type { ReactNode } from 'react';
import { CoverImage } from 'src/components/CoverImage';
import { UserAvatar } from 'src/components/UserAvatar';
import { photos } from 'src/constants/media';

const PROFILE_COVER_SRC = photos.profileCover;

type ProfileHeaderProps = {
    actions?: ReactNode;
    description?: string;
    title: string;
};

export function ProfileHeader({ actions, description, title }: ProfileHeaderProps) {
    return (
        <Stack spacing={0}>
            <CoverImage alt="" height={120} src={PROFILE_COVER_SRC} />
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                    alignItems: { sm: 'flex-end' },
                    justifyContent: 'space-between',
                    mt: -4.5,
                    pb: 3,
                }}
            >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end', minWidth: 0 }}>
                    <Box sx={{ flexShrink: 0, pl: { xs: 0, sm: 0.5 } }}>
                        <UserAvatar data-test="profile-avatar" profile size={72} />
                    </Box>
                    <Stack spacing={0.5} sx={{ minWidth: 0, pb: 0.5, pt: { xs: 1, sm: 5 } }}>
                        <Typography component="h1" data-test="profile-display-name" variant="h3">
                            {title}
                        </Typography>
                        {description ? (
                            <Typography color="text.secondary" data-test="profile-headline" variant="body2">
                                {description}
                            </Typography>
                        ) : null}
                    </Stack>
                </Stack>
                {actions ? <Box sx={{ flexShrink: 0, pb: 0.5 }}>{actions}</Box> : null}
            </Stack>
            <Divider sx={{ mb: 3 }} />
        </Stack>
    );
}
