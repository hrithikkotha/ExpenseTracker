import { Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { QuickAddSheet } from './QuickAddSheet';

export function QuickAddFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-20 right-4 z-40',
          'flex items-center justify-center',
          'w-14 h-14 rounded-full',
          'bg-primary text-primary-foreground',
          'shadow-lg hover:shadow-xl',
          'transition-all duration-200',
          'active:scale-95',
          'md:hidden touch-target'
        )}
        aria-label="Add transaction"
      >
        <Plus className="w-6 h-6" />
      </button>

      <QuickAddSheet open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
