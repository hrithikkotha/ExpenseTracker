import { ReactNode, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileAppLayout } from './MobileAppLayout';
import { DesktopAppLayout } from './DesktopAppLayout';
import { useProcessPendingRecurring } from '@/features/recurring/hooks';

interface AppLayoutProps {
  children?: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function AppLayout({ children, title, actions }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const processPending = useProcessPendingRecurring();

  // Trigger lazy catch-up on app open
  useEffect(() => {
    processPending.mutate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If used as a router layout, render Outlet; otherwise render children
  const content = children || <Outlet />;

  if (isMobile) {
    return (
      <MobileAppLayout title={title} actions={actions}>
        {content}
      </MobileAppLayout>
    );
  }

  return <DesktopAppLayout>{content}</DesktopAppLayout>;
}
