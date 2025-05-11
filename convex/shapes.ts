import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { mutation, query } from './_generated/server';
import { asyncMap } from 'convex-helpers';

export const getShapesByProject = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    return await ctx.db
      .query('shapes')
      .withIndex('projectId', (q) => q.eq('projectId', args.projectId))
      .collect();
  },
});

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    type: v.string(),
    points: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
      })
    ),
    properties: v.object({
      strokeColor: v.optional(v.string()),
      strokeWidth: v.optional(v.number()),
      fillColor: v.optional(v.string()),
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
      startAngle: v.optional(v.number()),
      endAngle: v.optional(v.number()),
      radiusX: v.optional(v.number()),
      radiusY: v.optional(v.number()),
      isFullEllipse: v.optional(v.boolean()),
      tension: v.optional(v.number()),
      sides: v.optional(v.number()),
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
      controlPoints: v.optional(
        v.array(v.object({ x: v.number(), y: v.number() }))
      ),
      isClockwise: v.optional(v.boolean()),
      isClosed: v.optional(v.boolean()),
      rotation: v.optional(v.number()),
      isCompleted: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    return await ctx.db.insert('shapes', {
      userId,
      projectId: args.projectId,
      type: args.type,
      points: args.points,
      properties: args.properties,
    });
  },
});

export const update = mutation({
  args: {
    shapeId: v.id('shapes'),
    points: v.optional(
      v.array(
        v.object({
          x: v.number(),
          y: v.number(),
        })
      )
    ),
    properties: v.object({
      strokeColor: v.optional(v.string()),
      strokeWidth: v.optional(v.number()),
      fillColor: v.optional(v.string()),
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
      startAngle: v.optional(v.number()),
      endAngle: v.optional(v.number()),
      radiusX: v.optional(v.number()),
      radiusY: v.optional(v.number()),
      isFullEllipse: v.optional(v.boolean()),
      tension: v.optional(v.number()),
      sides: v.optional(v.number()),
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
      controlPoints: v.optional(
        v.array(v.object({ x: v.number(), y: v.number() }))
      ),
      isClockwise: v.optional(v.boolean()),
      isClosed: v.optional(v.boolean()),
      rotation: v.optional(v.number()),
      isCompleted: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const shape = await ctx.db.get(args.shapeId);

    if (!shape) {
      throw new Error(`Shape not found`);
    }

    // Update the shape
    const updates: any = {};
    if (args.points) updates.points = args.points;
    if (args.properties) updates.properties = args.properties;

    return await ctx.db.patch(shape._id, updates);
  },
});

export const deleteShape = mutation({
  args: {
    shapeId: v.id('shapes'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    const shape = await ctx.db.get(args.shapeId);

    if (!shape) {
      throw new Error(`Shape not found`);
    }

    return await ctx.db.delete(shape._id);
  },
});

export const deleteShapes = mutation({
  args: {
    shapeIds: v.array(v.id('shapes')),
  },
  handler: async (ctx, args) => {
    asyncMap(args.shapeIds, async (id) => {
      await ctx.db.delete(id);
    });
  },
});
