import React from 'react';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface InputBarProps {
  onSendMessage: (message: string) => void;
}

const InputBar: React.FC<InputBarProps> = ({ onSendMessage }) => {
  const [textInput, setTextInput] = React.useState("");

  const handleTextSend = () => {
    if (textInput.trim() === "") return; // Prevent sending empty messages
    onSendMessage(textInput);
    setTextInput(""); // Clear the input after sending
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder="Type"
        className="w-full h-12 text-black dark:text-foreground placeholder-gray-400 dark:placeholder-muted-foreground rounded-2xl px-4 py-3 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-gray-600 dark:focus:ring-muted-foreground border border-gray-600 dark:border-muted-foreground"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleTextSend();
          }
        }}
      />
      <button
        onClick={handleTextSend}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground hover:text-black dark:hover:text-foreground transition-colors"
        aria-label="Send message"
      >
        <Send size={20} />
      </button>
    </div>
  );
};

export default InputBar;
