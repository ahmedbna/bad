import { Doc, Id } from '@/convex/_generated/dataModel';
import {
  AreaSelectionState,
  completeAreaSelection,
} from '../select/handleAreaSelection';

type Props = {
  e: React.MouseEvent<HTMLCanvasElement>;
  areaSelection: AreaSelectionState;
  shapes: Doc<'shapes'>[];
  setAreaSelection: React.Dispatch<React.SetStateAction<AreaSelectionState>>;
  setSelectedShapeIds: React.Dispatch<React.SetStateAction<Id<'shapes'>[]>>;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
};

// Handle mouse up
export const handleMouseUp = ({
  e,
  areaSelection,
  shapes,
  setAreaSelection,
  setSelectedShapeIds,
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
      setSelectedShapeIds((prev) =>
        prev.filter((id) => !selectedIds.includes(id))
      );
    } else {
      // Add to existing selection
      setSelectedShapeIds((prev) => {
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
