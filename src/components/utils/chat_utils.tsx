export interface Message {
    role: 'user' | 'assistant';
    content: string;
    audioUrl: string; // Added audioUrl to store audio
    timestamp: string;
    message_id: string;
    isPlaying?: boolean; // Added isPlaying to track audio state per message
}
  
export interface StartChatResponse {
    chat_id: string;
}
  
export type GetChatHistoryResponse = Message[];
  
export interface ImageProps {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties;
}
  
export const imageProps: ImageProps = {
    src: 'https://example.com/image.jpg', // Replace with your image URL
    alt: 'Description of the image',
    width: 500,
    height: 300,
    className: 'rounded-lg',
    style: { objectFit: 'contain', width: '100%', height: 'auto' },
};

export const isWebSocketClosed = (webSocket: WebSocket): boolean => {
    return webSocket.readyState !== WebSocket.OPEN;
}

  
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + 'api/v1/chat';
export const SPEECH_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + 'api/v1/speech';