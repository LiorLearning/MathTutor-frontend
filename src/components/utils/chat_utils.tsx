export interface Message {
    role: 'user' | 'assistant';
    content: string;
    audioUrl?: string; // Added audioUrl to store audio
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
  
export const MyImageComponent: React.FC<ImageProps> = ({ src, alt, width, height, className, style }) => {
    return (
        <img
            src={src}
            alt={alt || ''}
            width={width || 500}
            height={height || 300}
            className={`rounded-lg ${className}`}
            style={style}
        />
    );
};
  
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + 'api/v1/chat';
export const SPEECH_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL + 'api/v1/speech';
export const WS_END_SIGNAL = "WS_END_SIGNAL";