import React, { useState } from 'react';
import { File as FileIcon, Save, Trash2 } from 'lucide-react';
import { updateFile, deleteFile } from '../api';
import { File } from '../types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

interface FileEditorProps {
  file: File;
  onUpdate: () => void;
  onDelete: () => void;
}

export function FileEditor({ file, onUpdate, onDelete }: FileEditorProps) {
  const [content, setContent] = useState(file.content);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    await updateFile(file.file_id, content);
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
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{file.path}</span>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleSave}
            variant="outline"
            disabled={!isEditing}
          >
            <Save className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setIsEditing(true);
          }}
          className="w-full h-32 font-mono text-sm"
        />
      </CardContent>
    </Card>
  );
}