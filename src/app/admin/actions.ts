"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { projectSchema } from "@/lib/projectSchema";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function readProject(formData: FormData) {
  const raw = {
    title: formData.get("title"), slug: formData.get("slug"), description: formData.get("description"),
    content: formData.get("content") || "",
    tags: String(formData.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
    category: formData.get("category") || "Web Development", image_url: formData.get("image_url") || "",
    live_url: formData.get("live_url") || "", repo_url: formData.get("repo_url") || "",
    featured: formData.get("featured") === "on",
    status: formData.get("status") === "published" ? "published" : "draft",
  };
  return projectSchema.safeParse(raw);
}

export async function saveProject(formData: FormData) {
  await requireAdmin();
  const parsed = readProject(formData);
  if (!parsed.success) redirect("/admin/projects/new?error=validation");
  const id = String(formData.get("id") ?? "").trim();
  const supabase = getSupabaseAdmin();
  const payload = { ...parsed.data, updated_at: new Date().toISOString() };
  if (id) {
    const { error } = await supabase.from("projects").update(payload).eq("id", id);
    if (error) redirect(`/admin/projects/${encodeURIComponent(id)}?error=save`);
  } else {
    const { error } = await supabase.from("projects").insert(payload);
    if (error) redirect("/admin/projects/new?error=save");
  }
  revalidatePath("/admin"); revalidatePath("/admin/projects"); revalidatePath("/projects"); revalidatePath("/");
  redirect("/admin/projects?saved=1");
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/admin/projects?error=missing-id");
  const { error } = await getSupabaseAdmin().from("projects").delete().eq("id", id);
  if (error) redirect("/admin/projects?error=delete");
  revalidatePath("/admin"); revalidatePath("/admin/projects"); revalidatePath("/projects"); revalidatePath("/");
  redirect("/admin/projects?deleted=1");
}

export async function toggleProjectStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const status = formData.get("status") === "published" ? "published" : "draft";
  if (!id) redirect("/admin/projects?error=missing-id");
  const { error } = await getSupabaseAdmin().from("projects").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin/projects?error=publish");
  revalidatePath("/admin"); revalidatePath("/admin/projects"); revalidatePath("/projects"); revalidatePath("/");
  redirect("/admin/projects?saved=1");
}
