import { ThemeProvider } from '@matchbox/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createQueryClient } from 'src/app/query-client';

type ProviderRenderOptions = RenderOptions & {
    initialEntries?: string[];
    path?: string;
};

export function renderWithProviders(element: ReactElement, options?: ProviderRenderOptions) {
    const { initialEntries = ['/'], path, ...renderOptions } = options ?? {};
    const queryClient = createQueryClient();
    queryClient.setDefaultOptions({
        mutations: { retry: false },
        queries: { retry: false },
    });
    const routed = path ? (
        <Routes>
            <Route element={element} path={path} />
        </Routes>
    ) : (
        element
    );

    return render(
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={initialEntries}>{routed}</MemoryRouter>
            </QueryClientProvider>
        </ThemeProvider>,
        renderOptions,
    );
}
