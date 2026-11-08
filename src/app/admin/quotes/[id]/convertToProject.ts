// src/app/admin/quotes/[id]/convertToProject.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function convertQuoteToProject(formData: FormData): Promise<void> {
  await requireAdmin();

  const quoteId = formData.get("quoteId") as string;
  const projectTitle = formData.get("projectTitle") as string;

  if (!quoteId || !projectTitle) {
    throw new Error("Missing required fields");
  }

  const supabase = getSupabaseAdmin();

  const { data: quote, error: fetchError } = await supabase
    .from("quote_requests")
    .select("name, email, project_type, status")
    .eq("id", quoteId)
    .single();

  if (fetchError || !quote) {
    throw new Error("Quote not found");
  }

  if (quote.status !== "quoted") {
    throw new Error(
      "Quote must be in 'quoted' status before converting to project",
    );
  }

  const { data: project, error: projectError } = await supabase
    .from("client_projects")
    .insert({
      quote_request_id: quoteId,
      client_email: quote.email,
      title: projectTitle,
      status: "active",
    })
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message || "Failed to create project");
  }

  // 🔥 TRIGGER REAL SUPABASE MAGIC LINK EMAIL
  const { error: authError } = await supabase.auth.signInWithOtp({
    email: quote.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXTAUTH_URL}/auth/callback?next=%2Fclient%2Fdashboard`,
    },
  });

  if (authError) {
    console.error("Failed to send Supabase magic link:", authError.message);
  }

  await supabase
    .from("quote_requests")
    .update({
      status: "completed",
      quote_notes: `Converted to project: ${project.id}`,
    })
    .eq("id", quoteId);

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin/quotes");
}
