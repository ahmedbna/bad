'use client';

import { useState, useEffect } from 'react';
import { Point, Shape } from '@/types';
import { canvasToWorld } from '@/utils/canvasToWorld';
import { distance } from '@/utils/calculations';

// Define snap modes
export enum SnapMode {
  NONE = 'none',
  ENDPOINT = 'endpoint',
  MIDPOINT = 'midpoint',
  CENTER = 'center',
  NODE = 'node',
  QUADRANT = 'quadrant',
  INTERSECTION = 'intersection',
  EXTENSION = 'extension',
  PERPENDICULAR = 'perpendicular',
  TANGENT = 'tangent',
  NEAREST = 'nearest',
  GRID = 'grid',
}

// Type for snap result
export type SnapResult = {
  point: Point;
  snapMode: SnapMode;
  distance: number;
  snapInfo?: {
    shapeId?: string;
    pointIndex?: number;
    quadrant?: 'n' | 's' | 'e' | 'w';
  };
} | null;

// Snap settings interface
export interface SnapSettings {
  enabled: boolean;
  modes: Set<SnapMode>;
  threshold: number;
  gridSize: number;
}

type Props = {
  scale: number;
  offset: Point;
  shapes: Shape[];
  snapSettings: SnapSettings;
};

/**
 * Custom hook for handling snapping functionality
 */
export const useSnapping = ({ shapes, snapSettings, scale, offset }: Props) => {
  const [activeSnapResult, setActiveSnapResult] = useState<SnapResult>(null);
  const [snapModes, setSnapModes] = useState<Set<SnapMode>>(snapSettings.modes);
  const [snapThreshold, setSnapThreshold] = useState<number>(
    snapSettings.threshold
  );

  // Update settings when they change
  useEffect(() => {
    setSnapModes(snapSettings.modes);
    setSnapThreshold(snapSettings.threshold);
  }, [snapSettings]);

  /**
   * Find endpoint snap (first and last points of lines, polylines, etc.)
   */
  const findEndpointSnap = (
    cursorPosition: Point,
    shapes: Shape[]
  ): SnapResult => {
    let closestPoint: Point | null = null;
    let minDistance = snapThreshold / scale;
    let snapInfo = {};

    shapes.forEach((shape) => {
      const { points } = shape;

      // Check first and last points for most shapes
      if (points.length > 0) {
        // First point
        const distToFirst = distance(cursorPosition, points[0]);
        if (distToFirst < minDistance) {
          minDistance = distToFirst;
          closestPoint = points[0];
          snapInfo = { shapeId: shape.id, pointIndex: 0 };
        }

        // Last point
        const lastIndex = points.length - 1;
        const distToLast = distance(cursorPosition, points[lastIndex]);
        if (distToLast < minDistance) {
          minDistance = distToLast;
          closestPoint = points[lastIndex];
          snapInfo = { shapeId: shape.id, pointIndex: lastIndex };
        }
      }
    });

    return closestPoint
      ? {
          point: closestPoint,
          snapMode: SnapMode.ENDPOINT,
          distance: minDistance,
          snapInfo,
        }
      : null;
  };

  /**
   * Find midpoint snap (middle of lines, edges of rectangles, etc.)
   */
  const findMidpointSnap = (
    cursorPosition: Point,
    shapes: Shape[]
  ): SnapResult => {
    let closestPoint: Point | null = null;
    let minDistance = snapThreshold / scale;
    let snapInfo = {};

    shapes.forEach((shape) => {
      const { points, type } = shape;

      // For lines, find midpoint
      if (type === 'line' && points.length === 2) {
        const midpoint = {
          x: (points[0].x + points[1].x) / 2,
          y: (points[0].y + points[1].y) / 2,
        };
        const dist = distance(cursorPosition, midpoint);
        if (dist < minDistance) {
          minDistance = dist;
          closestPoint = midpoint;
          snapInfo = { shapeId: shape.id };
        }
      }

      // For polylines, find midpoints of each segment
      else if (
        (type === 'polyline' || type === 'polygon') &&
        points.length > 1
      ) {
        for (let i = 0; i < points.length - 1; i++) {
          const midpoint = {
            x: (points[i].x + points[i + 1].x) / 2,
            y: (points[i].y + points[i + 1].y) / 2,
          };
          const dist = distance(cursorPosition, midpoint);
          if (dist < minDistance) {
            minDistance = dist;
            closestPoint = midpoint;
            snapInfo = { shapeId: shape.id, pointIndex: i };
          }
        }

        // For closed polygons, check the closing segment too
        if (type === 'polygon' && points.length > 2) {
          const midpoint = {
            x: (points[0].x + points[points.length - 1].x) / 2,
            y: (points[0].y + points[points.length - 1].y) / 2,
          };
          const dist = distance(cursorPosition, midpoint);
          if (dist < minDistance) {
            minDistance = dist;
            closestPoint = midpoint;
            snapInfo = { shapeId: shape.id, pointIndex: points.length - 1 };
          }
        }
      }

      // For rectangles, find midpoints of each side
      else if (type === 'rectangle' && points.length === 2) {
        const p1 = points[0];
        const p2 = points[1];

        // Midpoints of the four sides
        const midpoints = [
          { x: (p1.x + p2.x) / 2, y: p1.y }, // Top
          { x: (p1.x + p2.x) / 2, y: p2.y }, // Bottom
          { x: p1.x, y: (p1.y + p2.y) / 2 }, // Left
          { x: p2.x, y: (p1.y + p2.y) / 2 }, // Right
        ];

        midpoints.forEach((midpoint, i) => {
          const dist = distance(cursorPosition, midpoint);
          if (dist < minDistance) {
            minDistance = dist;
            closestPoint = midpoint;
            snapInfo = { shapeId: shape.id, pointIndex: i };
          }
        });
      }
    });

    return closestPoint
      ? {
          point: closestPoint,
          snapMode: SnapMode.MIDPOINT,
          distance: minDistance,
          snapInfo,
        }
      : null;
  };

  /**
   * Find center snap (center of circles, arcs, ellipses, rectangles)
   */
  const findCenterSnap = (
    cursorPosition: Point,
    shapes: Shape[]
  ): SnapResult => {
    let closestPoint: Point | null = null;
    let minDistance = snapThreshold / scale;
    let snapInfo = {};

    shapes.forEach((shape) => {
      const { points, type, properties } = shape;
      let center: Point | null = null;

      // For circles and arcs with center point
      if ((type === 'circle' || type === 'arc') && points.length > 0) {
        center = points[0]; // Center is typically the first point
      }

      // For ellipses
      else if (type === 'ellipse' && points.length > 0) {
        center = points[0]; // Center is the first point
      }

      // For rectangles
      else if (type === 'rectangle' && points.length === 2) {
        center = {
          x: (points[0].x + points[1].x) / 2,
          y: (points[0].y + points[1].y) / 2,
        };
      }

      // For polygons (calculate centroid)
      else if (type === 'polygon' && points.length > 2) {
        let sumX = 0,
          sumY = 0;
        points.forEach((p) => {
          sumX += p.x;
          sumY += p.y;
        });
        center = {
          x: sumX / points.length,
          y: sumY / points.length,
        };
      }

      if (center) {
        const dist = distance(cursorPosition, center);
        if (dist < minDistance) {
          minDistance = dist;
          closestPoint = center;
          snapInfo = { shapeId: shape.id };
        }
      }
    });

    return closestPoint
      ? {
          point: closestPoint,
          snapMode: SnapMode.CENTER,
          distance: minDistance,
          snapInfo,
        }
      : null;
  };

  /**
   * Find node snap (any point of polylines, polygons, splines)
   */
  const findNodeSnap = (cursorPosition: Point, shapes: Shape[]): SnapResult => {
    let closestPoint: Point | null = null;
    let minDistance = snapThreshold / scale;
    let snapInfo = {};

    shapes.forEach((shape) => {
      const { points, type } = shape;

      // For all shape types, check each defined point
      points.forEach((point, index) => {
        const dist = distance(cursorPosition, point);
        if (dist < minDistance) {
          minDistance = dist;
          closestPoint = point;
          snapInfo = { shapeId: shape.id, pointIndex: index };
        }
      });

      // For splines, also check control points if available
      if (type === 'spline' && shape.properties?.controlPoints) {
        shape.properties.controlPoints.forEach((point, index) => {
          const dist = distance(cursorPosition, point);
          if (dist < minDistance) {
            minDistance = dist;
            closestPoint = point;
            snapInfo = {
              shapeId: shape.id,
              pointIndex: index,
              isControlPoint: true,
            };
          }
        });
      }
    });

    return closestPoint
      ? {
          point: closestPoint,
          snapMode: SnapMode.NODE,
          distance: minDistance,
          snapInfo,
        }
      : null;
  };

  /**
   * Find quadrant snap (north, south, east, west points on circles and arcs)
   */
  const findQuadrantSnap = (
    cursorPosition: Point,
    shapes: Shape[]
  ): SnapResult => {
    let closestPoint: Point | null = null;
    let minDistance = snapThreshold / scale;
    let snapInfo: any = {};

    shapes.forEach((shape) => {
      const { points, type, properties } = shape;

      // Only for circles, arcs, and ellipses
      if (
        (type === 'circle' || type === 'arc' || type === 'ellipse') &&
        points.length > 0
      ) {
        const center = points[0]; // Center point
        let radius = properties?.radius || 0;
        const radiusX = properties?.radiusX || radius;
        const radiusY = properties?.radiusY || radius;

        // Calculate quadrant points
        const quadrants: { point: Point; quadrant: 'n' | 's' | 'e' | 'w' }[] = [
          { point: { x: center.x, y: center.y + radiusY }, quadrant: 'n' }, // North
          { point: { x: center.x, y: center.y - radiusY }, quadrant: 's' }, // South
          { point: { x: center.x + radiusX, y: center.y }, quadrant: 'e' }, // East
          { point: { x: center.x - radiusX, y: center.y }, quadrant: 'w' }, // West
        ];

        // Apply rotation for ellipses
        if (type === 'ellipse' && properties?.rotation) {
          const rotation = properties.rotation;
          quadrants.forEach((q) => {
            const dx = q.point.x - center.x;
            const dy = q.point.y - center.y;
            q.point.x =
              center.x + dx * Math.cos(rotation) - dy * Math.sin(rotation);
            q.point.y =
              center.y + dx * Math.sin(rotation) + dy * Math.cos(rotation);
          });
        }

        // Check each quadrant point
        quadrants.forEach((q) => {
          // For arcs, only consider quadrants within the arc's angle range
          if (type === 'arc') {
            const startAngle = properties?.startAngle || 0;
            const endAngle = properties?.endAngle || Math.PI * 2;
            const pointAngle = Math.atan2(
              q.point.y - center.y,
              q.point.x - center.x
            );

            // Skip if point is not within arc angles
            let angleInRange = false;
            if (endAngle > startAngle) {
              angleInRange = pointAngle >= startAngle && pointAngle <= endAngle;
            } else {
              angleInRange = pointAngle >= startAngle || pointAngle <= endAngle;
            }

            if (!angleInRange) return;
          }

          const dist = distance(cursorPosition, q.point);
          if (dist < minDistance) {
            minDistance = dist;
            closestPoint = q.point;
            snapInfo = { shapeId: shape.id, quadrant: q.quadrant };
          }
        });
      }
    });

    return closestPoint
      ? {
          point: closestPoint,
          snapMode: SnapMode.QUADRANT,
          distance: minDistance,
          snapInfo,
        }
      : null;
  };

  /**
   * Find intersection snap (where two shapes intersect)
   */
  const findIntersectionSnap = (
    cursorPosition: Point,
    shapes: Shape[]
  ): SnapResult => {
    let closestPoint: Point | null = null;
    let minDistance = snapThreshold / scale;
    let snapInfo = {};

    // For each pair of shapes
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const shape1 = shapes[i];
        const shape2 = shapes[j];

        // Find intersections based on shape types
        const intersections = findShapeIntersections(shape1, shape2);

        // Check each intersection point
        intersections.forEach((point) => {
          const dist = distance(cursorPosition, point);
          if (dist < minDistance) {
            minDistance = dist;
            closestPoint = point;
            snapInfo = { shapeId1: shape1.id, shapeId2: shape2.id };
          }
        });
      }
    }

    return closestPoint
      ? {
          point: closestPoint,
          snapMode: SnapMode.INTERSECTION,
          distance: minDistance,
          snapInfo,
        }
      : null;
  };

  /**
   * Find shape intersections between two shapes
   */
  const findShapeIntersections = (shape1: Shape, shape2: Shape): Point[] => {
    const intersections: Point[] = [];

    // Line - Line intersection
    if (shape1.type === 'line' && shape2.type === 'line') {
      const line1 = { p1: shape1.points[0], p2: shape1.points[1] };
      const line2 = { p1: shape2.points[0], p2: shape2.points[1] };

      const intersection = findLineLineIntersection(
        line1.p1,
        line1.p2,
        line2.p1,
        line2.p2
      );
      if (intersection) {
        intersections.push(intersection);
      }
    }

    // Line - Circle intersection
    else if (
      (shape1.type === 'line' && shape2.type === 'circle') ||
      (shape1.type === 'circle' && shape2.type === 'line')
    ) {
      const line = shape1.type === 'line' ? shape1 : shape2;
      const circle = shape1.type === 'circle' ? shape1 : shape2;

      const lineP1 = line.points[0];
      const lineP2 = line.points[1];
      const center = circle.points[0];
      const radius = circle.properties?.radius || 0;

      const lineCircleIntersections = findLineCircleIntersection(
        lineP1,
        lineP2,
        center,
        radius
      );
      intersections.push(...lineCircleIntersections);
    }

    // Rectangle - Line intersection
    else if (
      (shape1.type === 'rectangle' && shape2.type === 'line') ||
      (shape1.type === 'line' && shape2.type === 'rectangle')
    ) {
      const line = shape1.type === 'line' ? shape1 : shape2;
      const rect = shape1.type === 'rectangle' ? shape1 : shape2;

      const lineP1 = line.points[0];
      const lineP2 = line.points[1];
      const rectP1 = rect.points[0];
      const rectP2 = rect.points[1];

      // Convert rectangle to four lines and find intersections
      const rectLines = [
        { p1: { x: rectP1.x, y: rectP1.y }, p2: { x: rectP2.x, y: rectP1.y } }, // Top
        { p1: { x: rectP2.x, y: rectP1.y }, p2: { x: rectP2.x, y: rectP2.y } }, // Right
        { p1: { x: rectP2.x, y: rectP2.y }, p2: { x: rectP1.x, y: rectP2.y } }, // Bottom
        { p1: { x: rectP1.x, y: rectP2.y }, p2: { x: rectP1.x, y: rectP1.y } }, // Left
      ];

      rectLines.forEach((rectLine) => {
        const intersection = findLineLineIntersection(
          lineP1,
          lineP2,
          rectLine.p1,
          rectLine.p2
        );
        if (intersection) {
          intersections.push(intersection);
        }
      });
    }

    // Add more intersection types as needed

    return intersections;
  };

  /**
   * Find line-line intersection
   */
  const findLineLineIntersection = (
    p1: Point,
    p2: Point,
    p3: Point,
    p4: Point
  ): Point | null => {
    // Line 1 represented as a1x + b1y = c1
    const a1 = p2.y - p1.y;
    const b1 = p1.x - p2.x;
    const c1 = a1 * p1.x + b1 * p1.y;

    // Line 2 represented as a2x + b2y = c2
    const a2 = p4.y - p3.y;
    const b2 = p3.x - p4.x;
    const c2 = a2 * p3.x + b2 * p3.y;

    const determinant = a1 * b2 - a2 * b1;

    if (determinant === 0) {
      // Lines are parallel
      return null;
    } else {
      const x = (b2 * c1 - b1 * c2) / determinant;
      const y = (a1 * c2 - a2 * c1) / determinant;

      // Check if intersection is on both line segments
      const onSegment1 =
        Math.min(p1.x, p2.x) <= x &&
        x <= Math.max(p1.x, p2.x) &&
        Math.min(p1.y, p2.y) <= y &&
        y <= Math.max(p1.y, p2.y);

      const onSegment2 =
        Math.min(p3.x, p4.x) <= x &&
        x <= Math.max(p3.x, p4.x) &&
        Math.min(p3.y, p4.y) <= y &&
        y <= Math.max(p3.y, p4.y);

      if (onSegment1 && onSegment2) {
        return { x, y };
      }

      return null;
    }
  };

  /**
   * Find line-circle intersection
   */
  const findLineCircleIntersection = (
    p1: Point,
    p2: Point,
    center: Point,
    radius: number
  ): Point[] => {
    const intersections: Point[] = [];

    // Convert line to parametric form: p = p1 + t(p2-p1)
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // Quadratic coefficients
    const a = dx * dx + dy * dy;
    const b = 2 * (dx * (p1.x - center.x) + dy * (p1.y - center.y));
    const c =
      (p1.x - center.x) * (p1.x - center.x) +
      (p1.y - center.y) * (p1.y - center.y) -
      radius * radius;

    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      // No intersection
      return intersections;
    }

    // Find solutions for t
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

    // Check if intersections are on the line segment
    if (t1 >= 0 && t1 <= 1) {
      intersections.push({
        x: p1.x + t1 * dx,
        y: p1.y + t1 * dy,
      });
    }

    if (t2 >= 0 && t2 <= 1) {
      intersections.push({
        x: p1.x + t2 * dx,
        y: p1.y + t2 * dy,
      });
    }

    return intersections;
  };

  /**
   * Find extension snap (extension of lines in their direction)
   */
  const findExtensionSnap = (
    cursorPosition: Point,
    shapes: Shape[]
  ): SnapResult => {
    let closestPoint: Point | null = null;
    let minDistance = snapThreshold / scale;
    let snapInfo = {};

    shapes.forEach((shape) => {
      const { points, type } = shape;

      // For lines
      if (type === 'line' && points.length === 2) {
        const p1 = points[0];
        const p2 = points[1];

        // Find projection of cursor onto the line
        const projection = projectPointOnLine(cursorPosition, p1, p2);

        // Check if projection is outside the line segment (extended)
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const t =
          ((projection.x - p1.x) * dx + (projection.y - p1.y) * dy) /
          (dx * dx + dy * dy);

        // Only count as extension if point is outside the line segment
        if (t < 0 || t > 1) {
          const dist = distance(cursorPosition, projection);
          if (dist < minDistance) {
            minDistance = dist;
            closestPoint = projection;
            snapInfo = { shapeId: shape.id, isExtension: true, t };
          }
        }
      }

      // For polylines, check each segment
      else if (
        (type === 'polyline' || type === 'polygon') &&
        points.length > 1
      ) {
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];

          // Find projection of cursor onto the line segment
          const projection = projectPointOnLine(cursorPosition, p1, p2);

          // Check if projection is outside the line segment (extended)
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const t =
            ((projection.x - p1.x) * dx + (projection.y - p1.y) * dy) /
            (dx * dx + dy * dy);

          // Only count as extension if point is outside the line segment
          if (t < 0 || t > 1) {
            const dist = distance(cursorPosition, projection);
            if (dist < minDistance) {
              minDistance = dist;
              closestPoint = projection;
              snapInfo = {
                shapeId: shape.id,
                pointIndex: i,
                isExtension: true,
                t,
              };
            }
          }
        }
      }
    });

    return closestPoint
      ? {
          point: closestPoint,
          snapMode: SnapMode.EXTENSION,
          distance: minDistance,
          snapInfo,
        }
      : null;
  };

  /**
   * Find perpendicular snap (perpendicular point on a line)
   */
  const findPerpendicularSnap = (
    cursorPosition: Point,
    shapes: Shape[]
  ): SnapResult => {
    let closestPoint: Point | null = null;
    let minDistance = snapThreshold / scale;
    let snapInfo = {};

    shapes.forEach((shape) => {
      const { points, type } = shape;

      // For lines
      if (type === 'line' && points.length === 2) {
        const p1 = points[0];
        const p2 = points[1];

        // Find projection of cursor onto the line (perpendicular point)
        const projection = projectPointOnLine(cursorPosition, p1, p2);

        // Check if projection is on the line segment
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const t =
          ((projection.x - p1.x) * dx + (projection.y - p1.y) * dy) /
          (dx * dx + dy * dy);

        if (t >= 0 && t <= 1) {
          const dist = distance(cursorPosition, projection);
          if (dist < minDistance) {
            minDistance = dist;
            closestPoint = projection;
            snapInfo = { shapeId: shape.id, t };
          }
        }
      }

      // For polylines, check each segment
      else if (
        (type === 'polyline' || type === 'polygon') &&
        points.length > 1
      ) {
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];

          // Find projection of cursor onto the line segment (perpendicular point)
          const projection = projectPointOnLine(cursorPosition, p1, p2);

          // Check if projection is on the line segment
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const t =
            ((projection.x - p1.x) * dx + (projection.y - p1.y) * dy) /
            (dx * dx + dy * dy);

          if (t >= 0 && t <= 1) {
            const dist = distance(cursorPosition, projection);
            if (dist < minDistance) {
              minDistance = dist;
              closestPoint = projection;
              snapInfo = { shapeId: shape.id, pointIndex: i, t };
            }
          }
        }
      }

      // For rectangles, check all four sides
      else if (type === 'rectangle' && points.length === 2) {
        const p1 = points[0];
        const p2 = points[1];

        // Create four sides of the rectangle
        const sides = [
          { p1: { x: p1.x, y: p1.y }, p2: { x: p2.x, y: p1.y } }, // Top
          { p1: { x: p2.x, y: p1.y }, p2: { x: p2.x, y: p2.y } }, // Right
          { p1: { x: p2.x, y: p2.y }, p2: { x: p1.x, y: p2.y } }, // Bottom
          { p1: { x: p1.x, y: p2.y }, p2: { x: p1.x, y: p1.y } }, // Left
        ];

        sides.forEach((side, i) => {
          const projection = projectPointOnLine(
            cursorPosition,
            side.p1,
            side.p2
          );

          // Check if projection is on the line segment
          const dx = side.p2.x - side.p1.x;
          const dy = side.p2.y - side.p1.y;
          const t =
            ((projection.x - side.p1.x) * dx +
              (projection.y - side.p1.y) * dy) /
            (dx * dx + dy * dy);

          if (t >= 0 && t <= 1) {
            const dist = distance(cursorPosition, projection);
            if (dist < minDistance) {
              minDistance = dist;
              closestPoint = projection;
              snapInfo = { shapeId: shape.id, sideIndex: i };
            }
          }
        });
      }
    });

    return closestPoint
      ? {
          point: closestPoint,
          snapMode: SnapMode.PERPENDICULAR,
          distance: minDistance,
          snapInfo,
        }
      : null;
  };

  /**
   * Project a point onto a line
   */
  const projectPointOnLine = (
    point: Point,
    lineP1: Point,
    lineP2: Point
  ): Point => {
    const dx = lineP2.x - lineP1.x;
    const dy = lineP2.y - lineP1.y;

    // Handle vertical line case
    if (Math.abs(dx) < 1e-10) {
      return { x: lineP1.x, y: point.y };
    }

    // Handle horizontal line case
    if (Math.abs(dy) < 1e-10) {
      return { x: point.x, y: lineP1.y };
    }

    // General case
    const t =
      ((point.x - lineP1.x) * dx + (point.y - lineP1.y) * dy) /
      (dx * dx + dy * dy);
    return {
      x: lineP1.x + t * dx,
      y: lineP1.y + t * dy,
    };
  };

  /**
   * Find tangent snap (tangent from point to circles, arcs, ellipses)
   */
  const findTangentSnap = (
    cursorPosition: Point,
    shapes: Shape[]
  ): SnapResult => {
    let closestPoint: Point | null = null;
    let minDistance = snapThreshold / scale;
    let snapInfo = {};

    shapes.forEach((shape) => {
      const { points, type, properties } = shape;

      // Only for circles, arcs, and ellipses
      if ((type === 'circle' || type === 'arc') && points.length > 0) {
        const center = points[0];
        const radius = properties?.radius || 0;

        // Calculate distance from cursor to center
        const distToCenter = distance(cursorPosition, center);

        // Tangent points exist only if cursor is outside the circle
        if (distToCenter > radius) {
          // Calculate tangent points
          const dx = cursorPosition.x - center.x;
          const dy = cursorPosition.y - center.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          // Calculate angle between center-to-cursor line and tangent
          const tangentAngle = Math.asin(radius / dist);

          // Calculate two tangent points
          const tangentPoints = [
            {
              x:
                center.x +
                radius * Math.cos(angle + Math.PI / 2 - tangentAngle),
              y:
                center.y +
                radius * Math.sin(angle + Math.PI / 2 - tangentAngle),
            },
            {
              x:
                center.x +
                radius * Math.cos(angle - Math.PI / 2 + tangentAngle),
              y:
                center.y +
                radius * Math.sin(angle - Math.PI / 2 + tangentAngle),
            },
          ];

          // For arcs, filter out tangent points outside the arc's angle range
          if (type === 'arc') {
            const startAngle = properties?.startAngle || 0;
            const endAngle = properties?.endAngle || Math.PI * 2;

            tangentPoints.forEach((point, i) => {
              const pointAngle = Math.atan2(
                point.y - center.y,
                point.x - center.x
              );
              let angleInRange = false;

              if (endAngle > startAngle) {
                angleInRange =
                  pointAngle >= startAngle && pointAngle <= endAngle;
              } else {
                angleInRange =
                  pointAngle >= startAngle || pointAngle <= endAngle;
              }

              if (!angleInRange) {
                tangentPoints.splice(i, 1);
              }
            });
          }

          // Find closest tangent point to cursor
          tangentPoints.forEach((point, i) => {
            const dist = distance(cursorPosition, point);
            if (dist < minDistance) {
              minDistance = dist;
              closestPoint = point;
              snapInfo = { shapeId: shape.id, tangentIndex: i };
            }
          });
        }
      }

      // Add ellipse tangent calculation if needed
    });

    return closestPoint
      ? {
          point: closestPoint,
          snapMode: SnapMode.TANGENT,
          distance: minDistance,
          snapInfo,
        }
      : null;
  };

  /**
   * Find nearest snap (closest point on any shape)
   */
  const findNearestSnap = (
    cursorPosition: Point,
    shapes: Shape[]
  ): SnapResult => {
    let closestPoint: Point | null = null;
    let minDistance = snapThreshold / scale;
    let snapInfo = {};

    shapes.forEach((shape) => {
      const { points, type, properties } = shape;

      // For lines, find nearest point on the line
      if (type === 'line' && points.length === 2) {
        const projection = projectPointOnLine(
          cursorPosition,
          points[0],
          points[1]
        );

        // Check if projection is on the line segment
        const dx = points[1].x - points[0].x;
        const dy = points[1].y - points[0].y;
        const t =
          ((projection.x - points[0].x) * dx +
            (projection.y - points[0].y) * dy) /
          (dx * dx + dy * dy);

        if (t >= 0 && t <= 1) {
          const dist = distance(cursorPosition, projection);
          if (dist < minDistance) {
            minDistance = dist;
            closestPoint = projection;
            snapInfo = { shapeId: shape.id, t };
          }
        }
      }

      // For polylines, check each segment
      else if (
        (type === 'polyline' || type === 'polygon') &&
        points.length > 1
      ) {
        for (let i = 0; i < points.length - 1; i++) {
          const projection = projectPointOnLine(
            cursorPosition,
            points[i],
            points[i + 1]
          );

          // Check if projection is on the line segment
          const dx = points[i + 1].x - points[i].x;
          const dy = points[i + 1].y - points[i].y;
          const t =
            ((projection.x - points[i].x) * dx +
              (projection.y - points[i].y) * dy) /
            (dx * dx + dy * dy);

          if (t >= 0 && t <= 1) {
            const dist = distance(cursorPosition, projection);
            if (dist < minDistance) {
              minDistance = dist;
              closestPoint = projection;
              snapInfo = { shapeId: shape.id, pointIndex: i, t };
            }
          }
        }

        // For closed polygons, check the closing segment
        if (type === 'polygon' && points.length > 2) {
          const first = points[0];
          const last = points[points.length - 1];
          const projection = projectPointOnLine(cursorPosition, last, first);

          // Check if projection is on the line segment
          const dx = first.x - last.x;
          const dy = first.y - last.y;
          const t =
            ((projection.x - last.x) * dx + (projection.y - last.y) * dy) /
            (dx * dx + dy * dy);

          if (t >= 0 && t <= 1) {
            const dist = distance(cursorPosition, projection);
            if (dist < minDistance) {
              minDistance = dist;
              closestPoint = projection;
              snapInfo = {
                shapeId: shape.id,
                pointIndex: points.length - 1,
                t,
              };
            }
          }
        }
      }

      // For circles, find nearest point on circumference
      else if (type === 'circle' && points.length > 0) {
        const center = points[0];
        const radius = properties?.radius || 0;

        // Calculate vector from center to cursor
        const dx = cursorPosition.x - center.x;
        const dy = cursorPosition.y - center.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        // Point on circumference
        const nearestPoint = {
          x: center.x + (dx / len) * radius,
          y: center.y + (dy / len) * radius,
        };

        const dist = distance(cursorPosition, nearestPoint);
        if (dist < minDistance) {
          minDistance = dist;
          closestPoint = nearestPoint;
          snapInfo = { shapeId: shape.id };
        }
      }

      // For arcs, find nearest point on arc
      else if (type === 'arc' && points.length > 0) {
        const center = points[0];
        const radius = properties?.radius || 0;
        const startAngle = properties?.startAngle || 0;
        const endAngle = properties?.endAngle || Math.PI * 2;

        // Calculate vector from center to cursor
        const dx = cursorPosition.x - center.x;
        const dy = cursorPosition.y - center.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        // Calculate angle of cursor relative to center
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += Math.PI * 2;

        // Adjust angle to be within the arc's range
        let angleInRange = false;
        if (endAngle > startAngle) {
          angleInRange = angle >= startAngle && angle <= endAngle;
        } else {
          angleInRange = angle >= startAngle || angle <= endAngle;
        }

        let nearestPoint;
        if (angleInRange) {
          // Point on arc
          nearestPoint = {
            x: center.x + (dx / len) * radius,
            y: center.y + (dy / len) * radius,
          };
        } else {
          // Find closest endpoint of arc
          const startPoint = {
            x: center.x + radius * Math.cos(startAngle),
            y: center.y + radius * Math.sin(startAngle),
          };
          const endPoint = {
            x: center.x + radius * Math.cos(endAngle),
            y: center.y + radius * Math.sin(endAngle),
          };

          const distToStart = distance(cursorPosition, startPoint);
          const distToEnd = distance(cursorPosition, endPoint);

          nearestPoint = distToStart < distToEnd ? startPoint : endPoint;
        }

        const dist = distance(cursorPosition, nearestPoint);
        if (dist < minDistance) {
          minDistance = dist;
          closestPoint = nearestPoint;
          snapInfo = { shapeId: shape.id };
        }
      }

      // For rectangles, find nearest point on perimeter
      else if (type === 'rectangle' && points.length === 2) {
        const p1 = points[0];
        const p2 = points[1];

        // Create four sides of the rectangle
        const sides = [
          { p1: { x: p1.x, y: p1.y }, p2: { x: p2.x, y: p1.y } }, // Top
          { p1: { x: p2.x, y: p1.y }, p2: { x: p2.x, y: p2.y } }, // Right
          { p1: { x: p2.x, y: p2.y }, p2: { x: p1.x, y: p2.y } }, // Bottom
          { p1: { x: p1.x, y: p2.y }, p2: { x: p1.x, y: p1.y } }, // Left
        ];

        sides.forEach((side, i) => {
          const projection = projectPointOnLine(
            cursorPosition,
            side.p1,
            side.p2
          );

          // Check if projection is on the line segment
          const dx = side.p2.x - side.p1.x;
          const dy = side.p2.y - side.p1.y;
          const t =
            ((projection.x - side.p1.x) * dx +
              (projection.y - side.p1.y) * dy) /
            (dx * dx + dy * dy);

          if (t >= 0 && t <= 1) {
            const dist = distance(cursorPosition, projection);
            if (dist < minDistance) {
              minDistance = dist;
              closestPoint = projection;
              snapInfo = { shapeId: shape.id, sideIndex: i };
            }
          }
        });
      }
    });

    return closestPoint
      ? {
          point: closestPoint,
          snapMode: SnapMode.NEAREST,
          distance: minDistance,
          snapInfo,
        }
      : null;
  };

  /**
   * Find grid snap (closest grid point)
   */
  const findGridSnap = (cursorPosition: Point): SnapResult => {
    const gridSize = snapSettings.gridSize / scale;

    // Snap to nearest grid point
    const snappedPoint = {
      x: Math.round(cursorPosition.x / gridSize) * gridSize,
      y: Math.round(cursorPosition.y / gridSize) * gridSize,
    };

    const dist = distance(cursorPosition, snappedPoint);

    return {
      point: snappedPoint,
      snapMode: SnapMode.GRID,
      distance: dist,
    };
  };

  /**
   * Find the best snap based on cursor position and active snap modes
   */

  const findSnap = (cursorPosition: Point): SnapResult => {
    if (!snapSettings.enabled) return null;

    let bestSnap: SnapResult | null = null;

    // Check each enabled snap mode
    if (snapModes.has(SnapMode.ENDPOINT)) {
      const snap = findEndpointSnap(cursorPosition, shapes);
      // @ts-ignore
      if (snap && (!bestSnap || snap.distance < bestSnap.distance)) {
        bestSnap = snap;
      }
    }

    if (snapModes.has(SnapMode.MIDPOINT)) {
      const snap = findMidpointSnap(cursorPosition, shapes);
      if (snap && (!bestSnap || snap.distance < bestSnap.distance)) {
        bestSnap = snap;
      }
    }

    if (snapModes.has(SnapMode.CENTER)) {
      const snap = findCenterSnap(cursorPosition, shapes);
      if (snap && (!bestSnap || snap.distance < bestSnap.distance)) {
        bestSnap = snap;
      }
    }

    if (snapModes.has(SnapMode.NODE)) {
      const snap = findNodeSnap(cursorPosition, shapes);
      if (snap && (!bestSnap || snap.distance < bestSnap.distance)) {
        bestSnap = snap;
      }
    }

    if (snapModes.has(SnapMode.QUADRANT)) {
      const snap = findQuadrantSnap(cursorPosition, shapes);
      if (snap && (!bestSnap || snap.distance < bestSnap.distance)) {
        bestSnap = snap;
      }
    }

    if (snapModes.has(SnapMode.INTERSECTION)) {
      const snap = findIntersectionSnap(cursorPosition, shapes);
      if (snap && (!bestSnap || snap.distance < bestSnap.distance)) {
        bestSnap = snap;
      }
    }

    if (snapModes.has(SnapMode.EXTENSION)) {
      const snap = findExtensionSnap(cursorPosition, shapes);
      if (snap && (!bestSnap || snap.distance < bestSnap.distance)) {
        bestSnap = snap;
      }
    }

    if (snapModes.has(SnapMode.PERPENDICULAR)) {
      const snap = findPerpendicularSnap(cursorPosition, shapes);
      if (snap && (!bestSnap || snap.distance < bestSnap.distance)) {
        bestSnap = snap;
      }
    }

    if (snapModes.has(SnapMode.TANGENT)) {
      const snap = findTangentSnap(cursorPosition, shapes);
      if (snap && (!bestSnap || snap.distance < bestSnap.distance)) {
        bestSnap = snap;
      }
    }

    if (snapModes.has(SnapMode.NEAREST)) {
      const snap = findNearestSnap(cursorPosition, shapes);
      if (snap && (!bestSnap || snap.distance < bestSnap.distance)) {
        bestSnap = snap;
      }
    }

    if (snapModes.has(SnapMode.GRID)) {
      const snap = findGridSnap(cursorPosition);
      if (snap && (!bestSnap || snap.distance < bestSnap.distance)) {
        bestSnap = snap;
      }
    }

    return bestSnap;
  };

  /**
   * Handle cursor movement to find and set active snap
   */
  const handleCursorMove = (screenPoint: Point) => {
    const worldPoint = canvasToWorld({ point: screenPoint, offset, scale });
    const snap = findSnap(worldPoint);
    setActiveSnapResult(snap);
    return snap ? snap.point : worldPoint;
  };

  /**
   * Clear active snap
   */
  const clearSnap = () => {
    setActiveSnapResult(null);
  };

  // Return public API
  return {
    activeSnapResult,
    handleCursorMove,
    clearSnap,
  };
};
