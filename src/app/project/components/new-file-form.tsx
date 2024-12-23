import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { createFile } from '../api';

interface NewFileFormProps {
  projectId: string;
  onFileCreated: () => void;
}

export function NewFileForm({ projectId, onFileCreated }: NewFileFormProps) {
  const [path, setPath] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFile({
      path,
      content,
      project_id: projectId,
    });
    setPath('');
    setContent('');
    onFileCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-card p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">New File</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="path" className="block text-sm font-medium text-muted-foreground">
            File Path
          </label>
          <input
            type="text"
            id="path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary"
            required
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-muted-foreground">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary font-mono"
            rows={4}
            required
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create File
        </button>
      </div>
    </form>
  );
}