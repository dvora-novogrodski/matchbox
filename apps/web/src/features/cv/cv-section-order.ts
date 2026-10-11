import type { CvCatalogItem } from '@matchbox/shared';

export function sectionRows(
    catalog: CvCatalogItem[],
    selectedIds: string[],
): { item: CvCatalogItem; included: boolean }[] {
    const byId = new Map(catalog.map((item) => [item.id, item]));
    const selected = selectedIds.flatMap((id) => {
        const item = byId.get(id);
        return item ? [{ item, included: true }] : [];
    });
    const selectedSet = new Set(selected.map((row) => row.item.id));
    const rest = catalog.filter((item) => !selectedSet.has(item.id)).map((item) => ({ item, included: false }));
    return [...selected, ...rest];
}

export function moveSelectedId(selectedIds: string[], id: string, direction: -1 | 1): string[] {
    const index = selectedIds.indexOf(id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= selectedIds.length) {
        return selectedIds;
    }
    const copy = [...selectedIds];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    return copy;
}

export function toggleSelectedId(selectedIds: string[], id: string, included: boolean): string[] {
    if (included) {
        return selectedIds.includes(id) ? selectedIds : [...selectedIds, id];
    }
    return selectedIds.filter((selectedId) => selectedId !== id);
}
