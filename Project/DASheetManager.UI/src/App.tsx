import { Toaster } from 'sonner'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './components/AppShell'
import { ProtectedRoute } from './router/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { ManageUsersPage } from './pages/ManageUsersPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { TemplateFormPage } from './pages/TemplateFormPage'
import { SheetsPage } from './pages/SheetsPage'
import { CreateSheetPage } from './pages/CreateSheetPage'
import { SheetDetailPage } from './pages/SheetDetailPage'
import { SessionLoader } from './components/SessionLoader'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds default
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        {/*
          SessionLoader calls GET /api/auth/me on mount to restore the user from the HttpOnly cookie. Renders a loading spinner until resolved.
        */}
        <SessionLoader>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />

            {/* Protected routes — require authentication */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* {/* DA Sheets */}
                <Route path="/sheets" element={<SheetsPage />} />
                <Route path="/sheets/create" element={<CreateSheetPage />} />
                <Route path="/sheets/:id" element={<SheetDetailPage />} />

                {/* Admin-only routes */}
                <Route element={<ProtectedRoute adminOnly />}>
                  <Route path="/users" element={<ManageUsersPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/templates/create" element={<TemplateFormPage />} />
                  <Route path="/templates/:id/edit" element={<TemplateFormPage />} />
                </Route>
              </Route>
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SessionLoader>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
