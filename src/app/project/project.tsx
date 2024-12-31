import React, { useState, useEffect } from 'react';
import { ProjectForm } from './components/project-form';
import { fetchProjects, deleteProject } from '../../components/project/api';
import type { Project } from './types';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedProjects = await fetchProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      toast({
        title: 'Failed to Load Projects',
        description: 'Unable to retrieve project list. Please try again later.',
        variant: 'destructive'
      });
      console.error('Failed to load projects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDeleteProject = async (project: Project) => {
    setProjectToDelete(project);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteProject(projectToDelete.project_id);
      loadProjects();
    } catch (error) {
      toast({
        title: 'Failed to delete project',
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      console.error('Failed to delete project:', error);
    } finally {
      setProjectToDelete(null);
    }
  };

  const handleProjectCreated = () => {
    loadProjects();
    setSelectedProject(undefined);
    setIsProjectDialogOpen(false);
  };

  const handleProjectUpdated = () => {
    loadProjects();
    setSelectedProject(undefined);
    setIsProjectDialogOpen(false);
  };

  const openProjectDialog = (project?: Project) => {
    setSelectedProject(project);
    setIsProjectDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Project Manager</h1>
          <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openProjectDialog()}>
                <Plus className="h-4 w-4 mr-2" /> Create Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
              </DialogHeader>
              <ProjectForm 
                project={selectedProject} 
                onProjectCreated={handleProjectCreated}
                onProjectUpdated={handleProjectUpdated}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
              <p>{error}</p>
              <Button 
                variant="outline" 
                onClick={loadProjects}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="bg-muted/50 p-8 rounded-lg text-center">
              <p className="text-muted-foreground">No projects found. Create your first project!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div 
                  key={project.project_id} 
                  className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => window.location.assign(`/project/${project.project_id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-medium mb-2">{project.project_name}</h3>
                      <p className="text-muted-foreground">{project.description}</p>
                    </div>
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => openProjectDialog(project)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleDeleteProject(project)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the project &quot;{projectToDelete?.project_name}&quot;.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}