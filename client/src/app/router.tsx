import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';

/**
 * Route tree. In Phase 1 the app branch is wrapped in <ProtectedRoute> and
 * the auth branch gains login/register pages under <PublicOnlyRoute>.
 */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [{ index: true, element: <DashboardPage /> }],
  },
  {
    element: <AuthLayout />,
    children: [
      // Phase 1: { path: 'login', element: <LoginPage /> }, etc.
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
