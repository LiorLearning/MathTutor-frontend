import { Header } from "@/components/header";
import { Suspense } from "react";
import { ManageStudentsComponent } from "@/components/manage-students";

export default function StudentPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div>Loading...</div>}>
        <ManageStudentsComponent />
      </Suspense>
    </>
  );
}
