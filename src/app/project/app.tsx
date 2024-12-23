import React, { useEffect, useState } from 'react';
import { FileEditor } from './components/file-editor';
import { NewFileForm } from './components/new-file-form';
import { ChevronDown } from 'lucide-react';
import { fetchProjects, fetchProjectFiles } from './api';
import type { Project, File } from './types';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectFiles(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const projectList = await fetchProjects();
      setProjects(projectList);
      if (projectList.length > 0) {
        setSelectedProject(projectList[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectFiles = async (projectId: string) => {
    try {
      const project = await fetchProjectFiles(projectId);
      setFiles(project.files || []);
    } catch (error) {
      console.error('Failed to load project files:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="relative">
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                setSelectedProject(project || null);
              }}
              className="block w-full pl-3 pr-10 py-2 text-base border border-muted focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md appearance-none bg-white"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {selectedProject && (
          <>
            <NewFileForm
              projectId={selectedProject.id}
              onFileCreated={() => loadProjectFiles(selectedProject.id)}
            />

            <div className="space-y-4">
              {files.map((file) => (
                <FileEditor
                  key={file.file_id}
                  file={file}
                  onUpdate={() => loadProjectFiles(selectedProject.id)}
                  onDelete={() => loadProjectFiles(selectedProject.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;