"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getClientRedirectUrl(): string {
  const deploymentHost =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : process.env.VERCEL_URL;

  const baseUrl = deploymentHost
    ? `https://${deploymentHost.replace(/^https?:\/\//, "")}`
    : process.env.NEXTAUTH_URL || "http://localhost:3000";

  const url = new URL(baseUrl);

  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("Client access URL must use HTTPS.");
  }

  return new URL(
    "/auth/callback?next=%2Fclient%2Fset-password",
    url,
  ).toString();
}

export async function convertQuoteToProject(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const quoteId = String(formData.get("quoteId") ?? "").trim();
  const projectTitle = String(formData.get("projectTitle") ?? "").trim();

  if (!UUID_REGEX.test(quoteId) || !projectTitle || projectTitle.length > 200) {
    throw new Error("Invalid quotation ID or project title.");
  }

  const supabase = getSupabaseAdmin();

  // Validate the redirect configuration before creating the project.
  let emailRedirectTo: string;

  try {
    emailRedirectTo = getClientRedirectUrl();
  } catch (error) {
    console.error("Client access URL configuration error:", error);
    redirect(`/admin/quotes/${quoteId}?conversion=configuration-error`);
  }

  // The database function checks acceptance, locks the quotation,
  // prevents duplicate conversion and creates the project atomically.
  const { data: project, error: conversionError } = await supabase
    .rpc("convert_accepted_quote_to_project", {
      p_quote_id: quoteId,
      p_project_title: projectTitle,
    })
    .single();

  if (conversionError || !project) {
    console.error("Quotation conversion failed:", conversionError);
    revalidatePath(`/admin/quotes/${quoteId}`);
    redirect(`/admin/quotes/${quoteId}?conversion=failed`);
  }

  const convertedProject = project as {
    project_id: string;
    project_title: string;
    client_email: string;
  };

  if (!convertedProject.client_email) {
    console.error("Conversion succeeded but returned no client email.");
    revalidatePath(`/admin/quotes/${quoteId}`);
    redirect(`/admin/quotes/${quoteId}?conversion=email-failed`);
  }

  // Project creation has succeeded. Email delivery is a separate operation.
  const { error: emailError } = await supabase.auth.signInWithOtp({
    email: convertedProject.client_email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo,
    },
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin/quotes");
  revalidatePath("/client/dashboard");

  if (emailError) {
    console.error("Client access email failed:", emailError.message);
    redirect(`/admin/quotes/${quoteId}?conversion=email-failed`);
  }

  redirect(`/admin/quotes/${quoteId}?conversion=success`);
}

export async function resendClientAccessLink(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const quoteId = String(formData.get("quoteId") ?? "").trim();

  if (!UUID_REGEX.test(quoteId)) {
    throw new Error("Invalid quotation ID.");
  }

  const supabase = getSupabaseAdmin();

  let emailRedirectTo: string;

  try {
    emailRedirectTo = getClientRedirectUrl();
  } catch (error) {
    console.error("Client access URL configuration error:", error);
    redirect(`/admin/quotes/${quoteId}?accessLink=configuration-error`);
  }

  // Resend is allowed for any accepted quotation that already has a
  // client project. Some historical accepted records still carry "quoted"
  // status, so status alone must not block this recovery action.
  const { data: quote, error: quoteError } = await supabase
    .from("quote_requests")
    .select("id, email, client_response")
    .eq("id", quoteId)
    .maybeSingle();

  if (
    quoteError ||
    !quote ||
    quote.client_response !== "accepted" ||
    !quote.email
  ) {
    redirect(`/admin/quotes/${quoteId}?accessLink=not-eligible`);
  }

  const { data: project, error: projectError } = await supabase
    .from("client_projects")
    .select("id, client_id")
    .eq("quote_request_id", quoteId)
    .maybeSingle();

  if (projectError || !project?.client_id) {
    redirect(`/admin/quotes/${quoteId}?accessLink=not-eligible`);
  }

  // Send only to the email on the client identity linked to this project.
  // This prevents a changed quotation email from redirecting access elsewhere.
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, email")
    .eq("id", project.client_id)
    .maybeSingle();

  if (
    clientError ||
    !client?.email ||
    client.email.trim().toLowerCase() !== quote.email.trim().toLowerCase()
  ) {
    redirect(`/admin/quotes/${quoteId}?accessLink=not-eligible`);
  }

  const { error: emailError } = await supabase.auth.signInWithOtp({
    email: client.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo,
    },
  });

  revalidatePath(`/admin/quotes/${quoteId}`);

  if (emailError) {
    console.error("Client access resend failed:", emailError.message);
    redirect(`/admin/quotes/${quoteId}?accessLink=failed`);
  }

  redirect(`/admin/quotes/${quoteId}?accessLink=sent`);
}
