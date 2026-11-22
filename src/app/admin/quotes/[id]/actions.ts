"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_STATUSES = [
  "pending",
  "reviewing",
  "cancelled",
] as const;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export async function updateQuoteStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const adminNotes = String(formData.get("adminNotes") ?? "").trim();

  if (!UUID_REGEX.test(id)) {
    throw new Error("Invalid quotation ID");
  }

  if (adminNotes.length > 5000) {
    throw new Error("Admin notes are too long");
  }

  const supabase = getSupabaseAdmin();

  const { data: currentQuote, error: currentQuoteError } = await supabase
    .from("quote_requests")
    .select("id, status, client_response")
    .eq("id", id)
    .maybeSingle();

  if (currentQuoteError) {
    throw new Error("Unable to verify the current quotation status.");
  }

  if (!currentQuote) {
    throw new Error("Quotation not found.");
  }

  const statusChanged = status !== currentQuote.status;

  if (
    statusChanged &&
    !ALLOWED_STATUSES.includes(
      status as (typeof ALLOWED_STATUSES)[number],
    )
  ) {
    throw new Error(
      "Invalid quotation status. Sending proposals and project completion must use their dedicated workflows.",
    );
  }

  if (
    statusChanged &&
    (currentQuote.status === "completed" ||
      currentQuote.client_response === "accepted")
  ) {
    throw new Error(
      "This quotation has reached a protected workflow stage. Its status cannot be changed here.",
    );
  }

  const updatePayload = {
    internal_notes: adminNotes || null,
    updated_at: new Date().toISOString(),
    ...(statusChanged ? { status } : {}),
  };

  let updateQuery = supabase
    .from("quote_requests")
    .update(updatePayload)
    .eq("id", id)
    .eq("status", currentQuote.status);

  if (statusChanged) {
    updateQuery = updateQuery.or(
      "client_response.is.null,client_response.eq.revision_requested",
    );
  }

  const { data: updatedQuote, error: dbError } = await updateQuery
    .select("id")
    .maybeSingle();

  if (dbError) {
    console.error("Unable to update quotation:", dbError);
    throw new Error("Unable to save the quotation changes.");
  }

  if (!updatedQuote) {
    throw new Error(
      "The quotation changed while you were editing it. Reload the page and try again.",
    );
  }

  if (statusChanged && status === "cancelled") {
    const { data: quote, error: quoteError } = await supabase
      .from("quote_requests")
      .select("name, email, project_type, budget_range")
      .eq("id", id)
      .single();

    if (quoteError) {
      console.error(
        "Unable to load quotation notification details:",
        quoteError,
      );
    } else if (quote) {
      const name = String(quote.name);
      const projectType = String(quote.project_type);
      const budgetRange = String(quote.budget_range);

      const subject = `Update on your ${projectType} quotation request`;

      const text = `Hi ${name},

Your quotation request for a ${projectType} project (budget range: ${budgetRange}) has been cancelled.

If you have any questions, please contact us.

Best regards,
Rashid`;

      const html = `<p>Hi ${escapeHtml(name)},</p>
<p>Your quotation request for a ${escapeHtml(projectType)} project (budget range: ${escapeHtml(budgetRange)}) has been cancelled.</p>
<p>If you have any questions, please contact us.</p>
<p>Best regards,<br>Rashid</p>`;

      await sendEmail({
        to: quote.email,
        subject,
        text,
        html,
      }).catch((error) => {
        console.error("Quotation cancellation email failed:", error);
      });
    }
  }

  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath("/admin/quotes");

  redirect(`/admin/quotes/${id}?success=updated`);
}


