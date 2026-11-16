"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(value: string) {
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

export async function respondToQuote(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const response = String(formData.get("response") ?? "");

  const revisionNotes = String(formData.get("revision_notes") ?? "")
    .trim()
    .slice(0, 2000);

  if (!UUID_REGEX.test(token)) {
    redirect("/");
  }

  if (!["accepted", "revision_requested"].includes(response)) {
    redirect(`/quote/${token}?error=invalid`);
  }

  if (response === "revision_requested" && !revisionNotes) {
    redirect(`/quote/${token}?error=notes-required`);
  }

  const supabase = getSupabaseAdmin();
  const responseDate = new Date().toISOString();

  const { data, error } = await supabase
    .from("quote_requests")
    .update({
      client_response: response,
      client_response_at: responseDate,
      revision_notes: response === "revision_requested" ? revisionNotes : null,
      updated_at: responseDate,
    })
    .eq("quote_token", token)
    .eq("status", "quoted")
    .is("client_response", null)
    .select("id,name,email,project_name")
    .maybeSingle();

  if (error) {
    console.error("Quote response error:", error);
    redirect(`/quote/${token}?error=save`);
  }

  if (!data) {
    redirect(`/quote/${token}?error=already-responded`);
  }

  // Prepare admin notification.
  const clientName = String(data.name || "Unknown client");
  const clientEmail = String(data.email || "Not provided");
  const projectName = String(data.project_name || "Untitled project");

  const responseLabel =
    response === "accepted" ? "Quotation Accepted" : "Revision Requested";

  const productionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "myportfolio-six-weld.vercel.app";

  const siteUrl =
    process.env.NODE_ENV === "production"
      ? `https://${productionHost.replace(/^https?:\/\//, "")}`
      : "http://localhost:3000";

  const adminUrl = `${siteUrl}/admin/quotes/${data.id}`;

  const formattedDate = new Date(responseDate).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  });

  const safeClientName = escapeHtml(clientName);
  const safeClientEmail = escapeHtml(clientEmail);
  const safeProjectName = escapeHtml(projectName);
  const safeRevisionNotes = escapeHtml(revisionNotes);

  const revisionSection =
    response === "revision_requested"
      ? `\n\nRevision Notes:\n${revisionNotes}`
      : "";

  // Send notification without interrupting the client's successful response.
  try {
    await sendEmail({
      subject: `${responseLabel} — ${projectName}`,
      text: `
A client has responded to a quotation.

Response: ${responseLabel}

Client: ${clientName}
Email: ${clientEmail}
Project: ${projectName}
Quotation ID: ${data.id}
Date: ${formattedDate}
${revisionSection}

View quotation in admin:
${adminUrl}
      `.trim(),

      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#333;">
          <h2 style="color:#2563eb;">Client Quotation Response</h2>

          <p>A client has submitted a response to their quotation.</p>

          <div style="padding:18px;background:#f1f5f9;border-radius:8px;">
            <h3 style="margin-top:0;color:#1e40af;">
              ${escapeHtml(responseLabel)}
            </h3>

            <p><strong>Client:</strong> ${safeClientName}</p>
            <p><strong>Email:</strong> ${safeClientEmail}</p>
            <p><strong>Project:</strong> ${safeProjectName}</p>
            <p><strong>Quotation ID:</strong> ${escapeHtml(String(data.id))}</p>
            <p><strong>Date:</strong> ${escapeHtml(formattedDate)}</p>

            ${
              response === "revision_requested"
                ? `
                  <div style="margin-top:15px;padding:12px;background:#fff;border-left:4px solid #f59e0b;">
                    <strong>Revision Notes:</strong>
                    <p style="white-space:pre-wrap;">${safeRevisionNotes}</p>
                  </div>
                `
                : ""
            }
          </div>

          <p style="margin-top:25px;">
            <a href="${adminUrl}"
               style="background:#2563eb;color:#fff;padding:12px 20px;
               text-decoration:none;border-radius:6px;display:inline-block;">
              View Quotation in Admin
            </a>
          </p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Admin quotation notification failed:", emailError);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${data.id}`);

  redirect(`/quote/${token}?response=${response}`);
}
