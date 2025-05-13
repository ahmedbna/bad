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

    const shapes = await ctx.db
      .query('shapes')
      .withIndex('projectId', (q) => q.eq('projectId', args.projectId))
      .collect();

    return await asyncMap(shapes, async (shape) => {
      const layer = await ctx.db.get(shape.layerId);

      if (!layer) {
        throw new Error(`Layer not found for shape ${shape._id}`);
      }

      return {
        ...shape,
        layer,
      };
    });
  },
});

export const getShapesByIds = query({
  args: {
    shapeIds: v.array(v.id('shapes')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    return await asyncMap(args.shapeIds, async (shapeId) => {
      const shape = await ctx.db.get(shapeId);

      if (!shape) {
        throw new Error(`Shape not found`);
      }

      const layer = await ctx.db.get(shape.layerId);

      if (!layer) {
        throw new Error('Layer not found');
      }

      return {
        ...shape,
        layer,
      };
    });
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
    layerId: v.id('layers'),
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
      layerId: args.layerId,
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
    layerId: v.optional(v.id('layers')),
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
    if (args.layerId) updates.layerId = args.layerId;

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
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    await asyncMap(args.shapeIds, async (id) => {
      await ctx.db.delete(id);
    });
  },
});
