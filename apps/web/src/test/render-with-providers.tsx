import { ThemeProvider } from '@matchbox/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { createQueryClient } from 'src/app/query-client';

export function renderWithProviders(element: ReactElement, options?: RenderOptions) {
    const queryClient = createQueryClient();
    queryClient.setDefaultOptions({
        mutations: { retry: false },
        queries: { retry: false },
    });

    return render(
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>{element}</MemoryRouter>
            </QueryClientProvider>
        </ThemeProvider>,
        options,
    );
}
