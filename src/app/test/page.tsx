'use client'

import React from 'react'
import AudioSelector from '@/components/audio-selector'

export default function TestPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <main className="flex-1 w-full flex flex-col items-center justify-center">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex flex-col items-center justify-center">
          <div className="container px-4 md:px-6 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Test Audio Selector Component
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Below is the Audio Selector component for testing purposes.
                </p>
              </div>
              <div className="mt-8">
                <AudioSelector />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
