import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, aiShapesMessage, history } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Prepare conversation history for OpenAI
    const formattedHistory = history.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })
    );

    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant inside a CAD (Computer-Aided Design) application. Your job is to help users by drawing new shapes or analyzing existing ones.

## Context
${
  aiShapesMessage
    ? `The user has selected the following shapes:\n\n${aiShapesMessage}`
    : 'There are no selected shapes.'
}

- Coordinate origin (500,500) is at the center of the viewport.

## Instructions
- If the user asks to **draw shapes**, return a short reply and include a JSON array of the shapes using the format below.
- If the user asks to **analyze shapes**, respond with observations, geometric calculations, or visual structure descriptions.

## Shape Formats and Properties

Each shape type has specific point structure requirements and properties:

### Line
- Points: [start, end] - exactly 2 points
- Properties: angle (degrees), length, area (always 0)
\`\`\`json
{
  "type": "line",
  "points": [
    {"x": number, "y": number},  // start point
    {"x": number, "y": number}   // end point
  ],
  "properties": {
    "angle": number,  // angle in degrees
    "length": number, // length of the line
  }
}
\`\`\`

### Rectangle
- Points: exactly 2 points representing opposite corners
- Properties: length, width
\`\`\`json
{
  "type": "rectangle",
  "points": [
    {"x": number, "y": number},  // first corner
    {"x": number, "y": number}   // opposite corner
  ],
  "properties": {
    "length": number,  // length of rectangle
    "width": number    // width of rectangle
  }
}
\`\`\`

### Circle
- Points: exactly 1 point (center)
- Properties: radius
\`\`\`json
{
  "type": "circle",
  "points": [
    {"x": number, "y": number}  // center point
  ],
  "properties": {
    "radius": number  // radius of circle
  }
}
\`\`\`

### Ellipse
- Points: [center] - exactly 1 point
- Properties: radiusX, radiusY, rotation, isFullEllipse
\`\`\`json
{
  "type": "ellipse",
  "points": [
    {"x": number, "y": number}  // center point
  ],
  "properties": {
    "radiusX": number,       // x-axis radius
    "radiusY": number,       // y-axis radius
    "rotation": number,      // rotation angle in radians
    "isFullEllipse": boolean // whether it's a full ellipse
  }
}
\`\`\`

### Polygon
- Points: array of at least 3 vertices in order
- Properties: sides, area, radius, innerRadius, internalAngle
\`\`\`json
{
  "type": "polygon",
  "points": [
    {"x": number, "y": number}  // center point
  ],
  "properties": {
    "sides": number,         // number of sides
    "area": number,          // area of polygon
    "radius": number,        // outer radius (circumscribed circle)
    "innerRadius": number,   // inner radius (inscribed circle)
    "internalAngle": number  // internal angle in degrees
  }
}
\`\`\`

### Polyline
- Points: array of at least 2 points in order
- Properties: length, area (0 if not closed), perimeter, width, isClosed
\`\`\`json
{
  "type": "polyline",
  "points": [
    {"x": number, "y": number},
    {"x": number, "y": number},
    // ... more points
  ],
  "properties": {
    "length": number,     // total length of all segments
    "area": number,       // area (0 if not closed)
    "perimeter": number,  // total perimeter
    "width": number,      // width (bounding box)
    "isClosed": boolean   // whether endpoints connect
  }
}
\`\`\`

### Spline
- Points: array of control points (at least 3 recommended)
- Properties: controlPoints, tension, width, height, perimeter
\`\`\`json
{
  "type": "spline",
  "points": [
    {"x": number, "y": number},
    {"x": number, "y": number},
    {"x": number, "y": number},
    // ... more points
  ],
  "properties": {
    "tension": number,     // spline tension (usually 0.0-1.0)
    "width": number,       // width of bounding box
    "height": number,      // height of bounding box
    "perimeter": number    // approximate perimeter
  }
}
\`\`\`

### Text
- Points: [position] - exactly 1 point for placement
- Properties: content, fontSize, fontFamily, alignment
\`\`\`json
{
  "type": "text",
  "points": [
    {"x": number, "y": number}  // position point
  ],
  "properties": {
    "content": string,        // text content
    "fontSize": number,       // font size
    "fontFamily": string,     // font family
    "alignment": string       // text alignment
  }
}
\`\`\`

## Response Format (when drawing)
\`\`\`json
{
  "shapes": [
    // Array of shape objects following the formats above
  ]
}
\`\`\`

`,
    };

    // Prepare user message
    const userMessage = {
      role: 'user',
      content: message,
    };

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
      messages: [systemMessage, ...formattedHistory, userMessage],
      max_tokens: 5000,
      temperature: 0.7,
      function_call: 'auto',
      functions: [
        {
          name: 'create_shapes',
          description:
            'Create shapes to be drawn on the canvas with appropriate properties',
          parameters: {
            type: 'object',
            properties: {
              shapes: {
                type: 'array',
                description: 'Array of shapes to be drawn',
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: [
                        'line',
                        'rectangle',
                        'circle',
                        'ellipse',
                        'polygon',
                        'polyline',
                        'spline',
                        'text',
                      ],
                      description: 'Type of shape to draw',
                    },
                    points: {
                      type: 'array',
                      description: 'Array of points defining the shape',
                      items: {
                        type: 'object',
                        properties: {
                          x: { type: 'number' },
                          y: { type: 'number' },
                        },
                        required: ['x', 'y'],
                      },
                    },
                    properties: {
                      type: 'object',
                      description: 'Properties specific to the shape type',
                      properties: {
                        // Line properties
                        angle: {
                          type: 'number',
                          description: 'Angle of the line in degrees',
                        },
                        length: {
                          type: 'number',
                          description:
                            'Length of the line or total length of segments',
                        },
                        area: {
                          type: 'number',
                          description: 'Area of the shape (0 for lines)',
                        },

                        // Rectangle properties
                        width: {
                          type: 'number',
                          description: 'Width of the rectangle or bounding box',
                        },

                        // Circle properties
                        radius: {
                          type: 'number',
                          description: 'Radius of the circle or arc',
                        },

                        // Arc properties
                        startAngle: {
                          type: 'number',
                          description: 'Starting angle in radians',
                        },
                        endAngle: {
                          type: 'number',
                          description: 'Ending angle in radians',
                        },
                        isClockwise: {
                          type: 'boolean',
                          description: 'Direction of the arc',
                        },
                        arcLength: {
                          type: 'number',
                          description: 'Length along the arc',
                        },
                        chordLength: {
                          type: 'number',
                          description:
                            'Straight-line distance between endpoints',
                        },
                        perimeter: {
                          type: 'number',
                          description: 'Total perimeter',
                        },

                        // Ellipse properties
                        radiusX: {
                          type: 'number',
                          description: 'X-axis radius of the ellipse',
                        },
                        radiusY: {
                          type: 'number',
                          description: 'Y-axis radius of the ellipse',
                        },
                        rotation: {
                          type: 'number',
                          description: 'Rotation angle in radians',
                        },
                        isFullEllipse: {
                          type: 'boolean',
                          description: 'Whether it is a full ellipse',
                        },

                        // Polygon properties
                        sides: {
                          type: 'number',
                          description: 'Number of sides in the polygon',
                        },
                        innerRadius: {
                          type: 'number',
                          description: 'Inner radius (inscribed circle)',
                        },
                        internalAngle: {
                          type: 'number',
                          description: 'Internal angle in degrees',
                        },

                        // Polyline properties
                        isClosed: {
                          type: 'boolean',
                          description: 'Whether endpoints connect',
                        },

                        // Spline properties
                        controlPoints: {
                          type: 'array',
                          description: 'Control points for the spline',
                          items: {
                            type: 'object',
                            properties: {
                              x: { type: 'number' },
                              y: { type: 'number' },
                            },
                            required: ['x', 'y'],
                          },
                        },
                        tension: {
                          type: 'number',
                          description: 'Spline tension (usually 0.0-1.0)',
                        },
                        height: {
                          type: 'number',
                          description: 'Height of bounding box',
                        },

                        // Text properties
                        content: {
                          type: 'string',
                          description: 'Text content',
                        },
                        fontSize: {
                          type: 'number',
                          description: 'Font size',
                        },
                        fontFamily: {
                          type: 'string',
                          description: 'Font family',
                        },
                        alignment: {
                          type: 'string',
                          description: 'Text alignment',
                          enum: ['left', 'center', 'right'],
                        },
                      },
                    },
                  },
                  required: ['type', 'points', 'properties'],
                  allOf: [
                    // Line validation
                    {
                      if: {
                        properties: { type: { enum: ['line'] } },
                        required: ['type'],
                      },
                      then: {
                        properties: {
                          points: { minItems: 2, maxItems: 2 },
                          properties: {
                            required: ['angle', 'length', 'area'],
                          },
                        },
                      },
                    },
                    // Rectangle validation
                    {
                      if: {
                        properties: { type: { enum: ['rectangle'] } },
                        required: ['type'],
                      },
                      then: {
                        properties: {
                          points: { minItems: 2, maxItems: 2 },
                          properties: {
                            required: ['length', 'width'],
                          },
                        },
                      },
                    },
                    // Circle validation
                    {
                      if: {
                        properties: { type: { enum: ['circle'] } },
                        required: ['type'],
                      },
                      then: {
                        properties: {
                          points: { minItems: 1, maxItems: 1 },
                          properties: {
                            required: ['radius'],
                          },
                        },
                      },
                    },
                    // Arc validation
                    {
                      if: {
                        properties: { type: { enum: ['arc'] } },
                        required: ['type'],
                      },
                      then: {
                        properties: {
                          points: { minItems: 3, maxItems: 3 },
                          properties: {
                            required: [
                              'radius',
                              'startAngle',
                              'endAngle',
                              'isClockwise',
                              'angle',
                              'arcLength',
                              'chordLength',
                              'perimeter',
                            ],
                          },
                        },
                      },
                    },
                    // Ellipse validation
                    {
                      if: {
                        properties: { type: { enum: ['ellipse'] } },
                        required: ['type'],
                      },
                      then: {
                        properties: {
                          points: { minItems: 1, maxItems: 1 },
                          properties: {
                            required: [
                              'radiusX',
                              'radiusY',
                              'rotation',
                              'isFullEllipse',
                            ],
                          },
                        },
                      },
                    },
                    // Polygon validation
                    {
                      if: {
                        properties: { type: { enum: ['polygon'] } },
                        required: ['type'],
                      },
                      then: {
                        properties: {
                          points: { minItems: 3 },
                          properties: {
                            required: [
                              'sides',
                              'area',
                              'radius',
                              'innerRadius',
                              'internalAngle',
                            ],
                          },
                        },
                      },
                    },
                    // Polyline validation
                    {
                      if: {
                        properties: { type: { enum: ['polyline'] } },
                        required: ['type'],
                      },
                      then: {
                        properties: {
                          points: { minItems: 2 },
                          properties: {
                            required: [
                              'length',
                              'area',
                              'perimeter',
                              'width',
                              'isClosed',
                            ],
                          },
                        },
                      },
                    },
                    // Spline validation
                    {
                      if: {
                        properties: { type: { enum: ['spline'] } },
                        required: ['type'],
                      },
                      then: {
                        properties: {
                          points: { minItems: 3 },
                          properties: {
                            required: [
                              'controlPoints',
                              'tension',
                              'width',
                              'height',
                              'perimeter',
                            ],
                          },
                        },
                      },
                    },
                    // Text validation
                    {
                      if: {
                        properties: { type: { enum: ['text'] } },
                        required: ['type'],
                      },
                      then: {
                        properties: {
                          points: { minItems: 1, maxItems: 1 },
                          properties: {
                            required: [
                              'content',
                              'fontSize',
                              'fontFamily',
                              'alignment',
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
            required: ['shapes'],
          },
        },
      ],
    });

    // Extract the assistant's response
    const assistantMessage = response.choices[0].message;
    let shapes = [];
    let aimessage = assistantMessage.content || '';

    // Check if the assistant called a function
    if (assistantMessage.function_call) {
      try {
        const functionArgs = JSON.parse(
          assistantMessage.function_call.arguments
        );
        if (functionArgs.shapes) {
          shapes = functionArgs.shapes;
        }
      } catch (e) {
        console.error('Error parsing function arguments:', e);
      }
    }

    // Return the response
    return NextResponse.json({
      aimessage,
      shapes,
    });
  } catch (error) {
    console.error('Error processing AI chat request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
