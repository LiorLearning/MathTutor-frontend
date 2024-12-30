import React, { Suspense } from 'react';
import { FallbackComponent } from "@/components/fallback";
import { App } from "./app";

export default function GamesPage() {
  return (
    <Suspense fallback={<FallbackComponent />}>
      <App />
    </Suspense>
  );
}
