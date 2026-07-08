import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Settings } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { cn } from '@/lib/utils';

interface MobileAppLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function MobileAppLayout({ children, title, actions }: MobileAppLayoutProps) {
  const location = useLocation();
  const showCalendarIcon = !location.pathname.startsWith('/calendar');
  const showSettingsIcon = !location.pathname.startsWith('/settings') && !location.pathname.startsWith('/profile');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-semibold tracking-tight">{title || 'Expense Tracker'}</h1>
          <div className="flex items-center gap-1">
            {/* Calendar Icon */}
            {showCalendarIcon && (
              <Link
                to="/calendar"
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
                  "hover:bg-muted text-muted-foreground hover:text-foreground",
                  location.pathname.startsWith('/calendar') && "text-primary bg-primary/10"
                )}
                aria-label="Calendar"
              >
                <Calendar className="w-5 h-5" />
              </Link>
            )}

            {/* Settings Icon — always visible, production standard */}
            {showSettingsIcon && (
              <Link
                to="/settings"
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
                  "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}

            {/* Page-specific actions */}
            {actions}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 relative">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
