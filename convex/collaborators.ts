import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { internal } from './_generated/api';

// Define role types for collaborators
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

// Get all collaborators for a project
export const getCollaborators = query({
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
      throw new Error('Not authorized to access this project');
    }

    // Get all collaborators for this project
    const collaborators = await ctx.db
      .query('collaborators')
      .withIndex('projectId', (q) => q.eq('projectId', args.projectId))
      .collect();

    // Get user details for each collaborator
    const userIds = collaborators.map((c) => c.userId);
    const users = await Promise.all(
      userIds.map((userId) => ctx.db.get(userId))
    );

    // Combine collaborator data with user data
    return collaborators.map((collaborator, index) => {
      const user = users[index];
      return {
        ...collaborator,
        user: user
          ? {
              _id: user._id,
              name: user.name,
              email: user.email,
              image: user.image,
            }
          : null,
      };
    });
  },
});

// Add a collaborator to a project
export const inviteCollaborator = mutation({
  args: {
    projectId: v.id('projects'),
    email: v.string(),
    role: v.union(v.literal('editor'), v.literal('viewer')),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    // Check if user is the owner or has editor permissions
    const userAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', authId)
      )
      .unique();

    if (!userAccess || userAccess.role === 'viewer') {
      throw new Error('Not authorized to invite collaborators');
    }

    // Find the user by email
    const invitedUser = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', args.email))
      .unique();

    if (!invitedUser) {
      // Create a pending invitation that will be resolved when user signs up
      const invitationId = await ctx.db.insert('pendingInvitations', {
        projectId: args.projectId,
        email: args.email,
        role: args.role,
        invitedBy: authId,
        createdAt: Date.now(),
      });

      // TODO: Send email invitation (would be implemented with a Convex action)

      return { status: 'pending', invitationId };
    }

    // Check if user is already a collaborator
    const existingCollaborator = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', invitedUser._id)
      )
      .unique();

    if (existingCollaborator) {
      // Update role if different
      if (existingCollaborator.role !== args.role) {
        await ctx.db.patch(existingCollaborator._id, {
          role: args.role,
        });
        return { status: 'updated', collaboratorId: existingCollaborator._id };
      }
      return { status: 'existing', collaboratorId: existingCollaborator._id };
    }

    // Add new collaborator
    const collaboratorId = await ctx.db.insert('collaborators', {
      projectId: args.projectId,
      userId: invitedUser._id,
      role: args.role,
    });

    return { status: 'added', collaboratorId };
  },
});

// Remove a collaborator from a project
export const removeCollaborator = mutation({
  args: {
    projectId: v.id('projects'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    // Check if user is the owner or has editor permissions
    const userAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', authId)
      )
      .unique();

    if (
      !userAccess ||
      (userAccess.role !== 'owner' && args.userId !== authId)
    ) {
      throw new Error('Not authorized to remove collaborators');
    }

    // Find the collaborator
    const collaborator = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', args.userId)
      )
      .unique();

    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    // Don't allow removing the owner
    if (collaborator.role === 'owner' && args.userId !== authId) {
      throw new Error('Cannot remove the project owner');
    }

    // Remove the collaborator
    await ctx.db.delete(collaborator._id);

    return { status: 'removed' };
  },
});

// Update a collaborator's role
export const updateCollaboratorRole = mutation({
  args: {
    projectId: v.id('projects'),
    userId: v.id('users'),
    role: v.union(v.literal('editor'), v.literal('viewer')),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    // Check if user is the owner
    const userAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', authId)
      )
      .unique();

    if (!userAccess || userAccess.role !== 'owner') {
      throw new Error('Only the project owner can change roles');
    }

    // Find the collaborator
    const collaborator = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', args.userId)
      )
      .unique();

    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    // Don't allow changing the owner's role
    if (collaborator.role === 'owner') {
      throw new Error("Cannot change the project owner's role");
    }

    // Update the role
    await ctx.db.patch(collaborator._id, {
      role: args.role,
    });

    return { status: 'updated' };
  },
});
