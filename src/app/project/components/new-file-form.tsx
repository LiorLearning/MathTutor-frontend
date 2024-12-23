import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { createFile } from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
      filename: path.split('/').pop() || 'new_file',
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
          <Input
            type="text"
            id="path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-muted-foreground">
            Content
          </label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1"
            rows={4}
            required
          />
        </div>
        <Button
          type="submit"
          className="inline-flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create File
        </Button>
      </div>
    </form>
  );
}