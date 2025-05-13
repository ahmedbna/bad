import { Project } from '@/components/project';
import { Id } from '@/convex/_generated/dataModel';

// Define the page params according to Next.js conventions
type Params = { id: string };

type SearchParams = { [key: string]: string | string[] | undefined };

// Use the Next.js generateMetadata pattern which can help TypeScript understand the types better
export async function generateMetadata({ params }: { params: Params }) {
  return {
    title: `Project`,
  };
}

// The main page component
export default function ProjectPage({
  params,
}: {
  params: Params;
  searchParams?: SearchParams;
}) {
  // Convert the string id from the URL parameter to the typed Id
  const projectId = params.id as Id<'projects'>;

  return <Project projectId={projectId} />;
}
