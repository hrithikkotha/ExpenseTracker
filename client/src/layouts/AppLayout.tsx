import { ReactNode, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileAppLayout } from './MobileAppLayout';
import { DesktopAppLayout } from './DesktopAppLayout';
import { NetworkStatusBanner, SyncErrorBanner } from '@/pwa/components/NetworkStatusBanner';
import { InstallPrompt } from '@/pwa/components/InstallPrompt';

interface AppLayoutProps {
  children?: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function AppLayout({ children, title, actions }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <>
      {/* Network Status Banner (shown at top) */}
      <NetworkStatusBanner />

      {/* Sync Error Banner */}
      <SyncErrorBanner />

      {/* Main Layout */}
      {isMobile ? (
        <MobileAppLayout title={title} actions={actions}>
          {content}
        </MobileAppLayout>
      ) : (
        <DesktopAppLayout>{content}</DesktopAppLayout>
      )}

      {/* Install Prompt */}
      <InstallPrompt />
    </>
  );
}
