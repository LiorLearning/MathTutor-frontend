import { Project, File } from "../../app/project/types";
import axios from 'axios';
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}api/v1`;

export async function fetchProjects(): Promise<Project[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/projects/`);
    return response.data as Project[];
  } catch (error) {
    console.error(`Failed to fetch projects: ${error}`);
    throw error;
  }
}

export async function createProject(project: Omit<Project, 'project_id'>): Promise<Project> {
  try {
    const response = await axios.post(`${API_BASE_URL}/projects/`, project);
    return response.data as Project;
  } catch (error) {
    console.error(`Failed to create project: ${error}`);
    throw error;
  }
}

export async function updateProject(projectId: string, project: Omit<Project, 'project_id'>): Promise<Project> {
  try {
    const response = await axios.put(`${API_BASE_URL}/projects/${projectId}`, project);
    return response.data as Project;
  } catch (error) {
    console.error(`Failed to update project: ${error}`);
    throw error;
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  try {
    const response = await axios.delete(`${API_BASE_URL}/projects/${projectId}`);
    return response.data as void;
  } catch (error) {
    console.error(`Failed to delete project: ${error}`);
    throw error;
  }
}


interface ProjectFilesResponse {
  project_details: Project;
  files: File[];
}

export async function fetchProjectFiles(projectId: string): Promise<ProjectFilesResponse> {
  try {
    // Fetch files and project details using the project/id/files endpoint
    const response = await axios.get<ProjectFilesResponse>(`${API_BASE_URL}/projects/${projectId}/files`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch project files: ${error}`);
    throw error;
  }
}

export async function createFile(file: Omit<File, 'file_id'>): Promise<File> {
  try {
    const response = await axios.post(`${API_BASE_URL}/files/`, file);
    return response.data as File;
  } catch (error) {
    console.error(`Failed to create file: ${error}`);
    throw error;
  }
}
export async function updateFile(fileId: string, file: Omit<File, 'file_id'>): Promise<File> {
  try {
    const response = await axios.put(`${API_BASE_URL}/files/${fileId}`, file);
    return response.data as File;
  } catch (error) {
    console.error(`Failed to update file: ${error}`);
    throw error;
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  try {
    const response = await axios.delete(`${API_BASE_URL}/files/${fileId}`);
    return response.data as void;
  } catch (error) {
    console.error(`Failed to delete file: ${error}`);
    throw error;
  }
}