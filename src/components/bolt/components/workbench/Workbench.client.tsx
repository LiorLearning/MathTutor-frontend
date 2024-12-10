'use client'

import { useStore } from '@nanostores/react';
import { easeInOut, motion, type Variants } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect } from 'react';
import {
  type OnChangeCallback as OnEditorChange,
  type OnScrollCallback as OnEditorScroll,
} from '@/components/bolt/components/codemirror/CodeMirrorEditor';
import { IconButton } from '@/components/bolt/components/ui/IconButton';

import { PanelHeaderButton } from '@/components/bolt/components/ui/PanelHeaderButton';
import { Slider, type SliderOptions } from '@/components/bolt/components/ui/Slider';
import { workbenchStore, type WorkbenchViewType } from '@/components/bolt/lib/stores/workbench';

import { classNames } from '@/components/bolt/utils/classNames'
import { renderLogger } from '@/components/bolt/utils/logger';
import { EditorPanel } from './EditorPanel';
import { Preview } from './Preview';
import { useAdminWebSocket } from '@/components/bolt/components/websocket/admin';
import { FileMap } from '../../lib/stores/files';

interface WorkspaceProps {
  chatStarted?: boolean;
  isStreaming?: boolean;
}

const viewTransition = { ease: easeInOut };

const sliderOptions: SliderOptions<WorkbenchViewType> = {
  left: {
    value: 'code',
    text: 'Code',
  },
  right: {
    value: 'preview',
    text: 'Preview',
  },
};

const workbenchVariants = {
  closed: {
    width: 0,
    transition: {
      duration: 0.2,
      ease: easeInOut,
    },
  },
  open: {
    width: 'var(--workbench-width)',
    transition: {
      duration: 0.2,
      ease: easeInOut,
    },
  },
} satisfies Variants;

export const Workbench = memo(({ chatStarted, isStreaming }: WorkspaceProps) => {
  renderLogger.trace('Workbench');

  const hasPreview = useStore(computed(workbenchStore.previews, (previews) => previews.length > 0));
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const selectedFile = useStore(workbenchStore.selectedFile);
  const currentDocument = useStore(workbenchStore.currentDocument);
  const unsavedFiles = useStore(workbenchStore.unsavedFiles);
  const files = useStore(workbenchStore.files);
  const selectedView = useStore(workbenchStore.currentView);
  const adminWebSocketContext = useAdminWebSocket();
  const sendJsonMessage = adminWebSocketContext ? adminWebSocketContext.sendJsonMessage : () => {
    console.error('WebSocket context is not available');
  };

  const setSelectedView = (view: WorkbenchViewType) => {
    workbenchStore.currentView.set(view);
  };

  useEffect(() => {
    if (hasPreview) {
      setSelectedView('preview');
    }
  }, [hasPreview]);

  useEffect(() => {
    workbenchStore.setDocuments(files);
  }, [files]);

  const onEditorChange = useCallback<OnEditorChange>((update) => {
    workbenchStore.setCurrentDocumentContent(update.content);
  }, []);

  const onEditorScroll = useCallback<OnEditorScroll>((position) => {
    workbenchStore.setCurrentDocumentScrollPosition(position);
  }, []);

  const onFileSelect = useCallback((filePath: string | undefined) => {
    workbenchStore.setSelectedFile(filePath);
  }, []);

  const onFileSave = useCallback(() => {
    workbenchStore.saveCurrentDocument().catch(() => {
      console.error('Failed to update file content');
    });
  }, []);

  const onFileReset = useCallback(() => {
    workbenchStore.resetCurrentDocument();
  }, []);

  const sendFilesToWebSocket = useCallback(() => {
    const fileMap = Object.entries(files).reduce((acc, [fileName, fileData]) => {
      if (fileData) {
        if (fileData.type === 'file') {
          acc[fileName] = {
            type: 'file',
            content: fileData.content,
            isBinary: fileData.isBinary,
          };
        } else if (fileData.type === 'folder') {
          acc[fileName] = {
            type: 'folder',
          };
        }
      }
      return acc;
    }, {} as FileMap);

    sendJsonMessage({ role: 'files', content: fileMap });
  }, [files, sendJsonMessage]);

  return (
    chatStarted && (
      <motion.div
        initial="closed"
        animate={showWorkbench ? 'open' : 'closed'}
        variants={workbenchVariants}
        className="z-workbench h-full w-full"
      >
        <div
          className={classNames(
            'flex w-full h-full transition-[left,width] duration-200 bolt-ease-cubic-bezier',
          )}
        >
          <div className="relative w-full h-full">
            <div className="h-full flex flex-col bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor shadow-sm rounded-lg overflow-hidden">
              <div className="flex items-center px-3 py-2 border-b border-bolt-elements-borderColor">
                <Slider selected={selectedView} options={sliderOptions} setSelected={setSelectedView} />
                <div className="ml-auto" />
                {selectedView === 'code' && (
                  <>
                    <PanelHeaderButton
                      className="mr-1 text-sm"
                      onClick={() => {
                        workbenchStore.toggleTerminal(!workbenchStore.showTerminal.get());
                      }}
                    >
                      <div className="i-ph:terminal" />
                      Toggle Terminal
                    </PanelHeaderButton>
                  </>
                )}
                <PanelHeaderButton
                  className="mr-1 text-sm"
                  onClick={sendFilesToWebSocket}
                >
                  <div className="i-ph:upload" />
                  Send Files
                </PanelHeaderButton>
                <IconButton
                  icon="i-ph:x-circle"
                  className="-mr-1"
                  size="xl"
                  onClick={() => {
                    workbenchStore.showWorkbench.set(false);
                  }}
                />
              </div>
              <div className="relative flex-1 overflow-hidden">
                <div className="absolute inset-0 flex">
                  <motion.div
                    className="w-full h-full absolute"
                    animate={{
                      x: selectedView === 'code' ? 0 : '-100%',
                      opacity: selectedView === 'code' ? 1 : 0,
                      pointerEvents: selectedView === 'code' ? 'auto' : 'none',
                    }}
                    transition={viewTransition}
                  >
                    <EditorPanel
                      editorDocument={currentDocument}
                      isStreaming={isStreaming}
                      selectedFile={selectedFile}
                      files={files}
                      unsavedFiles={unsavedFiles}
                      onFileSelect={onFileSelect}
                      onEditorScroll={onEditorScroll}
                      onEditorChange={onEditorChange}
                      onFileSave={onFileSave}
                      onFileReset={onFileReset}
                    />
                  </motion.div>
                  <motion.div
                    className="w-full h-full absolute"
                    animate={{
                      x: selectedView === 'preview' ? 0 : '100%',
                      opacity: selectedView === 'preview' ? 1 : 0,
                      pointerEvents: selectedView === 'preview' ? 'auto' : 'none',
                    }}
                    transition={viewTransition}
                  >
                    <Preview />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  );
});