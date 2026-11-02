import { z } from "zod";

const safeExternalUrl = z.string().trim().url().refine((value) => {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}, "Use a valid HTTPS URL.");

export const projectSchema = z.object({
  title: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
  description: z.string().trim().min(10).max(300),
  content: z.string().trim().max(10000).default(""),
  tags: z.array(z.string().trim().min(1).max(32)).max(12),
  category: z.string().trim().max(60).default("Web Development"),
  image_url: z.union([safeExternalUrl, z.literal("")]).default(""),
  live_url: z.union([safeExternalUrl, z.literal("")]).default(""),
  repo_url: z.union([safeExternalUrl, z.literal("")]).default(""),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type PortfolioProject = ProjectInput & {
  id: string;
  created_at: string;
  updated_at: string;
};
