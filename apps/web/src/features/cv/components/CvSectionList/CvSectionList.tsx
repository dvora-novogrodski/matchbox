import type { CvCatalogItem } from '@matchbox/shared';
import { Button, Checkbox, FormControlLabel, Stack, Typography } from '@matchbox/ui';
import { useTranslation } from 'react-i18next';

import { moveSelectedId, sectionRows, toggleSelectedId } from '../../cv-section-order';

type CvSectionListProps = {
    kind: 'experience' | 'projects' | 'skills' | 'education';
    items: CvCatalogItem[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
};

export function CvSectionList({ kind, items, selectedIds, onChange }: CvSectionListProps) {
    const { t } = useTranslation('cv');
    const rows = sectionRows(items, selectedIds);

    return (
        <Stack spacing={1}>
            <Typography component="h2" variant="h5">
                {t(`sections.${kind}`)}
            </Typography>
            {rows.length === 0 ? <Typography color="text.secondary">{t('sections.empty')}</Typography> : null}
            {rows.map((row) => (
                <Stack direction="row" key={row.item.id} spacing={1} sx={{ alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={row.included}
                                data-test={`cv-include-${row.item.id}`}
                                onChange={(_event, checked) => onChange(toggleSelectedId(selectedIds, row.item.id, checked))}
                            />
                        }
                        label={row.item.subtitle ? `${row.item.title} — ${row.item.subtitle}` : row.item.title}
                    />
                    {row.included ? (
                        <Stack direction="row" spacing={1}>
                            <Button
                                data-test={`cv-move-up-${row.item.id}`}
                                disabled={selectedIds[0] === row.item.id}
                                onClick={() => onChange(moveSelectedId(selectedIds, row.item.id, -1))}
                                size="small"
                            >
                                {t('actions.moveUp', { title: row.item.title })}
                            </Button>
                            <Button
                                data-test={`cv-move-down-${row.item.id}`}
                                disabled={selectedIds[selectedIds.length - 1] === row.item.id}
                                onClick={() => onChange(moveSelectedId(selectedIds, row.item.id, 1))}
                                size="small"
                            >
                                {t('actions.moveDown', { title: row.item.title })}
                            </Button>
                        </Stack>
                    ) : null}
                </Stack>
            ))}
        </Stack>
    );
}
