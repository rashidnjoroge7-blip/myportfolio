"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email";

const allowedStatuses = [
  "pending",
  "reviewing",
  "quoted",
  "completed",
  "cancelled",
] as const;

type QuoteStatus = (typeof allowedStatuses)[number];

const statusLabels: Record<QuoteStatus, string> = {
  pending: "Pending",
  reviewing: "Under Review",
  quoted: "Quotation Prepared",
  completed: "Completed",
  cancelled: "Cancelled",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}

export async function updateQuoteStatus(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "") as QuoteStatus;

  if (!id || !allowedStatuses.includes(status)) {
    redirect("/admin/quotes?error=invalid");
  }

  const supabase = getSupabaseAdmin();

  const { data: quote, error: fetchError } = await supabase
    .from("quote_requests")
    .select("id, name, email, project_name, project_type, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !quote) {
    console.error("QUOTE FETCH ERROR:", fetchError);
    redirect("/admin/quotes?error=not-found");
  }

  const previousStatus = quote.status as QuoteStatus;

  const { error: updateError } = await supabase
    .from("quote_requests")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("QUOTE STATUS UPDATE ERROR:", updateError);
    redirect(`/admin/quotes/${encodeURIComponent(id)}?error=update`);
  }

  let emailResult = "unchanged";

  if (previousStatus !== status && quote.email) {
    const clientName = String(quote.name || "Client");
    const projectName = String(
      quote.project_name || quote.project_type || "your project"
    );

    const safeName = escapeHtml(clientName);
    const safeProject = escapeHtml(projectName);
    const safeStatus = escapeHtml(statusLabels[status]);

    try {
      await sendEmail({
        to: quote.email,
        subject: `Quotation Update: ${statusLabels[status]}`,
        text: [
          `Hello ${clientName},`,
          "",
          `There is an update to your quotation request for ${projectName}.`,
          `New status: ${statusLabels[status]}.`,
          "",
          "Thank you for contacting us.",
        ].join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;line-height:1.6">
            <div style="background:#0f172a;padding:24px;color:#ffffff">
              <h2 style="margin:0">Quotation Status Update</h2>
            </div>
            <div style="padding:24px;border:1px solid #e5e7eb">
              <p>Hello ${safeName},</p>
              <p>There is an update to your quotation request.</p>
              <p><strong>Project:</strong> ${safeProject}</p>
              <p><strong>Current status:</strong>
                <span style="display:inline-block;background:#e0f2fe;color:#075985;padding:6px 12px;border-radius:6px">
                  ${safeStatus}
                </span>
              </p>
              <p>Thank you for contacting us. We appreciate your interest and will keep you informed of any further progress.</p>
              <p>Kind regards,<br/>Portfolio Team</p>
            </div>
          </div>
        `,
      });

      emailResult = "sent";
    } catch (emailError) {
      console.error("QUOTE STATUS EMAIL ERROR:", emailError);
      emailResult = "failed";
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);

  redirect(
    `/admin/quotes/${encodeURIComponent(id)}?updated=1&email=${emailResult}`
  );
}

export async function deleteQuote(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/admin/quotes?error=missing-id");
  }

  const { error } = await getSupabaseAdmin()
    .from("quote_requests")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("QUOTE DELETE ERROR:", error);
    redirect(`/admin/quotes/${encodeURIComponent(id)}?error=delete`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");

  redirect("/admin/quotes?deleted=1");
}


export async function sendQuoteProposal(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const amount = Number(formData.get("quote_amount"));
  const validUntil = String(formData.get("quote_valid_until") ?? "").trim();
  const notes = String(formData.get("quote_notes") ?? "").trim().slice(0, 5000);

  const validDate = new Date(`${validUntil}T00:00:00.000Z`);
  const today = new Date().toISOString().slice(0, 10);

  if (
    !id ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(validUntil) ||
    Number.isNaN(validDate.getTime()) ||
    validDate.toISOString().slice(0, 10) !== validUntil ||
    validUntil < today
  ) {
    redirect(`/admin/quotes/${encodeURIComponent(id)}?quoteError=invalid`);
  }

  const supabase = getSupabaseAdmin();

  const { data: quote, error: fetchError } = await supabase
    .from("quote_requests")
    .select("id,name,email,project_name,project_type,quote_token")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !quote) {
    console.error("QUOTE PROPOSAL FETCH ERROR:", fetchError);
    redirect(`/admin/quotes/${encodeURIComponent(id)}?quoteError=not-found`);
  }

  const projectName = String(
    quote.project_name || quote.project_type || "Website Project"
  );

  const quoteToken = String(quote.quote_token || "").trim();

  if (!quoteToken) {
    redirect(`/admin/quotes/${encodeURIComponent(id)}?quoteError=missing-token`);
  }

  const productionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "myportfolio-six-weld.vercel.app";

  const siteUrl =
    process.env.NODE_ENV === "production"
      ? `https://${productionHost.replace(/^https?:\/\//, "")}`
      : "http://localhost:3000";

  const quoteUrl = `${siteUrl}/quote/${quoteToken}`;

  const formattedAmount = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(amount);

  const safeName = escapeHtml(String(quote.name || "Client"));
  const safeProject = escapeHtml(projectName);
  const safeAmount = escapeHtml(formattedAmount);
  const safeDate = escapeHtml(validUntil);
  const safeNotes = escapeHtml(notes).replace(/\n/g, "<br />");

  // Save the proposal details before attempting email delivery.
  const { error: saveError } = await supabase
    .from("quote_requests")
    .update({
      quote_amount: amount,
      quote_currency: "KES",
      quote_valid_until: validUntil,
      quote_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (saveError) {
    console.error("QUOTE PROPOSAL SAVE ERROR:", saveError);
    redirect(`/admin/quotes/${encodeURIComponent(id)}?quoteError=save`);
  }

  try {
    await sendEmail({
      to: quote.email,
      subject: `Quotation Proposal: ${projectName}`,
      text: [
        `Hello ${quote.name},`,
        "",
        `Thank you for your interest in ${projectName}.`,
        "",
        `Quotation Amount: ${formattedAmount}`,
        `Valid Until: ${validUntil}`,
        "",
        "Proposal Details:",
        notes || "Please contact us if you require further details.",
        "",
        "Review and respond to your quotation:",
        quoteUrl,
        "",
        "Kind regards,",
        "Portfolio Team",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;line-height:1.7">
          <div style="background:#0f172a;padding:24px;color:white">
            <h2 style="margin:0">Quotation Proposal</h2>
          </div>
          <div style="padding:24px;border:1px solid #e5e7eb">
            <p>Hello ${safeName},</p>
            <p>Thank you for your interest in our services. Please find your quotation below.</p>
            <h3>${safeProject}</h3>
            <div style="background:#f8fafc;padding:20px;border-radius:10px">
              <p style="margin:0;color:#64748b">Quotation Amount</p>
              <h2 style="margin:8px 0;color:#0f172a">${safeAmount}</h2>
              <p style="margin:0"><strong>Valid Until:</strong> ${safeDate}</p>
            </div>
            <h3>Proposal Details</h3>
            <p>${safeNotes || "Please contact us if you require further details."}</p>
            <div style="margin:28px 0;text-align:center">
              <a href="${quoteUrl}" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:bold">
                Review &amp; Respond to Quotation
              </a>
            </div>
            <p>You can review the proposal, accept it, or request revisions using the secure link above.</p>
            <p>Kind regards,<br/><strong>Portfolio Team</strong></p>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("QUOTE PROPOSAL EMAIL ERROR:", emailError);
    redirect(`/admin/quotes/${encodeURIComponent(id)}?quoteError=email`);
  }

  const sentAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("quote_requests")
    .update({
      status: "quoted",
      quote_sent_at: sentAt,
      updated_at: sentAt,
    })
    .eq("id", id);

  if (updateError) {
    console.error("QUOTE SENT STATUS UPDATE ERROR:", updateError);
    redirect(`/admin/quotes/${encodeURIComponent(id)}?quoteError=save-status`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);

  redirect(`/admin/quotes/${encodeURIComponent(id)}?quoteSent=1`);
}
