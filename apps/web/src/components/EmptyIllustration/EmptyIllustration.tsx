import { Box } from '@matchbox/ui';

type EmptyIllustrationProps = {
    src: string;
};

/** Spot illustrations (4∶3 artboard); scales cleanly in centered empty states. */
export function EmptyIllustration({ src }: EmptyIllustrationProps) {
    return (
        <Box
            alt=""
            component="img"
            loading="lazy"
            src={src}
            sx={{
                aspectRatio: '4 / 3',
                display: 'block',
                height: 'auto',
                maxWidth: 220,
                mx: 'auto',
                objectFit: 'contain',
                width: '100%',
            }}
        />
    );
}
