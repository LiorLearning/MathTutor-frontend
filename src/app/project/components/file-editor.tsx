import React, { useState } from 'react';
import { File as FileIcon, Save, Trash2, Expand } from 'lucide-react';
import { updateFile, deleteFile } from '../api';
import { File } from '../types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

interface FileEditorProps {
  file: File;
  onUpdate: () => void;
  onDelete: () => void;
}

export function FileEditor({ file, onUpdate, onDelete }: FileEditorProps) {
  const [content, setContent] = useState(file.content);
  const [path, setPath] = useState(file.path);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = async () => {
    await updateFile(file.file_id, {
      content: content,
      filename: file.filename,
      path: path,
      project_id: file.project_id
    });
    setIsEditing(false);
    onUpdate();
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile(file.file_id);
      onDelete();
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileIcon className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">{file.filename}</span>
            <span className="text-xs text-muted-foreground">{file.path}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            size="icon"
          >
            <Expand className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleSave}
            variant="outline"
            disabled={!isEditing}
            size="icon"
          >
            <Save className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            size="icon"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="path" className="block text-sm font-medium text-muted-foreground mb-1">
              File Path
            </label>
            <Input
              id="path"
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
                setIsEditing(true);
              }}
              className="w-full"
            />
          </div>
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setIsEditing(true);
            }}
            className="w-full font-mono text-sm h-96"
          />
        </CardContent>
      )}
    </Card>
  );
}