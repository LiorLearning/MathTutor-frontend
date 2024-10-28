import Image from 'next/image'
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

declare global {
    interface Window {
        MathJax: any;
    }
}

export interface Message {
    role: 'user' | 'assistant' | 'correction' | 'admin';
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
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.body.appendChild(script);
    
        script.onload = () => {
            (window.MathJax as any).Hub.Config({
                tex2jax: {
                    inlineMath: [['$', '$'], ['\\$$', '\\$$']],
                    displayMath: [['$$', '$$'], ['\\[', '\\]']],
                    processEscapes: true,
                },
            });
            (window.MathJax as any).Hub.Queue(['Typeset', (window.MathJax as any).Hub]);
        };
    
        return () => {
            document.body.removeChild(script);
        };
    }, [content]);

    return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: (props) => <h1 className="text-4xl font-bold my-4" {...props} />,
            h2: (props) => <h2 className="text-3xl font-semibold my-3" {...props} />,
            h3: (props) => <h3 className="text-2xl font-medium my-2" {...props} />,
            h4: (props) => <h4 className="text-xl font-medium my-1.5" {...props} />,
            h5: (props) => <h5 className="text-lg font-medium my-1" {...props} />,
            h6: (props) => <h6 className="text-base font-medium my-1" {...props} />,
            p: (props) => <p className="my-2" {...props} />,
            a: (props) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
            ul: (props) => <ul className="list-disc pl-6 my-2" {...props} />,
            ol: (props) => <ol className="list-decimal pl-6 my-2" {...props} />,
            li: (props) => <li className="my-0.5" {...props} />,
            blockquote: (props) => <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-2 italic" {...props} />,
            img: (props) => <MarkdownImage src={props.src} alt={props.alt} />,
            pre: (props) => <pre className="my-2" {...props} />,
            table: (props) => <table className="border-collapse table-auto w-full my-2" {...props} />,
            th: (props) => <th className="border border-gray-300 dark:border-gray-600 px-4 py-1 text-left" {...props} />,
            td: (props) => <td className="border border-gray-300 dark:border-gray-600 px-4 py-1" {...props} />,
          }}
          className="prose dark:prose-invert max-w-none"
        >
          {content}
        </ReactMarkdown>
    );
};