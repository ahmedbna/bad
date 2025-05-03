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
} from '@/utils/calculations';

// Handle drawing for Three-Point Arc
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
  } else if (drawingPoints.length === 2) {
    // Third point (end point) - complete the arc
    const [startPoint, midPoint] = drawingPoints;
    const endPoint = clickPoint;

    // Calculate center and radius using three points
    const center = calculateArcCenter(startPoint, midPoint, endPoint);
    if (!center) return; // Points are collinear

    const radius = calculateDistance(center, startPoint);
    const startAngle = angleBetweenPoints(center, startPoint);
    const endAngle = angleBetweenPoints(center, endPoint);

    // Determine if arc goes clockwise or counterclockwise
    let midAngle = angleBetweenPoints(center, midPoint);
    let isClockwise = !isAngleBetween(midAngle, startAngle, endAngle);

    // Adjust end angle for proper arc direction
    let adjustedEndAngle = endAngle;
    if (isClockwise && endAngle > startAngle) {
      adjustedEndAngle = endAngle - 2 * Math.PI;
    } else if (!isClockwise && endAngle < startAngle) {
      adjustedEndAngle = endAngle + 2 * Math.PI;
    }

    completeShape([center], {
      radius,
      startAngle,
      endAngle: adjustedEndAngle,
    });
  }
};

// Handle drawing for Start-Center-End Arc
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
    const startAngle = angleBetweenPoints(center, startPoint);

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
    const startAngle = angleBetweenPoints(center, startPoint);
    const endAngle = angleBetweenPoints(center, endPoint);

    completeShape([center], {
      radius,
      startAngle,
      endAngle,
    });
  }
};

// Handle drawing for Center-Start-End Arc
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
      type: 'arc',
      points: [clickPoint],
      isCompleted: false,
    });
  } else if (drawingPoints.length === 1) {
    // Second point (start point)
    const center = drawingPoints[0];
    const startPoint = clickPoint;
    const radius = calculateDistance(center, startPoint);
    const startAngle = angleBetweenPoints(center, startPoint);

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
    const startAngle = angleBetweenPoints(center, startPoint);
    const endAngle = angleBetweenPoints(center, endPoint);

    completeShape([center], {
      radius,
      startAngle,
      endAngle,
    });
  }
};

// Handle drawing for Start-End-Radius Arc
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

    // Calculate center point
    const { center, startAngle, endAngle } = calculateArcFromStartEndBulge(
      startPoint,
      endPoint,
      bulgePoint
    );

    if (center) {
      completeShape([center], {
        radius,
        startAngle,
        endAngle,
      });
    }
  }
};

// Handle drawing for Start-End-Direction Arc
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
    const dirAngle = angleBetweenPoints(startPoint, dirPoint);

    // Calculate center and radius based on start point, end point, and direction
    const { center, radius, startAngle, endAngle } =
      calculateArcFromStartEndDirection(startPoint, endPoint, dirAngle);

    if (center) {
      completeShape([center], {
        radius,
        startAngle,
        endAngle,
      });
    }
  }
};

// Preview handlers for each arc mode
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
    const startAngle = angleBetweenPoints(center, startPoint);
    const endAngle = angleBetweenPoints(center, endPoint);

    // Determine if arc goes clockwise or counterclockwise
    let midAngle = angleBetweenPoints(center, midPoint);
    let isClockwise = !isAngleBetween(midAngle, startAngle, endAngle);

    // Adjust end angle for proper arc direction
    let adjustedEndAngle = endAngle;
    if (isClockwise && endAngle > startAngle) {
      adjustedEndAngle = endAngle - 2 * Math.PI;
    } else if (!isClockwise && endAngle < startAngle) {
      adjustedEndAngle = endAngle + 2 * Math.PI;
    }

    setTempShape({
      ...tempShape,
      type: 'arc',
      points: [center],
      properties: {
        radius,
        startAngle,
        endAngle: adjustedEndAngle,
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
    // Preview line from start to potential center
    setTempShape({
      ...tempShape,
      type: 'line',
      points: [drawingPoints[0], mousePoint],
    });
  } else if (drawingPoints.length === 2) {
    // Preview arc from start to current mouse position
    const startPoint = drawingPoints[0];
    const center = drawingPoints[1];
    const endPoint = mousePoint;

    const radius = calculateDistance(center, startPoint);
    const startAngle = angleBetweenPoints(center, startPoint);
    const endAngle = angleBetweenPoints(center, endPoint);

    setTempShape({
      ...tempShape,
      type: 'arc',
      points: [center],
      properties: {
        radius,
        startAngle,
        endAngle,
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
    // Preview line from center to start point
    const center = drawingPoints[0];
    const startPoint = mousePoint;
    const radius = calculateDistance(center, startPoint);

    setTempShape({
      ...tempShape,
      type: 'circle',
      points: [center],
      properties: {
        radius,
      },
    });
  } else if (drawingPoints.length === 2) {
    // Preview arc from start to current mouse position
    const center = drawingPoints[0];
    const startPoint = drawingPoints[1];
    const endPoint = mousePoint;

    const radius = calculateDistance(center, startPoint);
    const startAngle = angleBetweenPoints(center, startPoint);
    const endAngle = angleBetweenPoints(center, endPoint);

    setTempShape({
      ...tempShape,
      type: 'arc',
      points: [center],
      properties: {
        radius,
        startAngle,
        endAngle,
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
    // Preview line from start to end
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
    const { center, startAngle, endAngle } = calculateArcFromStartEndBulge(
      startPoint,
      endPoint,
      bulgePoint
    );

    if (center) {
      const radius = calculateDistance(center, startPoint);
      setTempShape({
        ...tempShape,
        type: 'arc',
        points: [center],
        properties: {
          radius,
          startAngle,
          endAngle,
        },
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
    const dirAngle = angleBetweenPoints(startPoint, dirPoint);

    // Calculate arc parameters
    const { center, radius, startAngle, endAngle } =
      calculateArcFromStartEndDirection(startPoint, endPoint, dirAngle);

    if (center) {
      setTempShape({
        ...tempShape,
        type: 'arc',
        points: [center],
        properties: {
          radius,
          startAngle,
          endAngle,
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
