import React, { Suspense } from 'react';
import { Base } from "./base";
import { FallbackComponent } from '@/components/fallback';

export default function HomePage() {
  return (
    <Suspense fallback={<FallbackComponent />}>
      <Base />
    </Suspense>
  );
}
