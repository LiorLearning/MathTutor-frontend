'use client'

import { useStore } from '@nanostores/react';
import { easeInOut, motion, type Variants } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useCallback, useEffect, useState } from 'react';
import {
  type OnChangeCallback as OnEditorChange,
  type OnScrollCallback as OnEditorScroll,
} from '@/components/bolt/components/codemirror/CodeMirrorEditor';
import { IconButton } from '@/components/bolt/components/ui/IconButton';

import { Slider, type SliderOptions } from '@/components/bolt/components/ui/Slider';
import { workbenchStore, type WorkbenchViewType } from '@/components/bolt/lib/stores/workbench';

import { classNames } from '@/components/bolt/utils/classNames'
import { renderLogger } from '@/components/bolt/utils/logger';
import EditorPanel from './EditorPanel';
import { Preview } from './Preview';
import { useAdminWebSocket } from '@/components/bolt/components/websocket/admin';
import { FileMap } from '../../lib/stores/files';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { fetchProjects } from '@/components/project/api';
import { Project } from '@/app/project/types';

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

const WorkbenchComponent = ({ chatStarted, isStreaming }: WorkspaceProps) => {
  renderLogger.trace('Workbench');

  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

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

  const onSetupBaseCode = useCallback(async () => {
    await workbenchStore.setupBaseCode();
  }, []);

  const onSelectGame = useCallback(async () => {
    try {
      const fetchedProjects = await fetchProjects();
      setProjects(fetchedProjects);
      setIsProjectDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  }, []);

  const handleProjectSelect = useCallback(async (projectId: string) => {
    await workbenchStore.selectGame(projectId);
    setIsProjectDialogOpen(false);
  }, []);

  const sendFilesToWebSocket = useCallback(() => {
    const fileMap = Object.entries(files).reduce((acc, [fileName, fileData]) => {
      if (fileData) {
        if (!fileName.includes('.next')) {
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
      }
      return acc;
    }, {} as FileMap);

    sendJsonMessage({ role: 'files', content: fileMap });
  }, [files, sendJsonMessage]);

  const clearUserScreen = useCallback(() => {
    sendJsonMessage({ role: 'clear' });
  }, [sendJsonMessage]);

  return (
    <>
      {chatStarted && (
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        className="mr-1 text-sm flex items-center gap-1.5 px-1.5 rounded-md py-0.5 text-bolt-elements-item-contentDefault bg-transparent enabled:hover:text-bolt-elements-item-contentActive enabled:hover:bg-bolt-elements-item-backgroundActive"
                      >
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuGroup>
                      <DropdownMenuItem 
                          onSelect={() => onSelectGame()}
                          className="cursor-pointer"
                        >
                          Select Game
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onSelect={onSetupBaseCode}
                          className="cursor-pointer"
                        >
                          Setup Base Code
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onSelect={sendFilesToWebSocket}
                          className="cursor-pointer"
                        >
                          Send Files
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onSelect={clearUserScreen}
                          className="cursor-pointer"
                        >
                          Clear User Window
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
      )}

      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Project</DialogTitle>
            <DialogDescription>Choose a project to work on</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {projects.map((project) => (
              <Button 
                key={project.project_id} 
                onClick={() => handleProjectSelect(project.project_id)}
                className="w-full"
              >
                {project.project_name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const Workbench = memo(WorkbenchComponent);