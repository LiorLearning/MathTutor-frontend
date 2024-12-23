export interface Project {
  id: string;
  name: string;
  files: File[];
}

export interface File {
  file_id: string;
  content: string;
  path: string;
  project_id?: string;
}