import { describe, expect, it } from 'vitest';

import { moveSelectedId, sectionRows, toggleSelectedId } from './cv-section-order';

const first = { id: '1', title: 'First', subtitle: null };
const second = { id: '2', title: 'Second', subtitle: null };

describe('cv section order', () => {
    it('should list included items first, in the saved order', () => {
        expect(sectionRows([first, second], ['2'])).toEqual([
            { item: second, included: true },
            { item: first, included: false },
        ]);
    });

    it('should move an included item and ignore a move past the ends', () => {
        expect(moveSelectedId(['1', '2'], '2', -1)).toEqual(['2', '1']);
        expect(moveSelectedId(['1', '2'], '1', -1)).toEqual(['1', '2']);
    });

    it('should append an item when it is included and drop it when it is excluded', () => {
        expect(toggleSelectedId(['1'], '2', true)).toEqual(['1', '2']);
        expect(toggleSelectedId(['1', '2'], '1', false)).toEqual(['2']);
    });
});
