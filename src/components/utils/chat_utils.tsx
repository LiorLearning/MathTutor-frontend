import Image from 'next/image'
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    audioUrl: string;
    timestamp: string;
    message_id: string;
    isImage?: boolean;
    isPlaying?: boolean;
}

export interface StartChatResponse {
    chat_id: string;
}

export type GetChatHistoryResponse = Message[];

export const ImageComponent: React.FC<{ src?: string; alt?: string; onLoad?: () => void }> = ({ src, alt, onLoad }) => {
    return (
        <Image
            src={src || ''}
            alt={alt || ''}
            width={300}
            height={300}
            className="rounded-lg"
            style={{ objectFit: 'contain', width: '80%', height: 'auto' }}
            onLoad={onLoad}
        />
    );
};

// Create a separate component for markdown images
const MarkdownImage: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
    const [isLoading, setIsLoading] = useState(true);

    const handleLoad = () => setIsLoading(false);

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            )}
            <Image
                src={src || ''}
                alt={alt || ''}
                width={300}
                height={300}
                className="rounded-lg"
                style={{ objectFit: 'contain', width: '80%', height: 'auto' }}
                onLoad={handleLoad}
            />
        </div>
    );
};

export const isWebSocketClosed = (webSocket: WebSocket): boolean => {
    return webSocket.readyState !== WebSocket.OPEN;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + 'api/v1/chat';
export const SPEECH_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + 'api/v1/speech';

export const MarkdownComponent: React.FC<{ content: string }> = ({ content }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
                h1: (props) => <h1 className="text-4xl font-bold my-4" {...props} />,
                h2: (props) => <h2 className="text-3xl font-bold my-3" {...props} />,
                h3: (props) => <h3 className="text-2xl font-bold my-2" {...props} />,
                p: (props) => <div className="" {...props} />,
                a: (props) => <a className="text-blue-200 underline" {...props} />,
                blockquote: (props) => <blockquote className="border-l-4 pl-4 italic text-gray-600" {...props} />,
                ul: (props) => <ul className="list-disc pl-5" {...props} />,
                ol: (props) => <ol className="list-decimal pl-5" {...props} />,
                br: () => <br key={Math.random()} />,
                img: (props) => <MarkdownImage {...props} />
            }}
        >
            {content}
        </ReactMarkdown>
    );
};