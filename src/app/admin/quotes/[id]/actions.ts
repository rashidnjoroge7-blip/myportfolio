"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email";

export async function updateQuoteStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const adminNotes = formData.get("adminNotes") as string;

  if (!id || !status) {
    throw new Error("Missing required fields");
  }

  const supabase = getSupabaseAdmin();

  const { error: dbError } = await supabase
    .from("quote_requests")
    .update({
      status,
      quote_notes: adminNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (dbError) throw new Error(dbError.message);

  const { data: quote } = await supabase
    .from("quote_requests")
    .select("name, email, project_type, budget_range")
    .eq("id", id)
    .single();

  if (quote && (status === "quoted" || status === "cancelled")) {
    const subject = `Update on your ${quote.project_type} quotation request`;
    const text = `Hi ${quote.name},\n\nYour quotation request for a ${quote.project_type} project (budget_range: ${quote.budget_range}) has been ${status}.\n\nWe will be in touch shortly with the next steps.\n\nBest regards,\nRashid`;
    const html = `<p>Hi ${quote.name},</p><p>Your quotation request for a ${quote.project_type} project (budget_range: ${quote.budget_range}) has been <strong>${status}</strong>.</p><p>We will be in touch shortly with the next steps.</p><p>Best regards,<br>Rashid</p>`;

    await sendEmail({
      to: quote.email,
      subject,
      text,
      html,
    }).catch(console.error);
  }

  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath("/admin/quotes");
  redirect(`/admin/quotes/${id}?success=updated`);
}


