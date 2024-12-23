import React, { useEffect, useState } from 'react';
import { FileEditor } from './components/file-editor';
import { NewFileForm } from './components/new-file-form';
import { ChevronDown } from 'lucide-react';
import { fetchProjects, fetchProjectFiles } from './api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project, File } from './types';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const projectList = await fetchProjects();
      
      if (projectList.length === 0) {
        setError('No projects found');
        return;
      }
      
      setProjects(projectList);
      setSelectedProject(projectList[0]);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectFiles = async (projectId: string) => {
    try {
      setError(null);
      const project = await fetchProjectFiles(projectId);
      setFiles(project.files || []);
    } catch (error) {
      console.error('Failed to load project files:', error);
      setError('Failed to load project files. Please try again.');
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectFiles(selectedProject.project_id);
    }
  }, [selectedProject]);

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
            onClick={loadProjects} 
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
          <Select
            value={selectedProject?.project_id || ''}
            onValueChange={(value) => {
              const project = projects.find(p => p.project_id === value);
              setSelectedProject(project || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project">
                {selectedProject ? selectedProject.project_name : "Select a project"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.project_id} value={project.project_id}>
                  {project.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProject && (
            <>
              <NewFileForm
                projectId={selectedProject.project_id}
                onFileCreated={() => loadProjectFiles(selectedProject.project_id)}
              />

              <div className="space-y-4">
                {files.map((file) => (
                  <FileEditor
                    key={file.file_id}
                    file={file}
                    onUpdate={() => loadProjectFiles(selectedProject.project_id)}
                    onDelete={() => loadProjectFiles(selectedProject.project_id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;