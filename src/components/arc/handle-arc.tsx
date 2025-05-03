import { Point } from '@/types/point';
import { ShapeProperties } from '@/types/property';
import { Shape } from '@/types/shape';
import {
  angleBetweenPoints,
  calculateArcCenter,
  calculateArcFromStartEndBulge,
  calculateArcFromStartEndDirection,
  calculateDistance,
  calculateRadiusFromBulge,
  isAngleBetween,
  normalizeAngle,
} from '@/utils/calculations';

// Improved handler for Three-Point Arc
export const handleThreePointArc = (
  clickPoint: Point,
  drawingPoints: Point[],
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>,
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  if (drawingPoints.length === 0) {
    // First point (start point)
    setDrawingPoints([clickPoint]);
    setTempShape({
      id: 'temp',
      type: 'arc',
      points: [clickPoint],
      isCompleted: false,
    });
  } else if (drawingPoints.length === 1) {
    // Second point (middle point)
    setDrawingPoints([...drawingPoints, clickPoint]);

    // Show a line from start to second point
    setTempShape({
      id: 'temp',
      type: 'line',
      points: [drawingPoints[0], clickPoint],
      isCompleted: false,
    });
  } else if (drawingPoints.length === 2) {
    // Third point (end point) - complete the arc
    const [startPoint, midPoint] = drawingPoints;
    const endPoint = clickPoint;

    // Calculate center and radius using three points
    const center = calculateArcCenter(startPoint, midPoint, endPoint);
    if (!center) return; // Points are collinear

    const radius = calculateDistance(center, startPoint);
    const startAngle = normalizeAngle(angleBetweenPoints(center, startPoint));
    const endAngle = normalizeAngle(angleBetweenPoints(center, endPoint));
    const midAngle = normalizeAngle(angleBetweenPoints(center, midPoint));

    // Determine arc direction (clockwise or counterclockwise)
    let isClockwise = !isAngleBetween(midAngle, startAngle, endAngle);

    // Calculate sweep angle based on direction
    let sweepAngle;
    if (isClockwise) {
      sweepAngle =
        startAngle > endAngle
          ? startAngle - endAngle
          : startAngle - endAngle + 2 * Math.PI;
    } else {
      sweepAngle =
        endAngle > startAngle
          ? endAngle - startAngle
          : endAngle - startAngle + 2 * Math.PI;
    }

    // Adjust end angle for proper arc direction
    let adjustedEndAngle = isClockwise
      ? normalizeAngle(startAngle - sweepAngle)
      : normalizeAngle(startAngle + sweepAngle);

    completeShape([center], {
      radius,
      startAngle,
      endAngle: adjustedEndAngle,
      isClockwise,
    });
  }
};

// Improved handler for Start-Center-End Arc
export const handleStartCenterEndArc = (
  clickPoint: Point,
  drawingPoints: Point[],
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>,
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  if (drawingPoints.length === 0) {
    // First point (start point)
    setDrawingPoints([clickPoint]);
    setTempShape({
      id: 'temp',
      type: 'arc',
      points: [clickPoint],
      isCompleted: false,
    });
  } else if (drawingPoints.length === 1) {
    // Second point (center)
    const startPoint = drawingPoints[0];
    const center = clickPoint;
    const radius = calculateDistance(center, startPoint);
    const startAngle = normalizeAngle(angleBetweenPoints(center, startPoint));

    setDrawingPoints([...drawingPoints, clickPoint]);
    setTempShape({
      id: 'temp',
      type: 'arc',
      points: [center],
      properties: {
        radius,
        startAngle,
        endAngle: startAngle,
      },
      isCompleted: false,
    });
  } else if (drawingPoints.length === 2) {
    // Third point (end point) - complete the arc
    const startPoint = drawingPoints[0];
    const center = drawingPoints[1];
    const endPoint = clickPoint;

    const radius = calculateDistance(center, startPoint);
    const startAngle = normalizeAngle(angleBetweenPoints(center, startPoint));
    const endAngle = normalizeAngle(angleBetweenPoints(center, endPoint));

    // Default to counterclockwise (positive) direction for consistency with AutoCAD
    let isClockwise = false;

    // Calculate sweep angle - always go counterclockwise by default
    let sweepAngle =
      endAngle > startAngle
        ? endAngle - startAngle
        : endAngle - startAngle + 2 * Math.PI;

    // If sweep angle is more than 180 degrees, assume we want the shorter arc
    if (sweepAngle > Math.PI) {
      isClockwise = true;
      sweepAngle = 2 * Math.PI - sweepAngle;
    }

    // Final adjusted end angle
    const adjustedEndAngle = isClockwise
      ? normalizeAngle(startAngle - sweepAngle)
      : normalizeAngle(startAngle + sweepAngle);

    completeShape([center], {
      radius,
      startAngle,
      endAngle: adjustedEndAngle,
      isClockwise,
    });
  }
};

// Improved handler for Center-Start-End Arc
export const handleCenterStartEndArc = (
  clickPoint: Point,
  drawingPoints: Point[],
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>,
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  if (drawingPoints.length === 0) {
    // First point (center)
    setDrawingPoints([clickPoint]);
    setTempShape({
      id: 'temp',
      type: 'circle',
      points: [clickPoint],
      properties: {
        radius: 0,
      },
      isCompleted: false,
    });
  } else if (drawingPoints.length === 1) {
    // Second point (start point)
    const center = drawingPoints[0];
    const startPoint = clickPoint;
    const radius = calculateDistance(center, startPoint);
    const startAngle = normalizeAngle(angleBetweenPoints(center, startPoint));

    setDrawingPoints([...drawingPoints, clickPoint]);
    setTempShape({
      id: 'temp',
      type: 'arc',
      points: [center],
      properties: {
        radius,
        startAngle,
        endAngle: startAngle,
      },
      isCompleted: false,
    });
  } else if (drawingPoints.length === 2) {
    // Third point (end point) - complete the arc
    const center = drawingPoints[0];
    const startPoint = drawingPoints[1];
    const endPoint = clickPoint;

    const radius = calculateDistance(center, startPoint);
    const startAngle = normalizeAngle(angleBetweenPoints(center, startPoint));
    const endAngle = normalizeAngle(angleBetweenPoints(center, endPoint));

    // Default to counterclockwise direction
    let isClockwise = false;

    // Calculate sweep angle - choose the shortest path by default
    let sweepAngle = Math.abs(endAngle - startAngle);
    if (sweepAngle > Math.PI) {
      sweepAngle = 2 * Math.PI - sweepAngle;
      isClockwise = endAngle > startAngle;
    } else {
      isClockwise = endAngle < startAngle;
    }

    // Final adjusted end angle
    const adjustedEndAngle = isClockwise
      ? normalizeAngle(startAngle - sweepAngle)
      : normalizeAngle(startAngle + sweepAngle);

    completeShape([center], {
      radius,
      startAngle,
      endAngle: adjustedEndAngle,
      isClockwise,
    });
  }
};

// Improved handler for Start-End-Radius Arc
export const handleStartEndRadiusArc = (
  clickPoint: Point,
  drawingPoints: Point[],
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>,
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  if (drawingPoints.length === 0) {
    // First point (start point)
    setDrawingPoints([clickPoint]);
    setTempShape({
      id: 'temp',
      type: 'arc',
      points: [clickPoint],
      isCompleted: false,
    });
  } else if (drawingPoints.length === 1) {
    // Second point (end point)
    const startPoint = drawingPoints[0];
    const endPoint = clickPoint;

    setDrawingPoints([...drawingPoints, clickPoint]);

    // Show temporary line between start and end
    setTempShape({
      id: 'temp',
      type: 'line',
      points: [startPoint, endPoint],
      isCompleted: false,
    });
  } else if (drawingPoints.length === 2) {
    // Third click determines the bulge direction and completes the arc
    const startPoint = drawingPoints[0];
    const endPoint = drawingPoints[1];
    const bulgePoint = clickPoint;

    // Calculate radius based on the distance from the third click to the line
    const radius = calculateRadiusFromBulge(startPoint, endPoint, bulgePoint);

    // Calculate center point and angles
    const { center, startAngle, endAngle, isClockwise } =
      calculateArcFromStartEndBulge(startPoint, endPoint, bulgePoint);

    if (center) {
      completeShape([center], {
        radius,
        startAngle: normalizeAngle(startAngle),
        endAngle: normalizeAngle(endAngle),
        isClockwise,
      });
    }
  }
};

// Improved handler for Start-End-Direction Arc
export const handleStartEndDirectionArc = (
  clickPoint: Point,
  drawingPoints: Point[],
  setDrawingPoints: React.Dispatch<React.SetStateAction<Point[]>>,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>,
  completeShape: (points: Point[], properties?: ShapeProperties) => void
) => {
  if (drawingPoints.length === 0) {
    // First point (start point)
    setDrawingPoints([clickPoint]);
    setTempShape({
      id: 'temp',
      type: 'arc',
      points: [clickPoint],
      isCompleted: false,
    });
  } else if (drawingPoints.length === 1) {
    // Second point (end point)
    const startPoint = drawingPoints[0];
    const endPoint = clickPoint;

    setDrawingPoints([...drawingPoints, clickPoint]);

    // Show temporary line between start and end
    setTempShape({
      id: 'temp',
      type: 'line',
      points: [startPoint, endPoint],
      isCompleted: false,
    });
  } else if (drawingPoints.length === 2) {
    // Third click determines the start direction
    const startPoint = drawingPoints[0];
    const endPoint = drawingPoints[1];
    const dirPoint = clickPoint;

    // Calculate start direction angle
    const dirAngle = normalizeAngle(angleBetweenPoints(startPoint, dirPoint));

    // Calculate center and radius based on start point, end point, and direction
    const { center, radius, startAngle, endAngle, isClockwise } =
      calculateArcFromStartEndDirection(startPoint, endPoint, dirAngle);

    if (center) {
      completeShape([center], {
        radius,
        startAngle: normalizeAngle(startAngle),
        endAngle: normalizeAngle(endAngle),
        isClockwise,
      });
    }
  }
};

// Improved preview handlers for better visual feedback
export const previewThreePointArc = (
  mousePoint: Point,
  drawingPoints: Point[],
  tempShape: Shape,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  if (drawingPoints.length === 1) {
    // Preview line from start to current mouse position
    setTempShape({
      ...tempShape,
      type: 'line',
      points: [drawingPoints[0], mousePoint],
    });
  } else if (drawingPoints.length === 2) {
    // Preview arc through three points
    const [startPoint, midPoint] = drawingPoints;
    const endPoint = mousePoint;

    // Calculate center and radius using three points
    const center = calculateArcCenter(startPoint, midPoint, endPoint);
    if (!center) {
      // Points are collinear, show a line
      setTempShape({
        ...tempShape,
        type: 'line',
        points: [startPoint, endPoint],
      });
      return;
    }

    const radius = calculateDistance(center, startPoint);
    const startAngle = normalizeAngle(angleBetweenPoints(center, startPoint));
    const endAngle = normalizeAngle(angleBetweenPoints(center, endPoint));
    const midAngle = normalizeAngle(angleBetweenPoints(center, midPoint));

    // Determine if arc goes clockwise or counterclockwise
    let isClockwise = !isAngleBetween(midAngle, startAngle, endAngle);

    // Calculate sweep angle based on direction
    let sweepAngle;
    if (isClockwise) {
      sweepAngle =
        startAngle > endAngle
          ? startAngle - endAngle
          : startAngle - endAngle + 2 * Math.PI;
    } else {
      sweepAngle =
        endAngle > startAngle
          ? endAngle - startAngle
          : endAngle - startAngle + 2 * Math.PI;
    }

    // Adjust end angle for proper arc direction
    let adjustedEndAngle = isClockwise
      ? normalizeAngle(startAngle - sweepAngle)
      : normalizeAngle(startAngle + sweepAngle);

    setTempShape({
      ...tempShape,
      type: 'arc',
      points: [center],
      properties: {
        radius,
        startAngle,
        endAngle: adjustedEndAngle,
        isClockwise,
      },
    });
  }
};

export const previewStartCenterEndArc = (
  mousePoint: Point,
  drawingPoints: Point[],
  tempShape: Shape,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  if (drawingPoints.length === 1) {
    // Preview circle with radius from start to mouse position
    const startPoint = drawingPoints[0];
    const potentialCenter = mousePoint;
    const radius = calculateDistance(potentialCenter, startPoint);

    setTempShape({
      ...tempShape,
      type: 'circle',
      points: [potentialCenter],
      properties: {
        radius,
        // Add dashed property to indicate it's a preview
        // isDashed: true,
      },
    });
  } else if (drawingPoints.length === 2) {
    // Preview arc from start to current mouse position
    const startPoint = drawingPoints[0];
    const center = drawingPoints[1];
    const endPoint = mousePoint;

    const radius = calculateDistance(center, startPoint);
    const startAngle = normalizeAngle(angleBetweenPoints(center, startPoint));
    const endAngle = normalizeAngle(angleBetweenPoints(center, endPoint));

    // Default to shorter arc path
    let isClockwise = false;
    let sweepAngle = Math.abs(endAngle - startAngle);

    if (sweepAngle > Math.PI) {
      sweepAngle = 2 * Math.PI - sweepAngle;
      isClockwise = endAngle > startAngle;
    } else {
      isClockwise = endAngle < startAngle;
    }

    // Final adjusted end angle
    const adjustedEndAngle = isClockwise
      ? normalizeAngle(startAngle - sweepAngle)
      : normalizeAngle(startAngle + sweepAngle);

    setTempShape({
      ...tempShape,
      type: 'arc',
      points: [center],
      properties: {
        radius,
        startAngle,
        endAngle: adjustedEndAngle,
        isClockwise,
      },
    });
  }
};

export const previewCenterStartEndArc = (
  mousePoint: Point,
  drawingPoints: Point[],
  tempShape: Shape,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  if (drawingPoints.length === 1) {
    // Preview circle from center to mouse position
    const center = drawingPoints[0];
    const radius = calculateDistance(center, mousePoint);

    setTempShape({
      ...tempShape,
      type: 'circle',
      points: [center],
      properties: {
        radius,
        // isDashed: true,
      },
    });
  } else if (drawingPoints.length === 2) {
    // Preview arc from start to current mouse position
    const center = drawingPoints[0];
    const startPoint = drawingPoints[1];
    const endPoint = mousePoint;

    const radius = calculateDistance(center, startPoint);
    const startAngle = normalizeAngle(angleBetweenPoints(center, startPoint));
    const endAngle = normalizeAngle(angleBetweenPoints(center, endPoint));

    // Default to shorter arc path
    let isClockwise = false;
    let sweepAngle = Math.abs(endAngle - startAngle);

    if (sweepAngle > Math.PI) {
      sweepAngle = 2 * Math.PI - sweepAngle;
      isClockwise = endAngle > startAngle;
    } else {
      isClockwise = endAngle < startAngle;
    }

    // Final adjusted end angle
    const adjustedEndAngle = isClockwise
      ? normalizeAngle(startAngle - sweepAngle)
      : normalizeAngle(startAngle + sweepAngle);

    setTempShape({
      ...tempShape,
      type: 'arc',
      points: [center],
      properties: {
        radius,
        startAngle,
        endAngle: adjustedEndAngle,
        isClockwise,
      },
    });
  }
};

export const previewStartEndRadiusArc = (
  mousePoint: Point,
  drawingPoints: Point[],
  tempShape: Shape,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  if (drawingPoints.length === 1) {
    // Preview line from start to potential end
    setTempShape({
      ...tempShape,
      type: 'line',
      points: [drawingPoints[0], mousePoint],
    });
  } else if (drawingPoints.length === 2) {
    // Preview arc based on bulge point
    const startPoint = drawingPoints[0];
    const endPoint = drawingPoints[1];
    const bulgePoint = mousePoint;

    // Calculate arc parameters
    const { center, startAngle, endAngle, isClockwise } =
      calculateArcFromStartEndBulge(startPoint, endPoint, bulgePoint);

    if (center) {
      const radius = calculateDistance(center, startPoint);
      setTempShape({
        ...tempShape,
        type: 'arc',
        points: [center],
        properties: {
          radius,
          startAngle: normalizeAngle(startAngle),
          endAngle: normalizeAngle(endAngle),
          isClockwise,
        },
      });
    } else {
      // Failed to calculate arc, show the chord line
      setTempShape({
        ...tempShape,
        type: 'line',
        points: [startPoint, endPoint],
      });
    }
  }
};

export const previewStartEndDirectionArc = (
  mousePoint: Point,
  drawingPoints: Point[],
  tempShape: Shape,
  setTempShape: React.Dispatch<React.SetStateAction<Shape | null>>
) => {
  if (drawingPoints.length === 1) {
    // Preview line from start to end
    setTempShape({
      ...tempShape,
      type: 'line',
      points: [drawingPoints[0], mousePoint],
    });
  } else if (drawingPoints.length === 2) {
    // Preview arc based on direction
    const startPoint = drawingPoints[0];
    const endPoint = drawingPoints[1];
    const dirPoint = mousePoint;

    // Calculate direction angle
    const dirAngle = normalizeAngle(angleBetweenPoints(startPoint, dirPoint));

    // Calculate arc parameters
    const { center, radius, startAngle, endAngle, isClockwise } =
      calculateArcFromStartEndDirection(startPoint, endPoint, dirAngle);

    if (center) {
      setTempShape({
        ...tempShape,
        type: 'arc',
        points: [center],
        properties: {
          radius,
          startAngle: normalizeAngle(startAngle),
          endAngle: normalizeAngle(endAngle),
          isClockwise,
        },
      });
    } else {
      // Direction makes it impossible to create an arc, show line
      setTempShape({
        ...tempShape,
        type: 'line',
        points: [startPoint, endPoint],
      });
    }
  }
};
