'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Folder,
  Clock,
  Star,
  Grid,
  List,
  MoreHorizontal,
  X,
  CheckCircle,
  XCircle,
  BellRing,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Spinner } from '../ui/spinner';
import { Id } from '@/convex/_generated/dataModel';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuthActions } from '@convex-dev/auth/react';

export const HomePage = () => {
  const router = useRouter();
  const { signOut } = useAuthActions();

  const [viewMode, setViewMode] = useState('grid');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [projectName, setProjectName] = useState('');

  const user = useQuery(api.users.get);
  const projects = useQuery(api.projects.getProjects);
  const pendingInvitations = useQuery(api.projects.getPendingInvitations);
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const deleteProject = useMutation(api.projects.deleteProject);
  const respondToInvitation = useMutation(api.projects.respondToInvitation);

  if (
    user === undefined ||
    projects === undefined ||
    pendingInvitations === undefined
  ) {
    return (
      <div className='w-screen h-screen flex items-center justify-center'>
        <Spinner />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className='w-screen h-screen flex items-center justify-center'>
        <div>Not found</div>
      </div>
    );
  }

  // Separate owned and collaborative projects
  const ownedProjects = projects.filter(
    (project: any) =>
      // @ts-ignore
      !project.collaborationRole || project.collaborationRole === 'owner'
  );

  const collaborativeProjects = projects.filter(
    (project: any) =>
      project.collaborationRole && project.collaborationRole !== 'owner'
  );

  // Filter projects based on current tab and search term
  const getFilteredProjects = () => {
    let filteredList = [];

    switch (activeTab) {
      case 'owned':
        filteredList = ownedProjects;
        break;
      case 'collaborating':
        filteredList = collaborativeProjects;
        break;
      case 'starred':
        filteredList = projects.filter((project) => project.starred);
        break;
      case 'all':
      default:
        filteredList = projects;
        break;
    }

    return filteredList.filter((project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const toggleProjectStar = async (projectId: Id<'projects'>) => {
    const project = projects.find((p) => p._id === projectId);
    if (!project) return;
    await updateProject({ projectId, starred: !project.starred });
  };

  const createNewProject = async () => {
    if (!projectName.trim()) return;

    const projectId = await createProject({ name: projectName });
    setShowNewProjectModal(false);
    setProjectName('');

    router.push(`/project/${projectId}`);
  };

  const handleInvitationResponse = async (
    invitationId: Id<'pendingInvitations'>,
    accept: boolean
  ) => {
    await respondToInvitation({
      invitationId,
      accept,
    });
  };

  const filteredProjects = getFilteredProjects();

  return (
    <div className='w-full flex flex-col min-h-screen'>
      {/* Header */}
      <header className='w-full border-b fixed top-0 z-10 bg-background'>
        <div className='py-2 px-46 flex items-center justify-between'>
          <h1 className='text-3xl font-black tracking-tight'>BNA</h1>
          <div className='flex items-center gap-4'>
            {/* <Button variant='ghost' size='sm'>
              Help
            </Button> */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className='h-8 w-8'>
                  <AvatarImage src={user.image} alt={user.name || ''} />
                  <AvatarFallback className='cursor-pointer'>
                    {user.name?.charAt(0)}
                    {user.name?.split(' ')?.pop()?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuLabel className='text-sm text-muted-foreground'>
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => void signOut()}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='w-full py-20 px-46 flex-1'>
        <div>
          {/* Pending Invitations Section */}
          {pendingInvitations && pendingInvitations.length > 0 && (
            <div className='mb-8'>
              <h3 className='text-xl font-semibold mb-4 flex items-center'>
                <BellRing className='h-5 w-5 mr-2' />
                Pending Invitations
              </h3>
              <div className='space-y-3'>
                {pendingInvitations.map((invitation) => (
                  <Alert
                    key={invitation._id}
                    className='flex justify-between items-center'
                  >
                    <div>
                      <AlertTitle className='flex items-center gap-2'>
                        {invitation.project?.name || 'Unknown Project'}
                      </AlertTitle>
                      <AlertDescription>
                        Invited by{' '}
                        {invitation.invitedBy?.name ||
                          invitation.invitedBy?.email ||
                          'Unknown'}
                        as a {invitation.role}.
                      </AlertDescription>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='flex items-center gap-1'
                        onClick={() =>
                          handleInvitationResponse(invitation._id, false)
                        }
                      >
                        <XCircle className='h-4 w-4' />
                        Decline
                      </Button>
                      <Button
                        size='sm'
                        className='flex items-center gap-1'
                        onClick={() =>
                          handleInvitationResponse(invitation._id, true)
                        }
                      >
                        <CheckCircle className='h-4 w-4' />
                        Accept
                      </Button>
                    </div>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Projects Header */}
          <div className='flex items-center justify-between mb-8'>
            <h2 className='text-3xl font-bold tracking-tight'>Projects</h2>
            <div className='flex items-center gap-2'>
              <Dialog
                open={showNewProjectModal}
                onOpenChange={setShowNewProjectModal}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className='mr-2 h-4 w-4' />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-[425px]'>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Enter project details and select a template to begin.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='grid gap-4 py-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='project-name'>Project Name</Label>
                      <Input
                        id='project-name'
                        placeholder='Enter project name'
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setShowNewProjectModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={createNewProject}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <a
                href='https://www.producthunt.com/posts/ai-cad?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-ai&#0045;cad'
                target='_blank'
              >
                <img
                  src='https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=965110&theme=light&t=1747189820030'
                  alt='AI&#0032;CAD - AI&#0032;CAD&#0032;in&#0032;the&#0032;Cloud&#0032;with&#0032;Realtime&#0032;Collaboration | Product Hunt'
                  className='w-[180px] h-9'
                  width='180'
                  height='36'
                />
              </a>
            </div>
          </div>

          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex gap-2 items-center'>
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className='w-auto'
                >
                  <TabsList>
                    <TabsTrigger value='all'>All</TabsTrigger>
                    <TabsTrigger value='owned'>Owned</TabsTrigger>
                    <TabsTrigger value='collaborating'>
                      Collaborating
                    </TabsTrigger>
                    <TabsTrigger value='starred'>
                      <Star className='h-4 w-4 mr-1' />
                      Starred
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className='flex items-center gap-2'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                  <Input
                    placeholder='Search projects...'
                    className='pl-10 w-full sm:w-[300px]'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <ToggleGroup
                  type='single'
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value)}
                  className='border rounded-md'
                >
                  <ToggleGroupItem value='grid' aria-label='Grid view'>
                    <Grid className='h-4 w-4' />
                  </ToggleGroupItem>
                  <ToggleGroupItem value='list' aria-label='List view'>
                    <List className='h-4 w-4' />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {filteredProjects.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-3'
                }
              >
                {filteredProjects.map((project: any) =>
                  viewMode === 'grid' ? (
                    <Link href={`/project/${project._id}`} key={project._id}>
                      <Card key={project._id} className='overflow-hidden'>
                        <div className='relative aspect-video'>
                          {/* Project thumbnail placeholder */}
                          <div className='w-full h-full bg-muted flex items-center justify-center'>
                            <Folder className='h-8 w-8 text-muted-foreground' />
                          </div>

                          {/* Role badge if collaborating */}
                          {project.collaborationRole &&
                            project.collaborationRole !== 'owner' && (
                              <div className='absolute top-2 left-2 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded-md'>
                                {project.collaborationRole}
                              </div>
                            )}

                          <Button
                            variant='ghost'
                            size='icon'
                            className='absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm'
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleProjectStar(project._id);
                            }}
                          >
                            <Star
                              className={`h-4 w-4 ${project.starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                            />
                          </Button>
                        </div>
                        <CardHeader className='p-4 pb-2'>
                          <div className='flex justify-between items-start'>
                            <h3 className='font-medium leading-none truncate'>
                              {project.name}
                            </h3>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8'
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                >
                                  <MoreHorizontal className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {(!project.collaborationRole ||
                                  project.collaborationRole === 'owner') && (
                                  <DropdownMenuItem
                                    className='text-destructive'
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      await deleteProject({
                                        projectId: project._id,
                                      });
                                    }}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardFooter className='p-4 pt-0'>
                          <p className='text-xs text-muted-foreground'>
                            Edited{' '}
                            {project.lastEdited
                              ? new Date(
                                  project.lastEdited
                                ).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </CardFooter>
                      </Card>
                    </Link>
                  ) : (
                    <Link href={`/project/${project._id}`} key={project._id}>
                      <Card
                        key={project._id}
                        className='flex flex-row overflow-hidden'
                      >
                        <div className='w-16 h-16 bg-muted flex items-center justify-center'>
                          <Folder className='h-6 w-6 text-muted-foreground' />
                        </div>
                        <div className='flex flex-1 items-center p-4'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <h3 className='font-medium'>{project.name}</h3>
                              {project.collaborationRole &&
                                project.collaborationRole !== 'owner' && (
                                  <span className='bg-primary/80 text-primary-foreground text-xs px-2 py-0.5 rounded-md'>
                                    {project.collaborationRole}
                                  </span>
                                )}
                            </div>
                            <p className='text-xs text-muted-foreground'>
                              Edited{' '}
                              {project.lastEdited
                                ? new Date(
                                    project.lastEdited
                                  ).toLocaleDateString()
                                : 'Never'}
                            </p>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleProjectStar(project._id);
                              }}
                            >
                              <Star
                                className={`h-4 w-4 ${project.starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                              />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8'
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                >
                                  <MoreHorizontal className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {(!project.collaborationRole ||
                                  project.collaborationRole === 'owner') && (
                                  <DropdownMenuItem
                                    className='text-destructive'
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      await deleteProject({
                                        projectId: project._id,
                                      });
                                    }}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  )
                )}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <div className='rounded-full bg-muted p-4 mb-4'>
                  <Folder className='h-10 w-10 text-muted-foreground' />
                </div>
                <h3 className='text-lg font-medium'>No projects found</h3>
                <p className='text-muted-foreground'>
                  {activeTab === 'all' &&
                    'Create a new project or try a different search.'}
                  {activeTab === 'owned' &&
                    "You don't have any owned projects. Create one to get started."}
                  {activeTab === 'collaborating' &&
                    "You're not collaborating on any projects yet."}
                  {activeTab === 'starred' &&
                    'Star your favorite projects to see them here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
