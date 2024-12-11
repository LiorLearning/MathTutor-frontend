import dynamic from 'next/dynamic';
import { forwardRef, memo } from 'react';
import type { Theme } from '@/components/bolt/lib/stores/theme';

export interface TerminalRef {
  reloadStyles: () => void;
}

export interface TerminalProps {
  className?: string;
  theme: Theme;
  readonly?: boolean;
  onTerminalReady?: (terminal: any) => void;
  onTerminalResize?: (cols: number, rows: number) => void;
}

// This component will only be rendered on the client
const TerminalComponent = dynamic(
  () => import('./TerminalClient'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100" /> 
  }
);

export const Terminal = memo(
  forwardRef<TerminalRef, TerminalProps>((props, ref) => {
    return <TerminalComponent {...props} ref={ref} />;
  })
);

export default Terminal;