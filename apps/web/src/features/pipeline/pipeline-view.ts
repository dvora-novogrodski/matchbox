export const PIPELINE_VIEWS = ['board', 'table'] as const;
export type PipelineView = (typeof PIPELINE_VIEWS)[number];

export function pipelineViewFromParam(value: string | null): PipelineView {
    return value === 'table' ? 'table' : 'board';
}
