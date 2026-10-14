import { Stack, Typography } from '@matchbox/ui';

type CvColumnHeaderProps = {
    description: string;
    title: string;
};

export function CvColumnHeader({ description, title }: CvColumnHeaderProps) {
    return (
        <Stack spacing={0.5}>
            <Typography component="h2" sx={{ fontSize: '1rem', fontWeight: 600 }} variant="h6">
                {title}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.8125rem' }} variant="body2">
                {description}
            </Typography>
        </Stack>
    );
}
