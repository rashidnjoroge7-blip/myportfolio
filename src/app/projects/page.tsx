import { getPublishedProjects } from "@/lib/projects";
import { siteConfig } from "@/lib/siteConfig";
import ProjectsClient from "./projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <ProjectsClient
      projects={projects}
      github={siteConfig.github}
    />
  );
}