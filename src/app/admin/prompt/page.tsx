import { Header } from "@/components/header";
import { Suspense } from "react";
import { PromptManagerComponent } from "@/components/prompt-manager";

export default function StudentPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div>Loading...</div>}>
        <PromptManagerComponent />
      </Suspense>
    </>
  );
}
