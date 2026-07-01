import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  Calendar,
  Wallet,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickAddSheet } from '@/components/transactions/QuickAddSheet';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: Receipt, label: 'Transactions' },
  { path: '/add', icon: PlusCircle, label: 'Add', isSpecial: true },
  { path: '/accounts', icon: Wallet, label: 'Accounts' },
  { path: '/more', icon: Menu, label: 'More' },
];

export function BottomNav() {
  const location = useLocation();
  const [showAddSheet, setShowAddSheet] = React.useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm shadow-lg md:hidden">
        <div className="flex items-center justify-around h-16 safe-bottom">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/dashboard');
            const Icon = item.icon;

            if (item.isSpecial) {
              return (
                <button
                  key={item.path}
                  onClick={() => setShowAddSheet(true)}
                  className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 transition-colors relative"
                >
                  <div className="absolute -top-6 flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[44px] min-h-[44px] flex-1 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Quick Add Sheet */}
      {showAddSheet && (
        <QuickAddSheet open={showAddSheet} onOpenChange={setShowAddSheet} />
      )}
    </>
  );
}
