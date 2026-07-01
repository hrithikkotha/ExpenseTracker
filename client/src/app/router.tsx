import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from '../routes/ProtectedRoute';
import PublicOnlyRoute from '../routes/PublicOnlyRoute';

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('../pages/ImprovedDashboardPage'));
const TransactionsPage = lazy(() => import('../pages/TransactionsPage'));
const CategoriesPage = lazy(() => import('../pages/CategoriesPage'));
const AccountsPage = lazy(() => import('../pages/AccountsPage').then(m => ({ default: m.AccountsPage })));
const CalendarPage = lazy(() => import('../pages/ImprovedCalendarPage').then(m => ({ default: m.ImprovedCalendarPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

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
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'accounts', element: <AccountsPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'more', element: <SettingsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
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
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
