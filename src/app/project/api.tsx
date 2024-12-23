import { Project, File } from "./types";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1/project`;

export async function fetchProjects(): Promise<Project[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/projects/`);
    return response.data as Project[];
  } catch (error) {
    console.error(`Failed to fetch projects: ${error}`);
    throw new Error('Failed to fetch projects');
  }
}

export async function fetchProjectFiles(projectId: string): Promise<Project> {
  try {
    // First get the project to get list of file IDs
    const projectResponse = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
    const project = projectResponse.data as Project;

    // Then fetch all files
    const filePromises = project.files.map(fileId => 
      axios.get(`${API_BASE_URL}/files/${fileId}`)
    );
    const fileResponses = await Promise.all(filePromises);
    
    // Add files array to project
    return {
      ...project,
      files: fileResponses.map(response => response.data as File)
    };
  } catch (error) {
    console.error(`Failed to fetch project files: ${error}`);
    throw new Error('Failed to fetch project files');
  }
}

export async function createFile(file: Omit<File, 'file_id'>): Promise<File> {
  try {
    const response = await axios.post(`${API_BASE_URL}/files/`, file);
    return response.data as File;
  } catch (error) {
    console.error(`Failed to create file: ${error}`);
    throw new Error('Failed to create file');
  }
}

export async function updateFile(fileId: string, content: string, path?: string): Promise<File> {
  try {
    const response = await axios.put(`${API_BASE_URL}/files/${fileId}`, { content, path });
    return response.data as File;
  } catch (error) {
    console.error(`Failed to update file: ${error}`);
    throw new Error('Failed to update file');
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  try {
    const response = await axios.delete(`${API_BASE_URL}/files/${fileId}`);
    return response.data as void;
  } catch (error) {
    console.error(`Failed to delete file: ${error}`);
    throw new Error('Failed to delete file');
  }
}