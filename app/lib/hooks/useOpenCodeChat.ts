/**
 * Custom chat hook for OpenCode Web Agent
 * 
 * Replaces Vercel AI SDK's useChat hook.
 * Forwards messages to OpenCode Web Agent running in Daytona sandbox.
 */

import { useState } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
}

interface UseOpenCodeChatOptions {
  initialMessages?: Message[];
  onError?: (error: Error) => void;
  onFinish?: () => void;
}

export function useOpenCodeChat(options: UseOpenCodeChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>(options.initialMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const append = async (message: { role: 'user'; content: string }) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      // Forward to OpenCode Web Agent
      const response = await fetch('/api/opencode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.content }),
      });

      if (!response.ok) {
        throw new Error(`OpenCode Agent error: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: (data as any).response || (data as any).message || 'No response from agent',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      options.onFinish?.();
    } catch (error) {
      console.error('OpenCode chat error:', error);
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const stop = () => {
    // No-op for now (OpenCode doesn't support streaming abort yet)
    setIsLoading(false);
  };

  return {
    messages,
    isLoading,
    input,
    handleInputChange,
    setInput,
    append,
    stop,
  };
}
