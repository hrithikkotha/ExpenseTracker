import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Calendar,
  Wallet,
  Settings,
  LogOut,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout as logoutApi } from '@/features/auth/auth.api';
import { clearAccessToken } from '@/lib/tokenStore';
import { useNavigate } from 'react-router-dom';
import { QuickAddSheet } from '@/components/transactions/QuickAddSheet';

const sidebarItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: Receipt, label: 'Transactions' },
  { path: '/recurring', icon: RefreshCw, label: 'Recurring' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/accounts', icon: Wallet, label: 'Accounts' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

interface DesktopAppLayoutProps {
  children: ReactNode;
}

export function DesktopAppLayout({ children }: DesktopAppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const handleLogout = async () => {
    await logoutApi();
    clearAccessToken();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-muted/10">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b">
          <Wallet className="w-6 h-6 text-primary mr-2" />
          <span className="text-lg font-bold">Expense Tracker</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Add Transaction Button */}
        <div className="p-3 border-t">
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Transaction</span>
          </button>
        </div>

        {/* Logout */}
        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Quick Add Sheet */}
      <QuickAddSheet open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
