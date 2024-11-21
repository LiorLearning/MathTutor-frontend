import { Header } from "@/components/header";
import { Suspense } from "react";
import { PromptManagerComponent } from "@/app/admin/prompt/prompt-manager";
import { FallbackComponent } from "@/components/fallback";

export default function StudentPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<FallbackComponent />}>
        <PromptManagerComponent />
      </Suspense>
    </>
  );
}
