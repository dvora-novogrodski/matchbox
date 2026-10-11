import { describe, expect, it } from 'vitest';

import { pipelineViewFromParam } from './pipeline-view';

describe('pipelineViewFromParam', () => {
    it('should use the board when the view param is missing', () => {
        expect(pipelineViewFromParam(null)).toBe('board');
    });

    it('should use the table when the view param asks for it', () => {
        expect(pipelineViewFromParam('table')).toBe('table');
    });

    it('should ignore an unknown view param', () => {
        expect(pipelineViewFromParam('kanban')).toBe('board');
    });
});
