'use client';

import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CADApp } from './cad-app';
import { Spinner } from './ui/spinner';

type Props = {
  projectId: Id<'projects'>;
};

export const Project = ({ projectId }: Props) => {
  const shapes = useQuery(api.shapes.getShapesByProject, { projectId });
  const currentUser = useQuery(api.users.get);
  const activeUsers = useQuery(api.presence.getActiveUsers, {
    projectId,
    timeoutMs: 30000, // Consider users inactive after 30 seconds
  });
  const collaborators = useQuery(api.collaborators.getCollaborators, {
    projectId,
  });

  if (
    shapes === undefined ||
    activeUsers === undefined ||
    collaborators === undefined ||
    currentUser === undefined
  ) {
    return (
      <div className='w-screen h-screen flex items-center justify-center'>
        <Spinner />
      </div>
    );
  }

  if (shapes === null || currentUser === null) {
    return (
      <div className='w-screen h-screen flex items-center justify-center'>
        <div>Not found</div>
      </div>
    );
  }

  return (
    <CADApp
      projectId={projectId}
      shapes={shapes}
      activeUsers={activeUsers}
      collaborators={collaborators}
      currentUser={currentUser}
    />
  );
};
