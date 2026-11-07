// src/app/admin/quotes/[id]/convertToProject.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email";

export async function convertQuoteToProject(formData: FormData): Promise<void> {
  await requireAdmin();

  const quoteId = formData.get("quoteId") as string;
  const projectTitle = formData.get("projectTitle") as string;

  if (!quoteId || !projectTitle) {
    throw new Error("Missing required fields");
  }

  const supabase = getSupabaseAdmin();

  // 1. Fetch the quote details
  const { data: quote, error: fetchError } = await supabase
    .from("quote_requests")
    .select("name, email, project_type, budget, status")
    .eq("id", quoteId)
    .single();

  if (fetchError || !quote) {
    throw new Error("Quote not found");
  }

  if (quote.status !== "accepted") {
    throw new Error("Quote must be accepted before converting to project");
  }

  // 2. Create the client project
  const { data: project, error: projectError } = await supabase
    .from("client_projects")
    .insert({
      quote_request_id: quoteId,
      client_email: quote.email,
      title: projectTitle,
      status: "draft",
    })
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message || "Failed to create project");
  }

  // 3. Send magic link email to client
  const clientPortalUrl = `${process.env.NEXTAUTH_URL}/client/login?email=${encodeURIComponent(quote.email)}`;
  const subject = `Welcome to your project portal: ${projectTitle}`;
  const text = `Hi ${quote.name},\n\nYour project "${projectTitle}" is now ready. Please click the link below to access your client portal and track progress:\n\n${clientPortalUrl}\n\nBest regards,\nRashid`;
  const html = `<p>Hi ${quote.name},</p><p>Your project <strong>"${projectTitle}"</strong> is now ready.</p><p><a href="${clientPortalUrl}">Click here to access your client portal</a> and track progress.</p><p>Best regards,<br>Rashid</p>`;

  await sendEmail({
    to: quote.email,
    subject,
    text,
    html,
  }).catch(console.error);

  // 4. Update quote status to indicate conversion
  await supabase
    .from("quote_requests")
    .update({
      status: "converted",
      admin_notes: `Converted to project: ${project.id}`,
    })
    .eq("id", quoteId);

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin/quotes");
}
