import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    heartbeat: v.optional(v.number()),
  }).index('email', ['email']),

  projects: defineTable({
    userId: v.id('users'),
    name: v.string(),
    starred: v.boolean(),
    lastEdited: v.optional(v.number()),
    description: v.optional(v.string()),
  })
    .index('userId', ['userId'])
    .index('name', ['name']),

  layers: defineTable({
    projectId: v.id('projects'),
    name: v.string(),
    color: v.string(),
    lineWidth: v.number(),
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
        x: v.number(),
        y: v.number(),
      })
    ),
    properties: v.object({
      // Common properties
      strokeColor: v.optional(v.string()),
      strokeWidth: v.optional(v.number()),
      fillColor: v.optional(v.string()),

      // Text properties
      textParams: v.optional(
        v.object({
          content: v.optional(v.string()),
          fontSize: v.optional(v.number()),
          fontFamily: v.optional(v.string()),
          fontStyle: v.optional(v.string()),
          fontWeight: v.optional(v.string()),
          rotation: v.optional(v.number()),
          justification: v.optional(v.string()),
        })
      ),

      // Arc properties
      startAngle: v.optional(v.number()),
      endAngle: v.optional(v.number()),

      // Ellipse properties
      radiusX: v.optional(v.number()),
      radiusY: v.optional(v.number()),
      isFullEllipse: v.optional(v.boolean()),

      // Spline properties
      tension: v.optional(v.number()),

      // Polygon properties
      sides: v.optional(v.number()),

      // Dimension properties
      dimensionParams: v.optional(
        v.object({
          dimensionType: v.optional(v.string()),
          offset: v.optional(v.number()),
          extensionLineOffset: v.optional(v.number()),
          arrowSize: v.optional(v.number()),
          textHeight: v.optional(v.number()),
          precision: v.optional(v.number()),
          units: v.optional(v.string()),
          showValue: v.optional(v.boolean()),
          textRotation: v.optional(v.number()),
          value: v.optional(v.number()),
          textPosition: v.optional(
            v.object({
              x: v.number(),
              y: v.number(),
            })
          ),
        })
      ),
      radius: v.optional(v.number()),
      angle: v.optional(v.number()),
      isClockwise: v.optional(v.boolean()),
      isClosed: v.optional(v.boolean()),
      isCompleted: v.optional(v.boolean()),
      rotation: v.optional(v.number()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      length: v.optional(v.number()),
      controlPoints: v.optional(
        v.array(v.object({ x: v.number(), y: v.number() }))
      ),
      degree: v.optional(v.number()),
      knots: v.optional(v.array(v.number())),
      weights: v.optional(v.array(v.number())),
      perimeter: v.optional(v.number()),
      area: v.optional(v.number()),
      diagonal: v.optional(v.number()),
      diameter: v.optional(v.number()),
      circumference: v.optional(v.number()),
      sideLength: v.optional(v.number()),
      internalAngle: v.optional(v.number()),
      arcLength: v.optional(v.number()),
      chordLength: v.optional(v.number()),
      innerRadius: v.optional(v.number()),
      center: v.optional(v.array(v.object({ x: v.number(), y: v.number() }))),
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
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index('projectId', ['projectId'])
    .index('email', ['email']),

  presence: defineTable({
    projectId: v.id('projects'),
    userId: v.id('users'),
    x: v.number(),
    y: v.number(),
    tool: v.optional(v.string()),
    viewport: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
        scale: v.number(),
      })
    ),
    lastUpdated: v.number(),
  })
    .index('projectId', ['projectId'])
    .index('userId', ['userId'])
    .index('projectId_userId', ['projectId', 'userId']),
});
