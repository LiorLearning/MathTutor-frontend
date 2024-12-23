import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createProject, updateProject } from '../api';
import { Project } from '../types';

interface ProjectFormProps {
  project?: Project;
  onProjectCreated?: () => void;
  onProjectUpdated?: () => void;
}

export function ProjectForm({ 
  project, 
  onProjectCreated, 
  onProjectUpdated 
}: ProjectFormProps) {
  const [projectName, setProjectName] = useState(project?.project_name || '');
  const [description, setDescription] = useState(project?.description || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (project) {
        // Update existing project
        await updateProject(project.project_id, {
          project_name: projectName,
          description: description,
          files: project.files || []
        });
        onProjectUpdated?.();
      } else {
        // Create new project
        await createProject({
          project_name: projectName,
          description,
          files: []
        });
        onProjectCreated?.();
      }

      // Reset form
      setProjectName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-card p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">
        {project ? 'Edit Project' : 'New Project'}
      </h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-muted-foreground">
            Project Name
          </label>
          <Input
            type="text"
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-muted-foreground">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1"
            rows={4}
            required
          />
        </div>
        <Button type="submit" className="inline-flex items-center">
          {project ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
