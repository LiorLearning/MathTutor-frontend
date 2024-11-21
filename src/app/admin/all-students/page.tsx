'use client'

import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { FallbackComponent } from "@/components/fallback";
import { Header } from "@/components/header";
import { StudentList } from "@/app/admin/all-students/student-list";

const queryClient = new QueryClient();

export default function AllStudentsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={<FallbackComponent />}>
        <Header />
        <StudentList />
      </React.Suspense>
    </QueryClientProvider>
  );
}
