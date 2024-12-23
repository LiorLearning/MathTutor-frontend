export interface Project {
  project_id: string;
  project_name: string;
  files: File[];
}

export interface File {
  file_id: string;
  filename: string;
  content: string;
  path: string;
  project_id?: string;
}