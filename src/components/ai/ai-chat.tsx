'use client';

import { useState, useRef, useEffect } from 'react';
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
import { buildAIMessageFromShapes } from './build-ai-message';
import {
  calculateCircleProperties,
  calculateEllipseProperties,
  calculateLineProperties,
  calculatePolygonProperties,
  calculatePolylineProperties,
  calculateRectangleProperties,
  calculateSplineProperties,
} from '@/utils/calculations';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Props = {
  project: Doc<'projects'> & { layers: Doc<'layers'>[] };
  selectedShapes: Doc<'shapes'>[];
  pendingAiShapes: any[];
  setPendingAiShapes: React.Dispatch<React.SetStateAction<any>[]>;
  completeShape: (points: Point[], properties?: any) => void;
};

export const AIChat = ({
  project,
  selectedShapes,
  pendingAiShapes,
  setPendingAiShapes,
  completeShape,
}: Props) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingShapes, setPendingShapes] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const addShapes = useMutation(api.shapes.addShapes);

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

    const aiShapesMessage =
      selectedShapes.length > 0
        ? buildAIMessageFromShapes(selectedShapes)
        : undefined;

    try {
      // Call the OpenAI API with the message and context
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: message,
          aiShapesMessage,
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
        { role: 'assistant', content: data.aimessage },
      ]);

      // If there are shapes in the response, draw them on the canvas
      if (data.shapes && data.shapes.length > 0) {
        setPendingAiShapes(data.shapes);
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

  const handleAcceptShapes = async () => {
    if (pendingAiShapes.length > 0) {
      console.log(pendingAiShapes);

      // Draw all ai shapes
      const newShapes = pendingAiShapes.map((shape) => {
        switch (shape.type) {
          case 'line':
            const lineProps = calculateLineProperties(
              shape.points[0],
              shape.points[1]
            );
            return {
              projectId: project._id,
              layerId: project.layers[0]._id,
              type: shape.type,
              points: shape.points,
              properties: { ...shape.properties, ...lineProps },
            };

          case 'polyline':
            const polylineProps = calculatePolylineProperties(shape.points);
            return {
              projectId: project._id,
              layerId: project.layers[0]._id,
              type: shape.type,
              points: shape.points,
              properties: { ...shape.properties, ...polylineProps },
            };

          case 'rectangle':
            const rectProps = calculateRectangleProperties(
              shape.points[0],
              shape.points[1]
            );
            return {
              projectId: project._id,
              layerId: project.layers[0]._id,
              type: shape.type,
              points: shape.points,
              properties: { ...shape.properties, ...rectProps },
            };

          case 'circle':
            const circleProps = calculateCircleProperties(shape.radius);
            return {
              projectId: project._id,
              layerId: project.layers[0]._id,
              type: shape.type,
              points: shape.points,
              properties: { ...shape.properties, ...circleProps },
            };

          case 'ellipse':
            const ellipseProps = calculateEllipseProperties(
              shape.properties.radiusX,
              shape.properties.radiusY,
              shape.properties.isFullEllipse
            );
            return {
              projectId: project._id,
              layerId: project.layers[0]._id,
              type: shape.type,
              points: shape.points,
              properties: { ...shape.properties, ...ellipseProps },
            };

          case 'polygon':
            const polygonProps = calculatePolygonProperties(
              shape.properties.radius,
              shape.properties.sides
            );
            return {
              projectId: project._id,
              layerId: project.layers[0]._id,
              type: shape.type,
              points: shape.points,
              properties: { ...shape.properties, ...polygonProps },
            };

          case 'spline':
            const splineProps = calculateSplineProperties(
              shape.points,
              shape.properties.tension
            );
            return {
              projectId: project._id,
              layerId: project.layers[0]._id,
              type: shape.type,
              points: shape.points,
              properties: { ...shape.properties, ...splineProps },
            };

          default:
            return shape;
        }
      });

      await addShapes({ shapes: newShapes });
    }

    setPendingAiShapes([]);
    setPendingShapes(false);
    toast('Shapes accepted', {
      description: 'The AI-generated shapes have been added to your drawing.',
    });
  };

  const handleClearShapes = () => {
    setPendingAiShapes([]);
    setPendingShapes(false);
  };

  return (
    <Card className='w-full shadow-lg'>
      <CardHeader className='flex flex-row justify-between items-center p-4'>
        <CardTitle className='text-md'>AI Assistant</CardTitle>
      </CardHeader>

      <CardContent className='p-4 pt-0'>
        <ScrollArea className='h-96' ref={scrollAreaRef}>
          <div className='space-y-4'>
            {messages.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                Ask AI to draw shapes or analyze your design. Try "Draw a house"
                or "Calculate the area of selected shapes".
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
                    <p className='text-sm whitespace-pre-wrap'>{msg.content}</p>
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
        <div className='flex flex-col w-full'>
          <Textarea
            placeholder='Ask AI to draw or analyze...'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className='min-h-18 mb-2'
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
            Ask AI
            <Send className='h-4 w-4 ml-2' />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
