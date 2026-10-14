import { Box } from '@matchbox/ui';
import { officeCoverImagePath } from 'src/utils/company-image.utils';

type CoverImageProps = {
    alt: string;
    companyName?: string;
    height: number;
    src?: string | null;
};

export function CoverImage({ alt, companyName = '', height, src }: CoverImageProps) {
    const fallback = officeCoverImagePath(companyName);
    const imageSrc = src ?? fallback;
    const isIllustration = imageSrc.endsWith('.svg');

    return (
        <Box
            sx={{
                alignItems: 'center',
                bgcolor: 'surface.200',
                borderRadius: 3,
                display: 'flex',
                height,
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
            }}
        >
            <Box
                alt={alt}
                component="img"
                loading="lazy"
                src={imageSrc}
                sx={{
                    display: 'block',
                    filter: 'saturate(0.85)',
                    height: isIllustration ? 'auto' : '100%',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: isIllustration ? 'contain' : 'cover',
                    objectPosition: 'center center',
                    width: isIllustration ? '100%' : '100%',
                }}
            />
        </Box>
    );
}
