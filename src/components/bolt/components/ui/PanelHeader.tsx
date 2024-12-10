'use client'

import { memo } from 'react';
import { classNames } from '@/components/bolt/utils/classNames';

interface PanelHeaderProps {
  className?: string;
  children: React.ReactNode;
}

const PanelHeader = memo(({ className, children }: PanelHeaderProps) => {
  return (
    <div
      className={classNames(
        'flex items-center gap-2 bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary border-b border-bolt-elements-borderColor px-4 py-1 min-h-[34px] text-sm',
        className,
      )}
    >
      {children}
    </div>
  );
});

PanelHeader.displayName = 'PanelHeader';

export { PanelHeader };
