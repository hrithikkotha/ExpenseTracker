import { Outlet } from 'react-router-dom';

/**
 * Minimal centered layout for unauthenticated pages (login, register).
 * Auth pages themselves arrive in Phase 1.
 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand-600">Expense Tracker</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Take control of your money
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
