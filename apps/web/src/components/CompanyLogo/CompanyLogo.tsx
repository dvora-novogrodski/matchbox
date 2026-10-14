import { Box } from '@matchbox/ui';
import { useState } from 'react';

import { domainFromJobUrl, faviconUrlForDomain } from '../../utils/company-image.utils';
import { BuildingIcon } from '../icons/BuildingIcon';

type CompanyLogoProps = {
    companyName: string;
    'data-test'?: string;
    jobUrl?: string | null;
    logoUrl?: string | null;
    size?: number;
};

export function CompanyLogo({ companyName: _companyName, 'data-test': dataTest, jobUrl, logoUrl, size = 28 }: CompanyLogoProps) {
    const domain = domainFromJobUrl(jobUrl);
    const initialSrc = logoUrl ?? (domain ? faviconUrlForDomain(domain) : null);
    const [failed, setFailed] = useState(!initialSrc);

    const tileSx = {
        alignItems: 'center',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flexShrink: 0,
        height: size,
        justifyContent: 'center',
        overflow: 'hidden',
        width: size,
    };

    if (failed || !initialSrc) {
        return (
            <Box data-test={dataTest} sx={{ ...tileSx, color: 'text.tertiary' }}>
                <BuildingIcon />
            </Box>
        );
    }

    return (
        <Box data-test={dataTest} sx={tileSx}>
            <Box
                alt=""
                component="img"
                onError={() => setFailed(true)}
                src={initialSrc}
                sx={{ height: '100%', objectFit: 'contain', p: 0.5, width: '100%' }}
            />
        </Box>
    );
}
