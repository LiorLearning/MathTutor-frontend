import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal as XTerm } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css'
import { 
  forwardRef, 
  memo, 
  useEffect, 
  useImperativeHandle, 
  useRef,
  useState
} from 'react';
import type { Theme } from '@/components/bolt/lib/stores/theme';
import { getTerminalTheme } from './theme';

export interface TerminalRef {
  reloadStyles: () => void;
}

export interface TerminalProps {
  className?: string;
  theme: Theme;
  readonly?: boolean;
  onTerminalReady?: (terminal: XTerm) => void;
  onTerminalResize?: (cols: number, rows: number) => void;
}

const TerminalClient = memo(
  forwardRef<TerminalRef, TerminalProps>(
    ({ className, theme, readonly, onTerminalReady, onTerminalResize }, ref) => {
      const terminalElementRef = useRef<HTMLDivElement>(null);
      const terminalRef = useRef<XTerm>();
      const fitAddonRef = useRef<FitAddon>();
      const [isInitialized, setIsInitialized] = useState(false);

      useEffect(() => {
        const element = terminalElementRef.current;
        if (!element) return;

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        let terminal: XTerm | null = null;
        try {
          terminal = new XTerm({
            cursorBlink: true,
            convertEol: true,
            disableStdin: readonly,
            theme: getTerminalTheme(readonly ? { cursor: '#00000000' } : {}),
            fontSize: 12,
            fontFamily: 'Menlo, courier-new, courier, monospace',
          });
        } catch (error) {
          if (error instanceof RangeError) {
            console.error('Failed to create terminal instance due to memory allocation issue:', error);
          } else {
            console.error('Failed to create terminal instance:', error);
          }
          return;
        }

        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;

        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        
        // Ensure terminal is fully opened and rendered
        terminal.open(element);

        // Delayed and safer initial fit
        const safeResize = () => {
          try {
            // Additional checks to ensure terminal is fully ready
            if (terminal?.element && fitAddon) {
              // Wait a bit longer and ensure element is in the DOM
              requestAnimationFrame(() => {
                try {
                  fitAddon.fit();
                  setIsInitialized(true);
                  onTerminalResize?.(terminal.cols, terminal.rows);
                } catch (error) {
                  console.warn('Terminal fit failed:', error);
                }
              });
            }
          } catch (error) {
            console.warn('Terminal resize preparation failed:', error);
          }
        };

        // Multiple strategies to ensure resize
        const resizeTimeout = setTimeout(safeResize, 200);
        window.addEventListener('resize', safeResize);

        // Resize observer
        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => {
            if (isInitialized) {
              safeResize();
            }
          });
          resizeObserver.observe(element);
        }

        onTerminalReady?.(terminal);

        return () => {
          clearTimeout(resizeTimeout);
          window.removeEventListener('resize', safeResize);
          if (resizeObserver) {
            resizeObserver.disconnect();
          }
          terminal.dispose();
        };
      }, [readonly, onTerminalResize, onTerminalReady]);

      useEffect(() => {
        const terminal = terminalRef.current;
        if (!terminal) return;

        // Update terminal options
        terminal.options.theme = getTerminalTheme(
          readonly ? { cursor: '#00000000' } : {}
        );
        terminal.options.disableStdin = !!readonly;
      }, [theme, readonly]);

      useImperativeHandle(ref, () => ({
        reloadStyles: () => {
          const terminal = terminalRef.current;
          const fitAddon = fitAddonRef.current;
          if (terminal && fitAddon) {
            terminal.options.theme = getTerminalTheme(
              readonly ? { cursor: '#00000000' } : {}
            );
            
            // Ensure fit is called safely
            requestAnimationFrame(() => {
              try {
                fitAddon.fit();
              } catch (error) {
                console.warn('Reload styles fit failed:', error);
              }
            });
          }
        },
      }), [readonly]);

      return <div className={className} ref={terminalElementRef} />;
    }
  )
);

export default TerminalClient;