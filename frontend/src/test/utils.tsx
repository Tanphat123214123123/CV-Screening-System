import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { routerFuture } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import type { AuthUser } from '../types';

export const hrUser: AuthUser = { token: 't', userId: 2, fullName: 'Nguyen Van Hai', email: 'hr@demo.com', role: 'HR' };
export const candidateUser: AuthUser = {
  token: 't', userId: 1, fullName: 'Tran Van Ung Vien', email: 'candidate@demo.com', role: 'CANDIDATE',
};

/** Render voi day du provider that (router, react-query, auth, theme). */
export function renderWithProviders(ui: ReactElement, { route = '/', user }: { route?: string; user?: AuthUser } = {}) {
  if (user) localStorage.setItem('auth', JSON.stringify(user));
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={[route]} future={routerFuture}>{ui}</MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}
