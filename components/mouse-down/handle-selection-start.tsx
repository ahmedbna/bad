import { MouseEvent } from 'react';
import { Point, ViewState } from '@/hooks/CADContext';
import { isPointOnEntity } from './is-point-on-entity';

type SelectionStartProps = {
  event: MouseEvent<HTMLCanvasElement>;
  point: Point;
  viewState: ViewState;
  entities: any[]; // Replace with the actual type of your entities
  setSelectedEntities: (ids: string[]) => void; // Function to set selected entities
  selectedEntities: string[]; // Array of currently selected entity IDs
};

// Selection tool handlers
export const handleSelectionStart = ({
  event,
  point,
  entities,
  viewState,
  setSelectedEntities,
  selectedEntities,
}: SelectionStartProps) => {
  // Check if clicking on an entity
  let clickedEntityIndex = -1;

  // Loop through entities in reverse order (top-most first)
  for (let i = entities.length - 1; i >= 0; i--) {
    if (isPointOnEntity({ point, entity: entities[i], viewState })) {
      clickedEntityIndex = i;
      break;
    }
  }

  if (clickedEntityIndex >= 0) {
    const entity = entities[clickedEntityIndex];

    // If shift is not held, clear previous selection
    if (!event.shiftKey) {
      setSelectedEntities([entity.id]);
    } else {
      // Toggle selection if already selected
      if (selectedEntities.includes(entity.id)) {
        setSelectedEntities(selectedEntities.filter((id) => id !== entity.id));
      } else {
        setSelectedEntities([...selectedEntities, entity.id]);
      }
    }
  } else {
    // Clicked on empty space, clear selection if shift is not held
    if (!event.shiftKey) {
      setSelectedEntities([]);
    }
  }
};
