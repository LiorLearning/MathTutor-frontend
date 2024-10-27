'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { FileIcon, Maximize2Icon } from 'lucide-react'
import { Header } from "@/components/header";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Student, MODEL_API_BASE_URL } from '@/components/utils/admin_utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"


interface Artifact {
    userid: string;
    file_path: string;
    name: string;
    desc: string;
    created_at: string;
}

export default function AllStudentsPage() {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {htmlFiles.filter(file => file.userid === selectedUser).map((file) => (
              <Card key={file.file_path} className="overflow-hidden max-w-xs"> {/* Make the card smaller */}
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileIcon className="mr-2" />
                    {file.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full p-0 h-auto hover:opacity-80 transition-opacity">
                        <Image
                          src={`/placeholder.svg?height=200&width=300&text=${encodeURIComponent(file.name)}`}
                          alt={`Preview of ${file.name}`}
                          width={300}
                          height={200}
                          className="w-full h-auto"
                        />
                        <span className="sr-only">View larger image of {file.name}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl"> {/* Adjusted max width */}
                      <DialogHeader>
                        <DialogTitle>{file.name}</DialogTitle>
                      </DialogHeader>
                      <Image
                        src={`/placeholder.svg?height=400&width=600&text=${encodeURIComponent(file.name)}`}
                        alt={`Large preview of ${file.name}`}
                        width={600}
                        height={400}
                        className="w-full h-auto"
                      />
                    </DialogContent>
                  </Dialog>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <Button asChild variant="ghost" size="sm">
                    <a href={process.env.NEXT_PUBLIC_API_BASE_URL + file.file_path} target="_blank" rel="noopener noreferrer" className="flex items-center">
                      View HTML
                      <Maximize2Icon className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
