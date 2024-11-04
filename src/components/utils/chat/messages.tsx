import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Pause, Volume2 } from 'lucide-react';
import { MarkdownComponent } from '@/components/utils/chat/chat_utils';

const USER = 'user';
const ASSISTANT = 'assistant';
const RETHINKING_MESSAGE = 'rethinking';
interface MessageComponentsProps {
  messages: any[];
  isLoadingMore: boolean;
  toggleAudio: (message: any) => void;
}

const MessageComponents: React.FC<MessageComponentsProps> = ({ messages, isLoadingMore, toggleAudio }) => {
  return useMemo(() => {
    return (
      <>
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
        {Array.isArray(messages) && messages.map((message, index) => (
          (message.role == USER || message.role == ASSISTANT) && (
          <div 
            key={message.message_id} 
            className="flex flex-col items-center justify-center h-full"
          >
            <div className={`max-w-[90%] ${message.role === USER ? 'self-end' : 'self-start'}`}>
              <div
                className={`rounded-3xl p-4 ${
                  message.role === USER
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-gray-800'
                } ${message.role === ASSISTANT && index === messages.length - 1 ? 'opacity-100' : ''}`}
              >
                {message.content === RETHINKING_MESSAGE && index === messages.length - 1 ? (
                  <div className="flex items-center justify-center bg-gray-50 rounded-lg px-32">
                    <motion.div
                      className="flex flex-col items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        className="text-lg font-medium text-gray-600"
                        initial={{ scale: 1 }}
                        animate={{ 
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        Rethinking...
                      </motion.div>
                      
                      {/* Subtle Dots Animation */}
                      <div className="flex gap-1"> {/* Reduced gap */}
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ 
                              scale: [0.8, 1.2, 0.8],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <>
                    <MarkdownComponent content={message.content} />
                  </>
                ) }
                
                {(message.role === ASSISTANT && !message.isImage) && (
                  <div className="mt-2 flex justify-end">
                    <Button 
                      size="sm"
                      variant="outline"
                      className="rounded px-2 py-1"
                      onClick={() => toggleAudio(message)}
                    >
                      {message.isPlaying ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
          )
        ))}
      </>
    );
  }, [messages, toggleAudio, isLoadingMore]);
};

export default MessageComponents;

