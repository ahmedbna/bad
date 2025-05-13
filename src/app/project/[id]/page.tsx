import { Project } from '@/components/project';
import { Id } from '@/convex/_generated/dataModel';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectId = id as Id<'projects'>;

  return <Project projectId={projectId} />;
}
