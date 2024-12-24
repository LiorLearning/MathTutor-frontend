'use client'

import React, { useEffect, useState } from 'react';
import { FileEditor } from '../components/file-editor';
import { NewFileForm } from '../components/new-file-form';
import { fetchProjectFiles } from '../../../components/project/api';
import type { File } from '../types';
import { useParams } from 'next/navigation';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const projectId = params?.id as string;

  const loadProjectFiles = async (projectId: string) => {
    try {
      setError(null);
      const project = await fetchProjectFiles(projectId);
      setFiles(project.files || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load project files:', error);
      setError('Failed to load project files. Please try again.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProjectFiles(projectId);
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button 
            onClick={() => loadProjectFiles(projectId)} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <NewFileForm
            projectId={projectId}
            onFileCreated={() => loadProjectFiles(projectId)}
          />

          <div className="space-y-4">
            {files.map((file) => (
              <FileEditor
                key={file.file_id}
                file={file}
                onUpdate={() => loadProjectFiles(projectId)}
                onDelete={() => loadProjectFiles(projectId)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;