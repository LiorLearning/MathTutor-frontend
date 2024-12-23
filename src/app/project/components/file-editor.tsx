import React, { useState } from 'react';
import { File as FileIcon, Save, Trash2 } from 'lucide-react';
import { updateFile, deleteFile } from '../api';
import { File } from '../types';

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
    <div className="border rounded-lg p-4 mb-4 bg-card shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <FileIcon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{file.path}</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="p-2 text-primary hover:bg-accent rounded-full"
            disabled={!isEditing}
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-destructive hover:bg-destructive-foreground rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setIsEditing(true);
        }}
        className="w-full h-32 p-2 border rounded-md font-mono text-sm bg-input text-foreground"
      />
    </div>
  );
}