import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../routes/ProtectedRoute';
import PublicOnlyRoute from '../routes/PublicOnlyRoute';
import AdminRoute from '../routes/AdminRoute';

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('../pages/ImprovedDashboardPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));
const AccountsPage = lazy(() => import('../pages/AccountsPage').then(m => ({ default: m.AccountsPage })));
const CalendarPage = lazy(() => import('../pages/ImprovedCalendarPage').then(m => ({ default: m.ImprovedCalendarPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ExportPage = lazy(() => import('../pages/ExportPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const AdminLoginPage = lazy(() => import('../pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const RecurringPage = lazy(() => import('../pages/RecurringPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));

/**
 * Route tree. The app branch is gated by <ProtectedRoute>; auth pages sit
 * under <PublicOnlyRoute> so signed-in users are bounced to the dashboard.
 */
export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'analytics', element: <DashboardPage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'accounts', element: <AccountsPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'recurring', element: <RecurringPage /> },
          { path: 'more', element: <SettingsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'export', element: <ExportPage /> },
        ],
      },
    ],
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  { path: 'admin/login', element: <AdminLoginPage /> },
  {
    path: 'admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
