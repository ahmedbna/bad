import { Project } from '@/components/project';
import { Id } from '@/convex/_generated/dataModel';

type Props = {
  params: {
    id: Id<'projects'>;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function ProjectPage({ params }: Props) {
  return <Project projectId={params.id} />;
}
