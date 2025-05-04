// Types for our CAD application
export type Point = { x: number; y: number };
export type Line = { type: 'line'; start: Point; end: Point; id: string };
export type Circle = {
  type: 'circle';
  center: Point;
  radius: number;
  id: string;
};
export type Arc = {
  type: 'arc';
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
  id: string;
};
export type PointObject = { type: 'point'; position: Point; id: string };
export type Text = {
  type: 'text';
  position: Point;
  content: string;
  id: string;
};
export type Block = {
  type: 'block';
  position: Point;
  elements: Shape[];
  id: string;
};
export type Polyline = {
  type: 'polyline';
  points: Point[];
  closed: boolean;
  id: string;
};
export type Ellipse = {
  type: 'ellipse';
  center: Point;
  radiusX: number;
  radiusY: number;
  rotation: number;
  id: string;
};

export type Shape =
  | Line
  | Circle
  | Arc
  | PointObject
  | Text
  | Block
  | Polyline
  | Ellipse;

// Snap modes
export enum SnapMode {
  ENDPOINT = 'END',
  MIDPOINT = 'MID',
  CENTER = 'CEN',
  NODE = 'NOD',
  QUADRANT = 'QUA',
  INTERSECTION = 'INT',
  EXTENSION = 'EXT',
  INSERTION = 'INS',
  PERPENDICULAR = 'PER',
  TANGENT = 'TAN',
  NEAREST = 'NEA',
  APPARENT_INTERSECTION = 'APP',
  PARALLEL = 'PAR',
  GEOMETRIC_CENTER = 'GCE',
  NONE = 'NONE',
}

// Configuration for snap behavior
export interface SnapConfig {
  enabled: boolean;
  activeSnapModes: Set<SnapMode>;
  snapDistance: number; // Pixel distance for snap detection
  showSnapPoints: boolean;
  showSnapLines: boolean;
}

// Snap result with information about what was snapped to
export interface SnapResult {
  point: Point;
  snapMode: SnapMode;
  sourceShape?: Shape;
  description: string;
}

// Core Snapping System Class
export class SnapSystem {
  private config: SnapConfig = {
    enabled: true,
    activeSnapModes: new Set([
      SnapMode.ENDPOINT,
      SnapMode.MIDPOINT,
      SnapMode.CENTER,
      SnapMode.INTERSECTION,
    ]),
    snapDistance: 10,
    showSnapPoints: true,
    showSnapLines: true,
  };

  // Track states for complex snaps
  private extensionPoints: Point[] = [];
  private parallelReferenceLines: Line[] = [];

  constructor(config?: Partial<SnapConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Main method to find snap points for a given cursor position
  findSnapPoint(cursorPosition: Point, shapes: Shape[]): SnapResult | null {
    if (!this.config.enabled) return null;

    const snapResults: SnapResult[] = [];

    // Process each active snap mode
    for (const snapMode of this.config.activeSnapModes) {
      let result: SnapResult | null = null;

      switch (snapMode) {
        case SnapMode.ENDPOINT:
          result = this.findEndpointSnap(cursorPosition, shapes);
          break;
        case SnapMode.MIDPOINT:
          result = this.findMidpointSnap(cursorPosition, shapes);
          break;
        case SnapMode.CENTER:
          result = this.findCenterSnap(cursorPosition, shapes);
          break;
        case SnapMode.NODE:
          result = this.findNodeSnap(cursorPosition, shapes);
          break;
        case SnapMode.QUADRANT:
          result = this.findQuadrantSnap(cursorPosition, shapes);
          break;
        case SnapMode.INTERSECTION:
          result = this.findIntersectionSnap(cursorPosition, shapes);
          break;
        case SnapMode.EXTENSION:
          result = this.findExtensionSnap(cursorPosition, shapes);
          break;
        case SnapMode.INSERTION:
          result = this.findInsertionSnap(cursorPosition, shapes);
          break;
        case SnapMode.PERPENDICULAR:
          result = this.findPerpendicularSnap(cursorPosition, shapes);
          break;
        case SnapMode.TANGENT:
          result = this.findTangentSnap(cursorPosition, shapes);
          break;
        case SnapMode.NEAREST:
          result = this.findNearestSnap(cursorPosition, shapes);
          break;
        // case SnapMode.APPARENT_INTERSECTION:
        //   result = this.findApparentIntersectionSnap(cursorPosition, shapes);
        //   break;
        // case SnapMode.PARALLEL:
        //   result = this.findParallelSnap(cursorPosition, shapes);
        //   break;
        // case SnapMode.GEOMETRIC_CENTER:
        //   result = this.findGeometricCenterSnap(cursorPosition, shapes);
        //   break;
      }

      if (result) {
        snapResults.push(result);
      }
    }

    // Return the closest snap point if multiple are found
    if (snapResults.length > 0) {
      return this.findClosestSnapResult(cursorPosition, snapResults);
    }

    return null;
  }

  // Helper to find the closest snap result to cursor
  private findClosestSnapResult(
    cursor: Point,
    results: SnapResult[]
  ): SnapResult {
    return results.reduce((closest, current) => {
      const closestDist = this.distance(cursor, closest.point);
      const currentDist = this.distance(cursor, current.point);
      return currentDist < closestDist ? current : closest;
    });
  }

  // Distance calculation between two points
  private distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  // Check if cursor is within snap distance of a point
  private isInSnapRange(cursor: Point, target: Point): boolean {
    return this.distance(cursor, target) <= this.config.snapDistance;
  }

  // Implementation for ENDPOINT snap
  private findEndpointSnap(cursor: Point, shapes: Shape[]): SnapResult | null {
    for (const shape of shapes) {
      if (shape.type === 'line') {
        // Check line start point
        if (this.isInSnapRange(cursor, shape.start)) {
          return {
            point: shape.start,
            snapMode: SnapMode.ENDPOINT,
            sourceShape: shape,
            description: 'Endpoint',
          };
        }

        // Check line end point
        if (this.isInSnapRange(cursor, shape.end)) {
          return {
            point: shape.end,
            snapMode: SnapMode.ENDPOINT,
            sourceShape: shape,
            description: 'Endpoint',
          };
        }
      } else if (shape.type === 'arc') {
        // Calculate the start and end points of the arc
        const startPoint = {
          x: shape.center.x + shape.radius * Math.cos(shape.startAngle),
          y: shape.center.y + shape.radius * Math.sin(shape.startAngle),
        };

        const endPoint = {
          x: shape.center.x + shape.radius * Math.cos(shape.endAngle),
          y: shape.center.y + shape.radius * Math.sin(shape.endAngle),
        };

        if (this.isInSnapRange(cursor, startPoint)) {
          return {
            point: startPoint,
            snapMode: SnapMode.ENDPOINT,
            sourceShape: shape,
            description: 'Arc Start',
          };
        }

        if (this.isInSnapRange(cursor, endPoint)) {
          return {
            point: endPoint,
            snapMode: SnapMode.ENDPOINT,
            sourceShape: shape,
            description: 'Arc End',
          };
        }
      } else if (shape.type === 'polyline') {
        for (const point of shape.points) {
          if (this.isInSnapRange(cursor, point)) {
            return {
              point,
              snapMode: SnapMode.ENDPOINT,
              sourceShape: shape,
              description: 'Polyline Vertex',
            };
          }
        }
      }
    }

    return null;
  }

  // Implementation for MIDPOINT snap
  private findMidpointSnap(cursor: Point, shapes: Shape[]): SnapResult | null {
    for (const shape of shapes) {
      if (shape.type === 'line') {
        const midpoint = {
          x: (shape.start.x + shape.end.x) / 2,
          y: (shape.start.y + shape.end.y) / 2,
        };

        if (this.isInSnapRange(cursor, midpoint)) {
          return {
            point: midpoint,
            snapMode: SnapMode.MIDPOINT,
            sourceShape: shape,
            description: 'Midpoint',
          };
        }
      } else if (shape.type === 'arc') {
        // Calculate middle angle
        let middleAngle = (shape.startAngle + shape.endAngle) / 2;

        // Handle case when arc crosses 0/360 degrees
        if (shape.endAngle < shape.startAngle) {
          middleAngle = (shape.startAngle + shape.endAngle + 2 * Math.PI) / 2;
          if (middleAngle > 2 * Math.PI) {
            middleAngle -= 2 * Math.PI;
          }
        }

        const midpoint = {
          x: shape.center.x + shape.radius * Math.cos(middleAngle),
          y: shape.center.y + shape.radius * Math.sin(middleAngle),
        };

        if (this.isInSnapRange(cursor, midpoint)) {
          return {
            point: midpoint,
            snapMode: SnapMode.MIDPOINT,
            sourceShape: shape,
            description: 'Arc Midpoint',
          };
        }
      } else if (shape.type === 'polyline') {
        // Check the midpoint of each segment
        for (let i = 0; i < shape.points.length - 1; i++) {
          const midpoint = {
            x: (shape.points[i].x + shape.points[i + 1].x) / 2,
            y: (shape.points[i].y + shape.points[i + 1].y) / 2,
          };

          if (this.isInSnapRange(cursor, midpoint)) {
            return {
              point: midpoint,
              snapMode: SnapMode.MIDPOINT,
              sourceShape: shape,
              description: 'Segment Midpoint',
            };
          }
        }

        // Check last segment if closed
        if (shape.closed && shape.points.length > 2) {
          const last = shape.points.length - 1;
          const midpoint = {
            x: (shape.points[last].x + shape.points[0].x) / 2,
            y: (shape.points[last].y + shape.points[0].y) / 2,
          };

          if (this.isInSnapRange(cursor, midpoint)) {
            return {
              point: midpoint,
              snapMode: SnapMode.MIDPOINT,
              sourceShape: shape,
              description: 'Segment Midpoint',
            };
          }
        }
      }
    }

    return null;
  }

  // Implementation for CENTER snap
  private findCenterSnap(cursor: Point, shapes: Shape[]): SnapResult | null {
    for (const shape of shapes) {
      if (shape.type === 'circle' || shape.type === 'arc') {
        if (this.isInSnapRange(cursor, shape.center)) {
          return {
            point: shape.center,
            snapMode: SnapMode.CENTER,
            sourceShape: shape,
            description:
              shape.type === 'circle' ? 'Circle Center' : 'Arc Center',
          };
        }
      } else if (shape.type === 'ellipse') {
        if (this.isInSnapRange(cursor, shape.center)) {
          return {
            point: shape.center,
            snapMode: SnapMode.CENTER,
            sourceShape: shape,
            description: 'Ellipse Center',
          };
        }
      }
    }

    return null;
  }

  // Implementation for NODE snap
  private findNodeSnap(cursor: Point, shapes: Shape[]): SnapResult | null {
    for (const shape of shapes) {
      if (shape.type === 'point') {
        if (this.isInSnapRange(cursor, shape.position)) {
          return {
            point: shape.position,
            snapMode: SnapMode.NODE,
            sourceShape: shape,
            description: 'Point',
          };
        }
      }
    }

    return null;
  }

  // Implementation for QUADRANT snap
  private findQuadrantSnap(cursor: Point, shapes: Shape[]): SnapResult | null {
    for (const shape of shapes) {
      if (shape.type === 'circle' || shape.type === 'arc') {
        // 0° (right)
        const right = { x: shape.center.x + shape.radius, y: shape.center.y };
        // 90° (top)
        const top = { x: shape.center.x, y: shape.center.y - shape.radius };
        // 180° (left)
        const left = { x: shape.center.x - shape.radius, y: shape.center.y };
        // 270° (bottom)
        const bottom = { x: shape.center.x, y: shape.center.y + shape.radius };

        const quadrants = [
          { point: right, description: 'Quadrant (0°)' },
          { point: top, description: 'Quadrant (90°)' },
          { point: left, description: 'Quadrant (180°)' },
          { point: bottom, description: 'Quadrant (270°)' },
        ];

        for (const quadrant of quadrants) {
          if (this.isInSnapRange(cursor, quadrant.point)) {
            return {
              point: quadrant.point,
              snapMode: SnapMode.QUADRANT,
              sourceShape: shape,
              description: quadrant.description,
            };
          }
        }
      } else if (shape.type === 'ellipse') {
        // Similar quadrants for ellipse, but need to account for rotation
        const cos = Math.cos(shape.rotation);
        const sin = Math.sin(shape.rotation);

        // 0° (right)
        const right = {
          x: shape.center.x + shape.radiusX * cos,
          y: shape.center.y + shape.radiusX * sin,
        };

        // 90° (top)
        const top = {
          x: shape.center.x - shape.radiusY * sin,
          y: shape.center.y + shape.radiusY * cos,
        };

        // 180° (left)
        const left = {
          x: shape.center.x - shape.radiusX * cos,
          y: shape.center.y - shape.radiusX * sin,
        };

        // 270° (bottom)
        const bottom = {
          x: shape.center.x + shape.radiusY * sin,
          y: shape.center.y - shape.radiusY * cos,
        };

        const quadrants = [
          { point: right, description: 'Quadrant (0°)' },
          { point: top, description: 'Quadrant (90°)' },
          { point: left, description: 'Quadrant (180°)' },
          { point: bottom, description: 'Quadrant (270°)' },
        ];

        for (const quadrant of quadrants) {
          if (this.isInSnapRange(cursor, quadrant.point)) {
            return {
              point: quadrant.point,
              snapMode: SnapMode.QUADRANT,
              sourceShape: shape,
              description: quadrant.description,
            };
          }
        }
      }
    }

    return null;
  }

  // Implementation for INTERSECTION snap
  private findIntersectionSnap(
    cursor: Point,
    shapes: Shape[]
  ): SnapResult | null {
    // Build a list of all possible intersections
    const intersections: { point: Point; shapes: [Shape, Shape] }[] = [];

    // Check each pair of shapes for intersections
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const shape1 = shapes[i];
        const shape2 = shapes[j];

        const newIntersections = this.findIntersectionsBetweenShapes(
          shape1,
          shape2
        );
        intersections.push(...newIntersections);
      }
    }

    // Find the closest intersection point to cursor
    for (const intersection of intersections) {
      if (this.isInSnapRange(cursor, intersection.point)) {
        return {
          point: intersection.point,
          snapMode: SnapMode.INTERSECTION,
          sourceShape: intersection.shapes[0], // Using first shape as source
          description: 'Intersection',
        };
      }
    }

    return null;
  }

  // Helper for finding intersections between different shape types
  private findIntersectionsBetweenShapes(
    shape1: Shape,
    shape2: Shape
  ): { point: Point; shapes: [Shape, Shape] }[] {
    const results: { point: Point; shapes: [Shape, Shape] }[] = [];

    // Line-Line intersection
    if (shape1.type === 'line' && shape2.type === 'line') {
      const intersection = this.lineLineIntersection(shape1, shape2);
      if (intersection) {
        results.push({ point: intersection, shapes: [shape1, shape2] });
      }
    }

    // Line-Circle intersection
    else if (
      (shape1.type === 'line' && shape2.type === 'circle') ||
      (shape1.type === 'circle' && shape2.type === 'line')
    ) {
      const line = shape1.type === 'line' ? shape1 : (shape2 as Line);
      const circle = shape1.type === 'circle' ? shape1 : (shape2 as Circle);

      const intersections = this.lineCircleIntersection(line, circle);
      for (const point of intersections) {
        results.push({ point, shapes: [shape1, shape2] });
      }
    }

    // Line-Arc intersection
    else if (
      (shape1.type === 'line' && shape2.type === 'arc') ||
      (shape1.type === 'arc' && shape2.type === 'line')
    ) {
      const line = shape1.type === 'line' ? shape1 : (shape2 as Line);
      const arc = shape1.type === 'arc' ? shape1 : (shape2 as Arc);

      const intersections = this.lineArcIntersection(line, arc);
      for (const point of intersections) {
        results.push({ point, shapes: [shape1, shape2] });
      }
    }

    // Circle-Circle intersection
    else if (shape1.type === 'circle' && shape2.type === 'circle') {
      const intersections = this.circleCircleIntersection(shape1, shape2);
      for (const point of intersections) {
        results.push({ point, shapes: [shape1, shape2] });
      }
    }

    // // Circle-Arc intersection
    // else if (
    //   (shape1.type === 'circle' && shape2.type === 'arc') ||
    //   (shape1.type === 'arc' && shape2.type === 'circle')
    // ) {
    //   const circle = shape1.type === 'circle' ? shape1 : (shape2 as Circle);
    //   const arc = shape1.type === 'arc' ? shape1 : (shape2 as Arc);

    //   const intersections = this.circleArcIntersection(circle, arc);
    //   for (const point of intersections) {
    //     results.push({ point, shapes: [shape1, shape2] });
    //   }
    // }

    // Arc-Arc intersection
    else if (shape1.type === 'arc' && shape2.type === 'arc') {
      const intersections = this.arcArcIntersection(shape1, shape2);
      for (const point of intersections) {
        results.push({ point, shapes: [shape1, shape2] });
      }
    }

    // Polyline intersections
    else if (shape1.type === 'polyline' || shape2.type === 'polyline') {
      const polyline =
        shape1.type === 'polyline' ? shape1 : (shape2 as Polyline);
      const otherShape = shape1.type === 'polyline' ? shape2 : shape1;

      const polylineIntersections = this.findPolylineIntersections(
        polyline,
        otherShape
      );
      for (const point of polylineIntersections) {
        results.push({ point, shapes: [shape1, shape2] });
      }
    }

    return results;
  }
  // Line-Line intersection helper
  private lineLineIntersection(line1: Line, line2: Line): Point | null {
    const x1 = line1.start.x;
    const y1 = line1.start.y;
    const x2 = line1.end.x;
    const y2 = line1.end.y;

    const x3 = line2.start.x;
    const y3 = line2.start.y;
    const x4 = line2.end.x;
    const y4 = line2.end.y;

    // Calculate the denominator
    const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    // Lines are parallel if denominator is 0
    if (denominator === 0) {
      return null;
    }

    // Calculate ua and ub
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    // Check if intersection is within both line segments
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      const x = x1 + ua * (x2 - x1);
      const y = y1 + ua * (y2 - y1);

      return { x, y };
    }

    return null;
  }

  // Line-Circle intersection helper
  private lineCircleIntersection(line: Line, circle: Circle): Point[] {
    const results: Point[] = [];

    // Convert line to parametric form: p = p1 + t(p2-p1)
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;

    // Calculate coefficients for quadratic equation
    const a = dx * dx + dy * dy;
    const b =
      2 *
      (dx * (line.start.x - circle.center.x) +
        dy * (line.start.y - circle.center.y));
    const c =
      (line.start.x - circle.center.x) ** 2 +
      (line.start.y - circle.center.y) ** 2 -
      circle.radius ** 2;

    // Calculate discriminant
    const discriminant = b * b - 4 * a * c;

    // No intersection if discriminant is negative
    if (discriminant < 0) {
      return results;
    }

    // Calculate the two possible t values
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

    // Check if t1 is within the line segment [0,1]
    if (t1 >= 0 && t1 <= 1) {
      results.push({
        x: line.start.x + t1 * dx,
        y: line.start.y + t1 * dy,
      });
    }

    // Check if t2 is within the line segment [0,1]
    if (t2 >= 0 && t2 <= 1 && t1 !== t2) {
      // Avoid duplicate points
      results.push({
        x: line.start.x + t2 * dx,
        y: line.start.y + t2 * dy,
      });
    }

    return results;
  }

  // Line-Arc intersection helper
  private lineArcIntersection(line: Line, arc: Arc): Point[] {
    // First find intersections with the full circle
    const circleIntersections = this.lineCircleIntersection(line, {
      type: 'circle',
      center: arc.center,
      radius: arc.radius,
      id: arc.id,
    });

    // Then filter points to only those within the arc's angle range
    return circleIntersections.filter((point) => {
      // Calculate angle of the point relative to arc center
      const angle = Math.atan2(point.y - arc.center.y, point.x - arc.center.x);

      // Normalize angle to [0, 2π]
      let normalizedAngle = angle;
      if (normalizedAngle < 0) {
        normalizedAngle += 2 * Math.PI;
      }

      // Check if angle is within arc's range
      let startAngle = arc.startAngle;
      let endAngle = arc.endAngle;

      // Normalize angles for comparison
      if (startAngle < 0) startAngle += 2 * Math.PI;
      if (endAngle < 0) endAngle += 2 * Math.PI;

      // Handle case where arc crosses 0°
      if (endAngle < startAngle) {
        return normalizedAngle >= startAngle || normalizedAngle <= endAngle;
      } else {
        return normalizedAngle >= startAngle && normalizedAngle <= endAngle;
      }
    });
  }

  // Arc-Arc intersection helper
  private arcArcIntersection(arc1: Arc, arc2: Arc): Point[] {
    // First find intersections between the full circles
    const circleIntersections = this.circleCircleIntersection(
      { type: 'circle', center: arc1.center, radius: arc1.radius, id: arc1.id },
      { type: 'circle', center: arc2.center, radius: arc2.radius, id: arc2.id }
    );

    // Then filter points to only those within both arcs' angle ranges
    return circleIntersections.filter((point) => {
      // Check if point is within first arc's range
      const angle1 = Math.atan2(
        point.y - arc1.center.y,
        point.x - arc1.center.x
      );

      // Normalize angle to [0, 2π]
      let normalizedAngle1 = angle1;
      if (normalizedAngle1 < 0) normalizedAngle1 += 2 * Math.PI;

      let startAngle1 = arc1.startAngle;
      let endAngle1 = arc1.endAngle;
      if (startAngle1 < 0) startAngle1 += 2 * Math.PI;
      if (endAngle1 < 0) endAngle1 += 2 * Math.PI;

      let inArc1: boolean;
      if (endAngle1 < startAngle1) {
        inArc1 =
          normalizedAngle1 >= startAngle1 || normalizedAngle1 <= endAngle1;
      } else {
        inArc1 =
          normalizedAngle1 >= startAngle1 && normalizedAngle1 <= endAngle1;
      }

      if (!inArc1) return false;

      // Check if point is within second arc's range
      const angle2 = Math.atan2(
        point.y - arc2.center.y,
        point.x - arc2.center.x
      );

      let normalizedAngle2 = angle2;
      if (normalizedAngle2 < 0) normalizedAngle2 += 2 * Math.PI;

      let startAngle2 = arc2.startAngle;
      let endAngle2 = arc2.endAngle;
      if (startAngle2 < 0) startAngle2 += 2 * Math.PI;
      if (endAngle2 < 0) endAngle2 += 2 * Math.PI;

      if (endAngle2 < startAngle2) {
        return normalizedAngle2 >= startAngle2 || normalizedAngle2 <= endAngle2;
      } else {
        return normalizedAngle2 >= startAngle2 && normalizedAngle2 <= endAngle2;
      }
    });
  }

  // Helper for finding polyline intersections with other shapes
  private findPolylineIntersections(
    polyline: Polyline,
    otherShape: Shape
  ): Point[] {
    const results: Point[] = [];

    // For each segment in the polyline, treat it as a line and find intersections
    for (let i = 0; i < polyline.points.length - 1; i++) {
      const lineSegment: Line = {
        type: 'line',
        start: polyline.points[i],
        end: polyline.points[i + 1],
        id: `${polyline.id}-segment-${i}`,
      };

      const segmentIntersections = this.findIntersectionsBetweenShapes(
        lineSegment,
        otherShape
      );
      results.push(
        ...segmentIntersections.map((intersection) => intersection.point)
      );
    }

    // If polyline is closed, check the closing segment
    if (polyline.closed && polyline.points.length > 2) {
      const closingSegment: Line = {
        type: 'line',
        start: polyline.points[polyline.points.length - 1],
        end: polyline.points[0],
        id: `${polyline.id}-segment-closing`,
      };

      const closingIntersections = this.findIntersectionsBetweenShapes(
        closingSegment,
        otherShape
      );
      results.push(
        ...closingIntersections.map((intersection) => intersection.point)
      );
    }

    return results;
  }

  // Implementation for EXTENSION snap
  private findExtensionSnap(cursor: Point, shapes: Shape[]): SnapResult | null {
    // First update our extension points
    this.updateExtensionPoints(cursor, shapes);

    // Check if cursor is near any extension point
    for (const point of this.extensionPoints) {
      if (this.isInSnapRange(cursor, point)) {
        return {
          point,
          snapMode: SnapMode.EXTENSION,
          description: 'Extension',
        };
      }
    }

    return null;
  }

  // Helper to update extension points based on cursor position
  private updateExtensionPoints(cursor: Point, shapes: Shape[]): void {
    // Reset extension points
    this.extensionPoints = [];

    // Extension detection distance (further than snap distance)
    const extensionDetectionDistance = this.config.snapDistance * 5;

    for (const shape of shapes) {
      if (shape.type === 'line') {
        // Check if cursor is near the line (projection)
        const projection = this.projectPointOnLine(cursor, shape);

        // Calculate distances
        const distToProjection = this.distance(cursor, projection);
        const distStartToProjection = this.distance(shape.start, projection);
        const distEndToProjection = this.distance(shape.end, projection);
        const lineLength = this.distance(shape.start, shape.end);

        // If projection is beyond start or end and within detection distance
        if (distToProjection <= extensionDetectionDistance) {
          // Extension beyond start point
          if (
            distStartToProjection + lineLength - distEndToProjection <
            -0.001
          ) {
            // Calculate extension point
            const dx = shape.start.x - shape.end.x;
            const dy = shape.start.y - shape.end.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            const extPoint = {
              x: shape.start.x + (dx / length) * extensionDetectionDistance,
              y: shape.start.y + (dy / length) * extensionDetectionDistance,
            };

            this.extensionPoints.push(extPoint);
          }

          // Extension beyond end point
          if (
            distEndToProjection + lineLength - distStartToProjection <
            -0.001
          ) {
            // Calculate extension point
            const dx = shape.end.x - shape.start.x;
            const dy = shape.end.y - shape.start.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            const extPoint = {
              x: shape.end.x + (dx / length) * extensionDetectionDistance,
              y: shape.end.y + (dy / length) * extensionDetectionDistance,
            };

            this.extensionPoints.push(extPoint);
          }
        }
      }
    }
  }

  // Helper to project a point onto a line
  private projectPointOnLine(point: Point, line: Line): Point {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;
    const lineLength = dx * dx + dy * dy;

    // Avoid division by zero
    if (lineLength === 0) return line.start;

    // Calculate projection ratio
    const t =
      ((point.x - line.start.x) * dx + (point.y - line.start.y) * dy) /
      lineLength;

    // Constrain to line segment
    const tConstrained = Math.max(0, Math.min(1, t));

    return {
      x: line.start.x + tConstrained * dx,
      y: line.start.y + tConstrained * dy,
    };
  }

  // Implementation for INSERTION snap
  private findInsertionSnap(cursor: Point, shapes: Shape[]): SnapResult | null {
    for (const shape of shapes) {
      if (shape.type === 'block' || shape.type === 'text') {
        if (this.isInSnapRange(cursor, shape.position)) {
          return {
            point: shape.position,
            snapMode: SnapMode.INSERTION,
            sourceShape: shape,
            description:
              shape.type === 'block'
                ? 'Block Insertion Point'
                : 'Text Insertion Point',
          };
        }
      }
    }

    return null;
  }

  // Implementation for PERPENDICULAR snap
  private findPerpendicularSnap(
    cursor: Point,
    shapes: Shape[]
  ): SnapResult | null {
    for (const shape of shapes) {
      if (shape.type === 'line') {
        // Calculate perpendicular projection from cursor to line
        const perpPoint = this.perpendicularPointOnLine(cursor, shape);

        // Check if projection is within the line segment
        const onSegment = this.isPointOnLineSegment(perpPoint, shape);

        if (onSegment && this.isInSnapRange(cursor, perpPoint)) {
          return {
            point: perpPoint,
            snapMode: SnapMode.PERPENDICULAR,
            sourceShape: shape,
            description: 'Perpendicular',
          };
        }
      } else if (shape.type === 'circle' || shape.type === 'arc') {
        // For circles and arcs, the perpendicular point is on the line
        // connecting the center to the cursor
        const dx = cursor.x - shape.center.x;
        const dy = cursor.y - shape.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Avoid division by zero
        if (dist === 0) continue;

        const perpPoint = {
          x: shape.center.x + (dx / dist) * shape.radius,
          y: shape.center.y + (dy / dist) * shape.radius,
        };

        // For arcs, check if the point is within the arc's range
        if (shape.type === 'arc') {
          const angle = Math.atan2(
            perpPoint.y - shape.center.y,
            perpPoint.x - shape.center.x
          );
          let normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

          let startAngle = shape.startAngle;
          let endAngle = shape.endAngle;
          if (startAngle < 0) startAngle += 2 * Math.PI;
          if (endAngle < 0) endAngle += 2 * Math.PI;

          let inArc: boolean;
          if (endAngle < startAngle) {
            inArc =
              normalizedAngle >= startAngle || normalizedAngle <= endAngle;
          } else {
            inArc =
              normalizedAngle >= startAngle && normalizedAngle <= endAngle;
          }

          if (!inArc) continue;
        }

        if (this.isInSnapRange(cursor, perpPoint)) {
          return {
            point: perpPoint,
            snapMode: SnapMode.PERPENDICULAR,
            sourceShape: shape,
            description: 'Perpendicular',
          };
        }
      }
    }

    return null;
  }

  // Helper to find perpendicular point on a line
  private perpendicularPointOnLine(point: Point, line: Line): Point {
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;

    // Calculate perpendicular projection
    const t =
      ((point.x - line.start.x) * dx + (point.y - line.start.y) * dy) /
      (dx * dx + dy * dy);

    return {
      x: line.start.x + t * dx,
      y: line.start.y + t * dy,
    };
  }

  // Helper to check if a point is on a line segment
  private isPointOnLineSegment(point: Point, line: Line): boolean {
    // Calculate distances
    const distStartToPoint = this.distance(line.start, point);
    const distEndToPoint = this.distance(line.end, point);
    const lineLength = this.distance(line.start, line.end);

    // Point is on segment if sum of distances equals line length (with small tolerance)
    return Math.abs(distStartToPoint + distEndToPoint - lineLength) < 0.001;
  }

  // Implementation for TANGENT snap
  private findTangentSnap(cursor: Point, shapes: Shape[]): SnapResult | null {
    for (const shape of shapes) {
      if (shape.type === 'circle' || shape.type === 'arc') {
        // Calculate tangent points from cursor to circle/arc
        const tangentPoints = this.tangentPointsFromPointToCircle(
          cursor,
          shape
        );

        // For arcs, filter out tangent points that aren't within the arc's range
        let validTangentPoints = tangentPoints;
        if (shape.type === 'arc') {
          validTangentPoints = tangentPoints.filter((point) => {
            const angle = Math.atan2(
              point.y - shape.center.y,
              point.x - shape.center.x
            );
            let normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

            let startAngle = shape.startAngle;
            let endAngle = shape.endAngle;
            if (startAngle < 0) startAngle += 2 * Math.PI;
            if (endAngle < 0) endAngle += 2 * Math.PI;

            if (endAngle < startAngle) {
              return (
                normalizedAngle >= startAngle || normalizedAngle <= endAngle
              );
            } else {
              return (
                normalizedAngle >= startAngle && normalizedAngle <= endAngle
              );
            }
          });
        }

        // Find the closest tangent point to cursor
        let closestPoint: Point | null = null;
        let minDistance = Infinity;

        for (const point of validTangentPoints) {
          const dist = this.distance(cursor, point);
          if (dist < minDistance && dist <= this.config.snapDistance) {
            minDistance = dist;
            closestPoint = point;
          }
        }

        if (closestPoint) {
          return {
            point: closestPoint,
            snapMode: SnapMode.TANGENT,
            sourceShape: shape,
            description: 'Tangent',
          };
        }
      }
    }

    return null;
  }

  // Helper to find tangent points from a point to a circle
  private tangentPointsFromPointToCircle(
    point: Point,
    circle: Circle | Arc
  ): Point[] {
    const results: Point[] = [];

    // Calculate distance from point to circle center
    const dx = point.x - circle.center.x;
    const dy = point.y - circle.center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If point is inside the circle, no tangent exists
    if (dist <= circle.radius) {
      return results;
    }

    // Calculate tangent points
    const ratio = circle.radius / dist;
    const tangentDist = circle.radius * Math.sqrt(1 - ratio * ratio);

    // Normalize direction vector
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Calculate perpendicular direction
    const perpX = -dirY;
    const perpY = dirX;

    // Calculate the point on line from center to point at distance 'radius'
    const baseX = circle.center.x + dirX * circle.radius;
    const baseY = circle.center.y + dirY * circle.radius;

    // Calculate tangent points by offsetting perpendicular to the base point
    results.push({
      x: baseX + perpX * tangentDist,
      y: baseY + perpY * tangentDist,
    });

    results.push({
      x: baseX - perpX * tangentDist,
      y: baseY - perpY * tangentDist,
    });

    return results;
  }

  // Implementation for NEAREST snap
  private findNearestSnap(cursor: Point, shapes: Shape[]): SnapResult | null {
    let nearestPoint: Point | null = null;
    let minDistance = Infinity;
    let nearestShape: Shape | undefined;

    for (const shape of shapes) {
      let nearestOnShape: Point | null = null;
      let distanceToShape = Infinity;

      if (shape.type === 'line') {
        // For lines, find the nearest point on the line segment
        const projection = this.projectPointOnLine(cursor, shape);
        distanceToShape = this.distance(cursor, projection);
        nearestOnShape = projection;
      } else if (shape.type === 'circle') {
        // For circles, find the nearest point on the circumference
        const dx = cursor.x - shape.center.x;
        const dy = cursor.y - shape.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Avoid division by zero
        if (dist === 0) {
          nearestOnShape = {
            x: shape.center.x + shape.radius,
            y: shape.center.y,
          };
          distanceToShape = shape.radius;
        } else {
          nearestOnShape = {
            x: shape.center.x + (dx / dist) * shape.radius,
            y: shape.center.y + (dy / dist) * shape.radius,
          };
          distanceToShape = Math.abs(dist - shape.radius);
        }
      } else if (shape.type === 'arc') {
        // For arcs, find the nearest point on the arc segment
        const dx = cursor.x - shape.center.x;
        const dy = cursor.y - shape.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calculate the angle from center to cursor
        const angle = Math.atan2(dy, dx);
        let normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

        // Normalize arc angles
        let startAngle = shape.startAngle;
        let endAngle = shape.endAngle;
        if (startAngle < 0) startAngle += 2 * Math.PI;
        if (endAngle < 0) endAngle += 2 * Math.PI;

        // Check if angle is within arc's range
        let inArc: boolean;
        if (endAngle < startAngle) {
          inArc = normalizedAngle >= startAngle || normalizedAngle <= endAngle;
        } else {
          inArc = normalizedAngle >= startAngle && normalizedAngle <= endAngle;
        }

        if (inArc) {
          // Point is in arc's angular range, find nearest on circumference
          nearestOnShape = {
            x: shape.center.x + (dx / dist) * shape.radius,
            y: shape.center.y + (dy / dist) * shape.radius,
          };
          distanceToShape = Math.abs(dist - shape.radius);
        } else {
          // Point is outside arc's angular range, find nearest endpoint
          const startPoint = {
            x: shape.center.x + shape.radius * Math.cos(startAngle),
            y: shape.center.y + shape.radius * Math.sin(startAngle),
          };

          const endPoint = {
            x: shape.center.x + shape.radius * Math.cos(endAngle),
            y: shape.center.y + shape.radius * Math.sin(endAngle),
          };

          const distToStart = this.distance(cursor, startPoint);
          const distToEnd = this.distance(cursor, endPoint);

          if (distToStart < distToEnd) {
            nearestOnShape = startPoint;
            distanceToShape = distToStart;
          } else {
            nearestOnShape = endPoint;
            distanceToShape = distToEnd;
          }
        }
      } else if (shape.type === 'point') {
        // For point objects, the nearest point is just the point itself
        nearestOnShape = shape.position;
        distanceToShape = this.distance(cursor, shape.position);
      } else if (shape.type === 'polyline') {
        // For polylines, find the nearest point on any segment
        let minSegmentDist = Infinity;
        let nearestOnPolyline = null;

        // Check each segment
        for (let i = 0; i < shape.points.length - 1; i++) {
          const segment: Line = {
            type: 'line',
            start: shape.points[i],
            end: shape.points[i + 1],
            id: `${shape.id}-segment-${i}`,
          };

          const projection = this.projectPointOnLine(cursor, segment);
          const distToSegment = this.distance(cursor, projection);

          if (distToSegment < minSegmentDist) {
            minSegmentDist = distToSegment;
            nearestOnPolyline = projection;
          }
        }

        // Check closing segment if polyline is closed
        if (shape.closed && shape.points.length > 2) {
          const closingSegment: Line = {
            type: 'line',
            start: shape.points[shape.points.length - 1],
            end: shape.points[0],
            id: `${shape.id}-segment-closing`,
          };

          const projection = this.projectPointOnLine(cursor, closingSegment);
          const distToSegment = this.distance(cursor, projection);

          if (distToSegment < minSegmentDist) {
            minSegmentDist = distToSegment;
            nearestOnPolyline = projection;
          }
        }

        nearestOnShape = nearestOnPolyline;
        distanceToShape = minSegmentDist;
      }

      // Update overall nearest point if this shape has a closer point
      if (nearestOnShape && distanceToShape < minDistance) {
        minDistance = distanceToShape;
        nearestPoint = nearestOnShape;
        nearestShape = shape;
      }
    }

    // Only return a snap result if within snap distance
    if (nearestPoint && minDistance <= this.config.snapDistance) {
      return {
        point: nearestPoint,
        snapMode: SnapMode.NEAREST,
        sourceShape: nearestShape,
        description: 'Nearest',
      };
    }

    return null;
  }

  // Circle-Circle intersection helper
  private circleCircleIntersection(circle1: Circle, circle2: Circle): Point[] {
    const results: Point[] = [];

    const dx = circle2.center.x - circle1.center.x;
    const dy = circle2.center.y - circle1.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Circles are too far apart, no intersection
    if (distance > circle1.radius + circle2.radius) {
      return results;
    }

    // One circle is inside the other, no intersection
    if (distance < Math.abs(circle1.radius - circle2.radius)) {
      return results;
    }

    // Circles are coincident, infinite intersections but not handled
    if (distance === 0 && circle1.radius === circle2.radius) {
      return results;
    }

    // Calculate intersection points
    const a =
      (circle1.radius * circle1.radius -
        circle2.radius * circle2.radius +
        distance * distance) /
      (2 * distance);

    const h = Math.sqrt(circle1.radius * circle1.radius - a * a);

    const p2x =
      circle1.center.x + (a * (circle2.center.x - circle1.center.x)) / distance;
    const p2y =
      circle1.center.y + (a * (circle2.center.y - circle1.center.y)) / distance;

    // Calculate the two intersection points
    const p3x1 = p2x + (h * (circle2.center.y - circle1.center.y)) / distance;
    const p3y1 = p2y - (h * (circle2.center.x - circle1.center.x)) / distance;

    const p3x2 = p2x - (h * (circle2.center.y - circle1.center.y)) / distance;
    const p3y2 = p2y + (h * (circle2.center.x - circle1.center.x)) / distance;

    // Add first intersection point
    results.push({ x: p3x1, y: p3y1 });

    // Add second intersection point if not coincident with first
    if (
      distance !== circle1.radius + circle2.radius &&
      distance !== Math.abs(circle1.radius - circle2.radius)
    ) {
      results.push({ x: p3x2, y: p3y2 });
    }

    return results;
  }
}
