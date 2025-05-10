import { Shape } from '@/types';
import {
  AreaSelectionState,
  completeAreaSelection,
} from '../select/handleAreaSelection';

type Props = {
  e: React.MouseEvent<HTMLCanvasElement>;
  areaSelection: AreaSelectionState;
  shapes: Shape[];
  setAreaSelection: React.Dispatch<React.SetStateAction<AreaSelectionState>>;
  setSelectedShapes: React.Dispatch<React.SetStateAction<string[]>>;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
};

// Handle mouse up
export const handleMouseUp = ({
  e,
  areaSelection,
  shapes,
  setAreaSelection,
  setSelectedShapes,
  setIsDragging,
}: Props) => {
  setIsDragging(false);

  if (areaSelection.active) {
    // Complete area selection and get selected shapes
    const isShiftSelect = e.shiftKey;
    const selectedIds = completeAreaSelection(
      shapes,
      areaSelection,
      setAreaSelection
    );

    // Update selected shapes
    if (isShiftSelect) {
      // Remove selectedIds from current selection
      setSelectedShapes((prev) =>
        prev.filter((id) => !selectedIds.includes(id))
      );
    } else {
      // Add to existing selection
      setSelectedShapes((prev) => {
        const newSelection = [...prev];

        selectedIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  }
};
