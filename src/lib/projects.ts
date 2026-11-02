import "server-only";
import { siteConfig } from "@/lib/siteConfig";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { PortfolioProject } from "@/lib/projectSchema";

export async function getPublishedProjects(): Promise<PortfolioProject[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return siteConfig.projects.map((project) => ({
      id: String(project.id),
      title: project.title,
      slug: project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      description: project.description,
      content: "",
      tags: project.tags,
      category: "Web Development",
      image_url: "",
      live_url: project.link.startsWith("https://") ? project.link : "",
      repo_url: project.link.startsWith("https://github.com/") ? project.link : "",
      featured: false,
      status: "published" as const,
      created_at: "",
      updated_at: "",
    }));
  }

  const { data, error } = await getSupabaseAdmin()
    .from("projects")
    .select("id,title,slug,description,content,tags,category,image_url,live_url,repo_url,featured,status,created_at,updated_at")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load published projects:", error.message);
    return [];
  }
  return (data ?? []) as PortfolioProject[];
}
