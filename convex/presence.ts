import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

// Track user's cursor position and activity in a project
export const updatePresence = mutation({
  args: {
    projectId: v.id('projects'),
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Check if user has access to this project
    const projectAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', userId)
      )
      .unique();

    if (!projectAccess) {
      throw new Error('Not authorized to access this project');
    }

    // Look for existing presence record
    const existingPresence = await ctx.db
      .query('presence')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', userId)
      )
      .unique();

    if (existingPresence) {
      // Update existing presence
      await ctx.db.patch(existingPresence._id, {
        x: args.x,
        y: args.y,
        tool: args.tool,
        viewport: args.viewport,
        lastUpdated: Date.now(),
      });
      return existingPresence._id;
    } else {
      // Create new presence record
      const presenceId = await ctx.db.insert('presence', {
        projectId: args.projectId,
        userId: userId,
        x: args.x,
        y: args.y,
        tool: args.tool,
        viewport: args.viewport,
        lastUpdated: Date.now(),
      });
      return presenceId;
    }
  },
});

// Get all active users in a project
export const getActiveUsers = query({
  args: {
    projectId: v.id('projects'),
    timeoutMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Check if user has access to this project
    const projectAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', userId)
      )
      .unique();

    if (!projectAccess) {
      throw new Error('Not authorized to access this project');
    }

    // Define the cutoff time for active users (default 30 seconds)
    const timeoutMs = args.timeoutMs || 30000;
    const cutoff = Date.now() - timeoutMs;

    // Get all active users' presence data
    const activePresences = await ctx.db
      .query('presence')
      .withIndex('projectId', (q) => q.eq('projectId', args.projectId))
      .filter((q) => q.gt(q.field('lastUpdated'), cutoff))
      .collect();

    // Get user details for each active user
    const userIds = activePresences.map((p) => p.userId);
    const users = await Promise.all(
      userIds.map((userId) => ctx.db.get(userId))
    );

    // Combine presence data with user data
    return activePresences.map((presence, index) => {
      const user = users[index];
      return {
        ...presence,
        user: user
          ? {
              _id: user._id,
              name: user.name,
              email: user.email,
              image: user.image,
            }
          : null,
        isSelf: presence.userId === userId,
      };
    });
  },
});

// Leave a project (clear presence)
export const leaveProject = mutation({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Find and delete the presence record
    const existingPresence = await ctx.db
      .query('presence')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', userId)
      )
      .unique();

    if (existingPresence) {
      await ctx.db.delete(existingPresence._id);
    }

    return { status: 'left' };
  },
});
