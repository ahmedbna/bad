import { Project } from '@/components/project';
import { Id } from '@/convex/_generated/dataModel';

type PageProps = {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function ProjectPage({ params }: PageProps) {
  const projectId = params.id as Id<'projects'>;

  return <Project projectId={projectId} />;
}
