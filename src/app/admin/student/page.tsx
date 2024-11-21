import { Header } from "@/components/header";
import { Suspense } from "react";
import { ManageStudentsComponent } from "@/app/admin/student/manage-students";
import { FallbackComponent } from "@/components/fallback";

export default function StudentPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<FallbackComponent />}>
        <ManageStudentsComponent />
      </Suspense>
    </>
  );
}
