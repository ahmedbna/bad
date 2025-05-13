import { Point } from '@/types';
import { Doc } from '@/convex/_generated/dataModel';

export function buildAIMessageFromShapes(shapes: Doc<'shapes'>[]): string {
  const filtered = shapes.filter(
    (shape) => shape.type !== 'text' && shape.type !== 'dimension'
  );

  const describePoints = (type: string, points: Point[]) => {
    switch (type) {
      case 'line':
        return `start: (${points[0]?.x.toFixed(2)}, ${points[0]?.y.toFixed(2)}), end: (${points[1]?.x.toFixed(2)}, ${points[1]?.y.toFixed(2)})`;
      case 'rectangle':
        return `corner1: (${points[0]?.x.toFixed(2)}, ${points[0]?.y.toFixed(2)}), corner2: (${points[1]?.x.toFixed(2)}, ${points[1]?.y.toFixed(2)})`;
      case 'circle':
      case 'arc':
      case 'ellipse':
      case 'polygon':
        return `center: (${points[0]?.x.toFixed(2)}, ${points[0]?.y.toFixed(2)})`;
      case 'polyline':
      case 'spline':
        return points
          .map(
            (p, i) => `point ${i + 1}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`
          )
          .join(', ');
      default:
        return points
          .map((p) => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`)
          .join(', ');
    }
  };

  const formatProperties = (props: Record<string, any>): string => {
    return Object.entries(props || {})
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          if (
            value.length > 0 &&
            typeof value[0] === 'object' &&
            'x' in value[0] &&
            'y' in value[0]
          ) {
            const points = value as Point[];
            return `${key}: [${points
              .map((p) => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`)
              .join(', ')}]`;
          } else {
            return `${key}: [${value.join(', ')}]`;
          }
        } else {
          return `${key}: ${value}`;
        }
      })
      .join(', ');
  };

  const messageLines = filtered.map((shape, index) => {
    const { type, points, properties } = shape;

    const pointDescription = describePoints(type, points);
    const formattedProps = formatProperties(properties);

    return `Shape ${index + 1}:
- Type: ${type}
- Points: ${pointDescription}
- Properties: ${formattedProps}`;
  });

  return `You are given the following shapes:\n\n${messageLines.join('\n\n')}`;
}
