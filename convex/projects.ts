import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { asyncMap } from 'convex-helpers';

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

    // Check if user has access to this project
    const userAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', authId)
      )
      .unique();

    if (!userAccess) {
      throw new Error('Not authorized to access this project');
    }

    const layers = await ctx.db
      .query('layers')
      .withIndex('projectId', (q) => q.eq('projectId', args.projectId))
      .collect();

    return { ...project, layers };
  },
});

export const getProjects = query({
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    // Get all projects owned by the user
    const ownedProjects = await ctx.db
      .query('projects')
      .withIndex('userId', (q) => q.eq('userId', authId))
      .collect();

    // Get all projects where the user is a collaborator
    const collaborations = await ctx.db
      .query('collaborators')
      .withIndex('userId', (q) => q.eq('userId', authId))
      .collect();

    // Fetch all the projects the user is collaborating on (but not owning)
    const collaboratedProjectIds = collaborations
      .filter((collab) => {
        // Find projects where the user is a collaborator but not the owner
        const matchingOwnedProject = ownedProjects.find(
          (project) => project._id === collab.projectId
        );
        return !matchingOwnedProject;
      })
      .map((collab) => collab.projectId);

    const collaboratedProjects = await Promise.all(
      collaboratedProjectIds.map(async (projectId) => {
        const project = await ctx.db.get(projectId);
        if (!project) return null;

        // Include the collaboration role in the project
        const collab = collaborations.find((c) => c.projectId === projectId);
        return {
          ...project,
          collaborationRole: collab ? collab.role : null,
        };
      })
    );

    // Filter out any null projects (shouldn't happen, but just in case)
    const validCollaboratedProjects = collaboratedProjects.filter(Boolean);

    // Return both owned and collaborated projects
    return [...ownedProjects, ...validCollaboratedProjects];
  },
});

export const getPendingInvitations = query({
  handler: async (ctx) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    // Get user email
    const user = await ctx.db.get(authId);
    if (!user || !user.email) {
      throw new Error('User email not found');
    }

    // Get all pending invitations for the user email
    const invitations = await ctx.db
      .query('pendingInvitations')
      .withIndex('email', (q) => q.eq('email', user.email!))
      .filter((q) => q.eq(q.field('acceptedAt'), undefined))
      .collect();

    // Get project info for each invitation
    const invitationsWithProjects = await Promise.all(
      invitations.map(async (invitation) => {
        const project = await ctx.db.get(invitation.projectId);
        const inviter = await ctx.db.get(invitation.invitedBy);

        return {
          ...invitation,
          project: project
            ? {
                _id: project._id,
                name: project.name,
              }
            : null,
          invitedBy: inviter
            ? {
                _id: inviter._id,
                name: inviter.name,
                email: inviter.email,
              }
            : null,
        };
      })
    );

    return invitationsWithProjects;
  },
});

export const respondToInvitation = mutation({
  args: {
    invitationId: v.id('pendingInvitations'),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const authId = await getAuthUserId(ctx);

    if (!authId) {
      throw new Error('Not authenticated');
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Get user email
    const user = await ctx.db.get(authId);
    if (!user || !user.email) {
      throw new Error('User email not found');
    }

    // Check if the invitation is for this user
    if (invitation.email !== user.email) {
      throw new Error('This invitation is not for you');
    }

    // If accepting the invitation
    if (args.accept) {
      // Create collaborator entry
      await ctx.db.insert('collaborators', {
        projectId: invitation.projectId,
        userId: authId,
        role: invitation.role,
      });
    }

    // Mark invitation as processed
    await ctx.db.patch(invitation._id, {
      acceptedAt: Date.now(),
    });

    return { success: true };
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

    const projectId = await ctx.db.insert('projects', {
      name: args.name,
      userId: authId,
      starred: false,
    });

    await ctx.db.insert('collaborators', {
      userId: authId,
      projectId: projectId,
      role: 'owner',
    });

    // Create default layer for the project
    await ctx.db.insert('layers', {
      projectId: projectId,
      name: 'Default Layer',
      color: '#FFFFFF', // White default color
      lineWidth: 1,
      lineType: 'solid',
      isVisible: true,
      isLocked: false,
      isDefault: true,
    });

    return projectId;
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

    // Check if user has access to update this project
    const userAccess = await ctx.db
      .query('collaborators')
      .withIndex('projectId_userId', (q) =>
        q.eq('projectId', args.projectId).eq('userId', authId)
      )
      .unique();

    if (
      !userAccess ||
      (userAccess.role === 'viewer' && project.userId !== authId)
    ) {
      throw new Error('Not authorized to update this project');
    }

    await ctx.db.patch(project._id, {
      name: args.name ?? project.name,
      starred: args.starred ?? project.starred,
      description: args.description ?? project.description,
      lastEdited: args.lastEdited ?? project.lastEdited,
    });

    return project;
  },
});

export const deleteProject = mutation({
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

    // Only the owner can delete a project
    if (project.userId !== authId) {
      throw new Error('Not authorized to delete this project');
    }

    const shapes = await ctx.db
      .query('shapes')
      .withIndex('projectId', (q) => q.eq('projectId', args.projectId))
      .collect();

    await asyncMap(shapes, async (shape) => {
      await ctx.db.delete(shape._id);
    });

    // Delete related records
    const layers = await ctx.db
      .query('layers')
      .withIndex('projectId', (q) => q.eq('projectId', args.projectId))
      .collect();

    await asyncMap(layers, async (layer) => {
      await ctx.db.delete(layer._id);
    });

    const collaborators = await ctx.db
      .query('collaborators')
      .withIndex('projectId', (q) => q.eq('projectId', args.projectId))
      .collect();

    await asyncMap(collaborators, async (collaborator) => {
      await ctx.db.delete(collaborator._id);
    });

    const pendingInvitations = await ctx.db
      .query('pendingInvitations')
      .withIndex('projectId', (q) => q.eq('projectId', args.projectId))
      .collect();

    await asyncMap(pendingInvitations, async (invitation) => {
      await ctx.db.delete(invitation._id);
    });

    await ctx.db.delete(args.projectId);

    return { success: true };
  },
});
