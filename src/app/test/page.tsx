'use client'

import React, { useState } from 'react';
import { AudioProvider, AudioStream } from '@/components/utils/audio_stream';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestPage: React.FC = () => {
  const [text, setText] = useState('');

  return (
    <AudioProvider>
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Test Audio Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <AudioStream text={text} setText={setText} />
          </CardContent>
        </Card>
      </div>
    </AudioProvider>
  );
};

export default TestPage;
