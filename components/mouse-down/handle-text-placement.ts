import { Entity, Point } from '@/hooks/CADContext';

type TextPlacementProps = {
  point: Point;
  addEntity: (entity: Omit<Entity, 'id'>) => void;
};

// Text tool handler
export const handleTextPlacement = ({
  point,
  addEntity,
}: TextPlacementProps) => {
  // Simple implementation - prompt for text content
  const content = prompt('Enter text:', '');

  if (content !== null && content.trim() !== '') {
    addEntity({
      type: 'text',
      position: point,
      content: content,
      fontSize: 16,
      fontFamily: 'Arial', // @ts-ignore
      properties: {
        strokeColor: '#000000',
      },
    });
  }
};
