import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const get = query({
  args: {
    layerId: v.id('layers'),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const layer = await ctx.db.get(args.layerId);

    if (!layer) {
      throw new Error('Layer not found');
    }

    return layer;
  },
});

export const createLayer = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
    color: v.string(),
    lineWidth: v.number(),
    lineType: v.string(),
    isVisible: v.boolean(),
    isLocked: v.boolean(),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    // Check if user has access to this project
    const projectAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', authId)
      )
      .unique();

    if (!projectAccess) {
      throw new Error('Not authorized to create layers in this project');
    }

    return await ctx.db.insert('layers', {
      projectId: args.projectId,
      name: args.name,
      color: args.color,
      lineWidth: args.lineWidth ?? 1,
      lineType: args.lineType ?? 'solid',
      isVisible: args.isVisible ?? true,
      isLocked: args.isLocked ?? false,
    });
  },
});

export const updateLayer = mutation({
  args: {
    layerId: v.id('layers'),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    lineWidth: v.optional(v.number()),
    lineType: v.optional(v.string()),
    isVisible: v.optional(v.boolean()),
    isLocked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const layer = await ctx.db.get(args.layerId);

    if (!layer) {
      throw new Error('Layer not found');
    }

    // Check if user has access to this project
    const projectAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', layer.projectId).eq('userId', authId)
      )
      .unique();

    if (!projectAccess) {
      throw new Error('Not authorized to update layers in this project');
    }

    return await ctx.db.patch(args.layerId, {
      ...(args.name && { name: args.name }),
      ...(args.color && { color: args.color }),
      ...(args.lineWidth && { lineWidth: args.lineWidth }),
      ...(args.lineType && { lineType: args.lineType }),
      ...(args.isVisible !== undefined && { isVisible: args.isVisible }),
      ...(args.isLocked !== undefined && { isLocked: args.isLocked }),
    });
  },
});

export const deleteLayer = mutation({
  args: {
    layerId: v.id('layers'),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const layer = await ctx.db.get(args.layerId);

    if (!layer) {
      throw new Error('Layer not found');
    }

    // Check if this is the last layer
    const layersInProject = await ctx.db
      .query('layers')
      .withIndex('projectId', (q) => q.eq('projectId', layer.projectId))
      .collect();

    if (layersInProject.length <= 1) {
      throw new Error('Cannot delete the last layer');
    }

    // Check if user has access to this project
    const projectAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', layer.projectId).eq('userId', authId)
      )
      .unique();

    if (!projectAccess) {
      throw new Error('Not authorized to delete layers in this project');
    }

    return await ctx.db.delete(args.layerId);
  },
});

export const getLayersByProject = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    // Check if user has access to this project
    const projectAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', authId)
      )
      .unique();

    if (!projectAccess) {
      throw new Error('Not authorized to access layers in this project');
    }

    return await ctx.db
      .query('layers')
      .withIndex('projectId', (q) => q.eq('projectId', args.projectId))
      .collect();
  },
});

export const createDefaultLayer = mutation({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    // Check if user has access to this project
    const projectAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', authId)
      )
      .unique();

    if (!projectAccess) {
      throw new Error('Not authorized to create layers in this project');
    }

    // Check if default layer already exists
    const existingLayers = await ctx.db
      .query('layers')
      .withIndex('projectId', (q) => q.eq('projectId', args.projectId))
      .collect();

    if (existingLayers.length > 0) {
      return existingLayers[0]._id; // Return existing default layer
    }

    // Create default layer
    return await ctx.db.insert('layers', {
      projectId: args.projectId,
      name: 'Default Layer',
      color: '#FFFFFF', // White default color
      lineWidth: 1,
      lineType: 'solid',
      isVisible: true,
      isLocked: false,
      isDefault: true,
    });
  },
});
