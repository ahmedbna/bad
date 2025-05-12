'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '../ui/spinner';
import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { Trash2, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

type Props = {
  projectId: Id<'projects'>;
  showCollabsDialog: boolean;
  setShowCollabsDialog: (show: boolean) => void;
};

export const Collaborators = ({
  projectId,
  showCollabsDialog,
  setShowCollabsDialog,
}: Props) => {
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [isInviting, setIsInviting] = useState(false);

  const currentUser = useQuery(api.users.get);
  const activeUsers = useQuery(api.presence.getActiveUsers, {
    projectId,
    timeoutMs: 30000, // Consider users inactive after 30 seconds
  });
  const collaborators = useQuery(api.collaborators.getCollaborators, {
    projectId,
  });
  const inviteCollaborator = useMutation(api.collaborators.inviteCollaborator);
  const removeCollaborator = useMutation(api.collaborators.removeCollaborator);
  const updateRole = useMutation(api.collaborators.updateCollaboratorRole);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsInviting(true);
    try {
      await inviteCollaborator({
        projectId,
        email: email.trim(),
        role: inviteRole,
      });
      setEmail('');
    } catch (error) {
      console.error('Failed to invite collaborator:', error);
    } finally {
      setIsInviting(false);
      setShowCollabsDialog(false);
    }
  };

  const handleRemove = async (userId: Id<'users'>) => {
    try {
      await removeCollaborator({ projectId, userId });
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
    }
  };

  const handleRoleChange = async (
    userId: Id<'users'>,
    role: 'editor' | 'viewer'
  ) => {
    try {
      await updateRole({ projectId, userId, role });
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  // Generate a color based on user ID for consistency
  const getUserColor = (userId: string) => {
    const colors = [
      '#F87171', // red
      '#FB923C', // orange
      '#FBBF24', // amber
      '#A3E635', // lime
      '#34D399', // emerald
      '#22D3EE', // cyan
      '#60A5FA', // blue
      '#A78BFA', // violet
      '#F472B6', // pink
    ];

    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const owner = collaborators && collaborators.find((c) => c.role === 'owner');
  const isCurrentUserOwner = owner?.userId === owner?.user?._id;

  return (
    <Dialog open={showCollabsDialog} onOpenChange={setShowCollabsDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collaborators</DialogTitle>
        </DialogHeader>

        {activeUsers === undefined ||
        collaborators === undefined ||
        currentUser === undefined ? (
          <div className='w-screen h-screen flex items-center justify-center'>
            <Spinner />
          </div>
        ) : (
          <div>
            {' '}
            {/* Invite form */}
            <form onSubmit={handleInvite} className='space-y-3'>
              <div className='flex gap-2'>
                <Input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='Email address'
                  className='flex-1'
                  required
                />
                <Select
                  value={inviteRole}
                  onValueChange={(value) =>
                    setInviteRole(value as 'editor' | 'viewer')
                  }
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='Select role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='editor'>Editor</SelectItem>
                    <SelectItem value='viewer'>Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type='submit' disabled={isInviting} className='w-full'>
                {isInviting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Inviting...
                  </>
                ) : (
                  <div className='flex items-center'>
                    <UserPlus className='mr-2 h-4 w-4' />
                    Invite Collaborator
                  </div>
                )}
              </Button>
            </form>
            {/* Current collaborators */}
            <div>
              <ul className='space-y-3'>
                {collaborators.map((collaborator) => {
                  const isActive = activeUsers?.some(
                    (activeUser) => activeUser.userId === collaborator.userId
                  );
                  const initials =
                    collaborator.user?.name?.charAt(0) ||
                    collaborator.user?.email?.charAt(0) ||
                    '?';

                  return (
                    <li
                      key={collaborator._id}
                      className='flex items-center justify-between py-2'
                    >
                      <div className='flex items-center gap-3'>
                        {/* Avatar/Status indicator */}
                        <div className='relative'>
                          <Avatar
                            style={{
                              backgroundColor: getUserColor(
                                collaborator.userId
                              ),
                            }}
                          >
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          {isActive && (
                            <span className='absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background' />
                          )}
                        </div>

                        {/* User info */}
                        <div>
                          <div className='font-medium flex items-center gap-2'>
                            {collaborator.user?.name ||
                              collaborator.user?.email ||
                              'Unknown user'}
                            {collaborator.role === 'owner' && (
                              <Badge variant='outline' className='ml-1'>
                                Owner
                              </Badge>
                            )}
                          </div>
                          {collaborator.user?.email && (
                            <div className='text-xs text-muted-foreground'>
                              {collaborator.user.email}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Role & Remove controls */}
                      {collaborator.role !== 'owner' && (
                        <div className='flex items-center gap-2'>
                          <Select
                            value={collaborator.role}
                            onValueChange={(value) =>
                              handleRoleChange(
                                collaborator.userId,
                                value as 'editor' | 'viewer'
                              )
                            }
                            disabled={!isCurrentUserOwner}
                          >
                            <SelectTrigger className='w-24 h-8'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='editor'>Editor</SelectItem>
                              <SelectItem value='viewer'>Viewer</SelectItem>
                            </SelectContent>
                          </Select>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 text-muted-foreground hover:text-destructive'
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                className='text-destructive focus:text-destructive'
                                onClick={() =>
                                  handleRemove(collaborator.userId)
                                }
                              >
                                Remove user
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type='submit' onClick={() => setShowCollabsDialog(false)}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Function to get user's color based on their ID
export const getUserColor = (userId: string) => {
  const colors = [
    '#F87171', // red
    '#FB923C', // orange
    '#FBBF24', // amber
    '#A3E635', // lime
    '#34D399', // emerald
    '#22D3EE', // cyan
    '#60A5FA', // blue
    '#A78BFA', // violet
    '#F472B6', // pink
  ];

  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// Function to get collaborator's name
export const getCollaboratorName = (
  userId: Id<'users'>,
  collaborators: any[]
) => {
  if (!collaborators) return 'Unknown';

  const collaborator = collaborators.find((c) => c.userId === userId);
  return (
    collaborator?.user?.name ||
    collaborator?.user?.email?.split('@')[0] ||
    'Unknown'
  );
};
