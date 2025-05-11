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
    color: v.string(),
    strokWidth: v.string(),
  }),

  shapes: defineTable({
    userId: v.id('users'),
    projectId: v.id('projects'),

    type: v.string(),

    // Array of points with x, y coordinates
    points: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
      })
    ),

    // Various properties associated with different shape types
    properties: v.object({
      radius: v.optional(v.number()),
      controlPoints: v.optional(
        v.array(v.object({ x: v.number(), y: v.number() }))
      ),
      isClockwise: v.optional(v.boolean()),
      isClosed: v.optional(v.boolean()),

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
      isCompleted: v.optional(v.boolean()),
      rotation: v.optional(v.number()),
    }),
  }).index('projectId', ['projectId']),
});
