import { Avatar } from '@matchbox/ui';
import { useCurrentUser } from 'src/features/auth';

type UserAvatarProps = {
    'data-test'?: string;
    profile?: boolean;
    size?: number;
};

export function UserAvatar({ 'data-test': dataTest, profile = false, size = 32 }: UserAvatarProps) {
    const currentUser = useCurrentUser();
    const label = currentUser.data?.displayName?.trim() || currentUser.data?.email?.trim() || '?';
    const initial = label.charAt(0).toUpperCase();

    return (
        <Avatar
            alt={label}
            data-test={dataTest}
            sx={{
                bgcolor: 'surface.200',
                border: profile ? '3px solid' : undefined,
                borderColor: profile ? 'background.paper' : undefined,
                color: 'text.secondary',
                height: size,
                width: size,
            }}
        >
            {initial}
        </Avatar>
    );
}
