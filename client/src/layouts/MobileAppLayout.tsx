import { ReactNode } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';

interface MobileAppLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function MobileAppLayout({ children, title, actions }: MobileAppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="text-lg font-semibold">{title}</h1>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
