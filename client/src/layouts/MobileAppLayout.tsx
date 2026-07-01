import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-semibold">{title || 'Expense Tracker'}</h1>
          <div className="flex items-center gap-2">
            {/* Calendar Icon - Show on all pages except calendar */}
            {showCalendarIcon && (
              <Link
                to="/calendar"
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                  "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                aria-label="Calendar"
              >
                <Calendar className="w-5 h-5" />
              </Link>
            )}
            {actions}
          </div>
        </div>
      </header>

      {/* Main Content - with safe padding for bottom nav */}
      <main className="flex-1 overflow-y-auto pb-24 relative">
        {children}
      </main>

      {/* Bottom Navigation - always on top */}
      <BottomNav />
    </div>
  );
}
