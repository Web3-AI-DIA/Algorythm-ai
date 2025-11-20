'use client';

import { useState } from 'react';
import { Bot, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { answerQuestion } from '@/ai/flows/help-assistant';

interface Message {
  text: string;
  isUser: boolean;
}

export function HelpAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! How can I help you with Algorythm AI today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await answerQuestion(input);
      const botMessage: Message = { text: result.answer, isUser: false };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting answer:", error);
      const errorMessage: Message = {
        text: "Sorry, I'm having trouble connecting. For complex issues, please email support@algorythmai.xyz.",
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px] flex flex-col h-[70vh]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bot />
          Help Assistant
        </DialogTitle>
        <DialogDescription>
          Ask me anything about the platform. For complex issues, I'll direct you to support.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="flex-1 my-4 pr-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.isUser ? 'justify-end' : ''
              }`}
            >
              {!message.isUser && (
                <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground">
                  <Bot size={20} />
                </div>
              )}
              <div
                className={`rounded-lg p-3 max-w-[80%] text-sm ${
                  message.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground">
                <Bot size={20} />
              </div>
              <div className="rounded-lg p-3 bg-secondary flex items-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <DialogFooter>
        <form onSubmit={handleSend} className="flex w-full gap-2">
          <Input
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogFooter>
    </DialogContent>
  );
}
