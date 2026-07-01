import { NavLink, Outlet } from 'react-router-dom';

/**
 * Authenticated app shell: sidebar navigation + content outlet.
 * Route guarding, the topbar (search / theme / user menu), and the mobile
 * nav are wired up in later phases. Nav items are placeholders for now.
 */
const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/reports', label: 'Reports' },
  { to: '/categories', label: 'Categories' },
  { to: '/settings', label: 'Settings' },
];

export default function AppLayout() {
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:block">
        <div className="mb-6 px-2 text-lg font-bold text-brand-600">
          Expense Tracker
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-gray-800 dark:text-brand-100'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
