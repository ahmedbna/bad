'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Send, X, Check } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Point } from '@/types';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Props = {
  projectId: Id<'projects'>;
  selectedShapes: Doc<'shapes'>[];
  scale: number;
  offset: Point;
  viewport: { width: number; height: number };
  onClearAiShapes: () => void;
  onAcceptAiShapes: () => void;
  onDrawAiShapes: (shapes: Doc<'shapes'>[]) => void;
};

export const FloatingAIChat = ({
  selectedShapes,
  scale,
  offset,
  onDrawAiShapes,
  onClearAiShapes,
  onAcceptAiShapes,
  viewport,
  projectId,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingShapes, setPendingShapes] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user' as const, content: message };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Prepare context for the API call
      const context = {
        selectedShapes: selectedShapes.map((shape) => ({
          type: shape.type,
          points: shape.points,
          properties: shape.properties,
        })),
        viewport: {
          width: viewport.width,
          height: viewport.height,
          scale,
          offset,
        },
        projectId,
      };

      // Call the OpenAI API with the message and context
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: message,
          context,
          history: messages,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();

      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message },
      ]);

      // If there are shapes in the response, draw them on the canvas
      if (data.shapes && data.shapes.length > 0) {
        onDrawAiShapes(data.shapes);
        setPendingShapes(true);
      }
    } catch (error) {
      console.error('Error in AI chat:', error);

      toast('Error', {
        description: 'Failed to process your request. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptShapes = () => {
    onAcceptAiShapes();
    setPendingShapes(false);
    toast('Shapes accepted', {
      description: 'The AI-generated shapes have been added to your drawing.',
    });
  };

  const handleClearShapes = () => {
    onClearAiShapes();
    setPendingShapes(false);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      onClearAiShapes(); // Clear any AI shapes when opening the chat
      setPendingShapes(false);
    }
  };

  return (
    <div className='fixed bottom-4 right-4 z-50'>
      {isOpen ? (
        <Card className='w-80 md:w-96 shadow-lg'>
          <CardHeader className='flex flex-row justify-between items-center p-4'>
            <CardTitle className='text-md'>AI Assistant</CardTitle>
            <Button variant='ghost' size='sm' onClick={toggleChat}>
              <X className='h-4 w-4' />
            </Button>
          </CardHeader>

          <CardContent className='p-4 pt-0'>
            <ScrollArea className='h-60' ref={scrollAreaRef}>
              <div className='space-y-4'>
                {messages.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    {`Ask AI to draw shapes or analyze your design. Try "Draw a house" or "Calculate the area of selected shapes".`}
                  </p>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg px-3 py-2 max-w-[80%] ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className='text-sm whitespace-pre-wrap'>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className='flex justify-start'>
                    <div className='rounded-lg px-3 py-2 bg-muted'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {pendingShapes && (
              <div className='flex justify-center mt-4 space-x-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleClearShapes}
                  className='flex items-center gap-1'
                >
                  <X className='h-4 w-4' /> Reject
                </Button>
                <Button
                  size='sm'
                  onClick={handleAcceptShapes}
                  className='flex items-center gap-1'
                >
                  <Check className='h-4 w-4' /> Accept
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className='p-4 pt-0'>
            <div className='flex w-full items-center space-x-2'>
              <Textarea
                placeholder='Ask AI to draw or analyze...'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className='min-h-10 flex-1'
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                size='sm'
                disabled={isLoading || !message.trim()}
                onClick={handleSendMessage}
              >
                <Send className='h-4 w-4' />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Button
          onClick={toggleChat}
          variant='default'
          className='rounded-full h-12 w-12 p-0 shadow-lg'
        >
          AI
        </Button>
      )}
    </div>
  );
};
