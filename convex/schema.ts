import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    isAnonymous: v.optional(v.boolean()),
    heartbeat: v.optional(v.float64()),
  }).index('email', ['email']),

  projects: defineTable({
    userId: v.id('users'),
    name: v.string(),
    starred: v.boolean(),
    lastEdited: v.optional(v.float64()),
    description: v.optional(v.string()),
  })
    .index('userId', ['userId'])
    .index('name', ['name']),

  layers: defineTable({
    projectId: v.id('projects'),
    name: v.string(),
    color: v.string(),
    lineWidth: v.float64(),
    lineType: v.string(),
    isVisible: v.boolean(),
    isLocked: v.boolean(),
    isDefault: v.boolean(),
  })
    .index('projectId', ['projectId'])
    .index('projectId_name', ['projectId', 'name'])
    .index('projectId_isDefault', ['projectId', 'isDefault']),

  shapes: defineTable({
    userId: v.id('users'),
    projectId: v.id('projects'),
    layerId: v.id('layers'),
    type: v.string(),
    points: v.array(
      v.object({
        x: v.float64(),
        y: v.float64(),
      })
    ),
    properties: v.object({
      // Common properties
      strokeColor: v.optional(v.string()),
      strokeWidth: v.optional(v.float64()),
      fillColor: v.optional(v.string()),

      // Text properties
      textParams: v.optional(
        v.object({
          content: v.optional(v.string()),
          fontSize: v.optional(v.float64()),
          fontFamily: v.optional(v.string()),
          fontStyle: v.optional(v.string()),
          fontWeight: v.optional(v.string()),
          rotation: v.optional(v.float64()),
          justification: v.optional(v.string()),
        })
      ),

      // Arc properties
      startAngle: v.optional(v.float64()),
      endAngle: v.optional(v.float64()),

      // Ellipse properties
      radiusX: v.optional(v.float64()),
      radiusY: v.optional(v.float64()),
      isFullEllipse: v.optional(v.boolean()),

      // Spline properties
      tension: v.optional(v.float64()),

      // Polygon properties
      sides: v.optional(v.float64()),

      // Dimension properties
      dimensionParams: v.optional(
        v.object({
          dimensionType: v.optional(v.string()),
          offset: v.optional(v.float64()),
          extensionLineOffset: v.optional(v.float64()),
          arrowSize: v.optional(v.float64()),
          textHeight: v.optional(v.float64()),
          precision: v.optional(v.float64()),
          units: v.optional(v.string()),
          showValue: v.optional(v.boolean()),
          textRotation: v.optional(v.float64()),
          value: v.optional(v.float64()),
          textPosition: v.optional(
            v.object({
              x: v.float64(),
              y: v.float64(),
            })
          ),
        })
      ),
      radius: v.optional(v.float64()),
      angle: v.optional(v.float64()),
      isClockwise: v.optional(v.boolean()),
      isClosed: v.optional(v.boolean()),
      isCompleted: v.optional(v.boolean()),
      rotation: v.optional(v.float64()),
      width: v.optional(v.float64()),
      height: v.optional(v.float64()),
      length: v.optional(v.float64()),
      controlPoints: v.optional(
        v.array(v.object({ x: v.float64(), y: v.float64() }))
      ),
      degree: v.optional(v.float64()),
      knots: v.optional(v.array(v.float64())),
      weights: v.optional(v.array(v.float64())),
      perimeter: v.optional(v.float64()),
      area: v.optional(v.float64()),
      diagonal: v.optional(v.float64()),
      diameter: v.optional(v.float64()),
      circumference: v.optional(v.float64()),
      sideLength: v.optional(v.float64()),
      internalAngle: v.optional(v.float64()),
      arcLength: v.optional(v.float64()),
      chordLength: v.optional(v.float64()),
      innerRadius: v.optional(v.float64()),
      center: v.optional(v.array(v.object({ x: v.float64(), y: v.float64() }))),
    }),
  })
    .index('projectId', ['projectId'])
    .index('layerId', ['layerId']),

  collaborators: defineTable({
    projectId: v.id('projects'),
    userId: v.id('users'),
    role: v.union(v.literal('owner'), v.literal('editor'), v.literal('viewer')),
  })
    .index('projectId', ['projectId'])
    .index('userId', ['userId'])
    .index('projectId_userId', ['projectId', 'userId']),

  pendingInvitations: defineTable({
    projectId: v.id('projects'),
    email: v.string(),
    role: v.union(v.literal('editor'), v.literal('viewer')),
    invitedBy: v.id('users'),
    createdAt: v.float64(),
    acceptedAt: v.optional(v.float64()),
  })
    .index('projectId', ['projectId'])
    .index('email', ['email']),

  presence: defineTable({
    projectId: v.id('projects'),
    userId: v.id('users'),
    x: v.float64(),
    y: v.float64(),
    tool: v.optional(v.string()),
    viewport: v.optional(
      v.object({
        x: v.float64(),
        y: v.float64(),
        scale: v.float64(),
      })
    ),
    lastUpdated: v.float64(),
  })
    .index('projectId', ['projectId'])
    .index('userId', ['userId'])
    .index('projectId_userId', ['projectId', 'userId']),
});
