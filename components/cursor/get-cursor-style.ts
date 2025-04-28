type CursorStyleProps = {
  isPanning: boolean;
  currentTool: string | null;
};

// Set cursor based on current tool
export const getCursorStyle = ({
  isPanning,
  currentTool,
}: CursorStyleProps): string => {
  if (isPanning) return 'grabbing';

  switch (currentTool) {
    case 'pointer':
      return 'default';
    case 'line':
    case 'circle':
    case 'rectangle':
    case 'polyline':
      return 'crosshair';
    case 'text':
      return 'text';
    default:
      return 'default';
  }
};
