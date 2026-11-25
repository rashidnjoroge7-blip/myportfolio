import { createClient } from "@supabase/supabase-js";
import { siteConfig } from "@/lib/siteConfig";
import type { PortfolioProject } from "@/lib/projectSchema";

function getFallbackProjects(): PortfolioProject[] {
  return siteConfig.projects.map((project) => ({
    id: String(project.id),
    title: project.title,
    slug: project.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    description: project.description,
    content: "",
    tags: project.tags,
    category: "Web Development",
    image_url: "",
    live_url: project.link.startsWith("https://")
      ? project.link
      : "",
    repo_url: project.link.startsWith("https://github.com/")
      ? project.link
      : "",
    featured: false,
    status: "published",
    created_at: "",
    updated_at: "",
  }));
}

export async function getPublishedProjects(): Promise<PortfolioProject[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return getFallbackProjects();
  }

  try {
    const supabase = createClient(url, anonKey);

    const { data, error } = await supabase
      .from("projects")
      .select(
        "id,title,slug,description,content,tags,category,image_url,live_url,repo_url,featured,status,created_at,updated_at"
      )
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase project loading error:", error.message);
      return getFallbackProjects();
    }

    // Keep existing hardcoded projects visible if the database is empty.
    if (!data || data.length === 0) {
      return getFallbackProjects();
    }

    return data as PortfolioProject[];
  } catch (error) {
    console.error("Project loading failed:", error);
    return getFallbackProjects();
  }
}