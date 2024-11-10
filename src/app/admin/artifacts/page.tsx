'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/header";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Student, MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils'
import HtmlList from '@/components/html-card';

interface Artifact {
    userid: string;
    file_path: string;
    name: string;
    desc: string;
    created_at: string;
}

export default function AllStudentsArtifactsPage() {
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [users, setUsers] = useState<Student[]>([]);
  const [htmlFiles, setHtmlFiles] = useState<Artifact[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get<Student[]>(`${MODEL_API_BASE_URL}/users/`);
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchArtifacts = async () => {
      if (selectedUser) {
        try {
          const response = await axios.get<Artifact[]>(`${MODEL_API_BASE_URL}/artifacts/user/${selectedUser}/`);
          setHtmlFiles(response.data);
        } catch (error) {
          console.error('Error fetching artifacts for user:', error);
        }
      }
    };

    fetchArtifacts();
  }, [selectedUser]);

  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">HTML File Viewer</h1>
        <Select onValueChange={setSelectedUser} value={selectedUser}>
          <SelectTrigger className="w-full mb-4">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.userid} value={user.userid}>
                {user.first_name} {user.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedUser && (
          <HtmlList artifacts={htmlFiles.filter(file => file.userid === selectedUser).map(file => ({
            url: `${file.file_path}`,
            name: file.name,
            desc: file.desc
          }))} />
        )}
      </div>
    </>
  );
}
