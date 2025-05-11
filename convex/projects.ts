import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const getProjectById = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.userId !== authId) {
      throw new Error('Not authorized');
    }

    return project;
  },
});

export const getProjects = query({
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const projects = await ctx.db
      .query('projects')
      .withIndex('userId', (q) => q.eq('userId', authId))
      .collect();

    return projects;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const project = await ctx.db.insert('projects', {
      name: args.name,
      userId: authId,
      starred: false,
    });

    return project;
  },
});

export const update = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.optional(v.string()),
    starred: v.optional(v.boolean()),
    description: v.optional(v.string()),
    lastEdited: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const project = await ctx.db.get(args.projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    await ctx.db.patch(project._id, {
      name: args.name,
      starred: args.starred,
      description: args.description,
      lastEdited: args.lastEdited,
    });

    return project;
  },
});
