"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getContractErrorCode(message: string): string {
  if (message.includes("An accepted quotation is required")) return "not-accepted";
  if (message.includes("Create the client project record")) return "missing-project";
  if (message.includes("Only a draft client project")) return "active-project";
  if (message.includes("not linked to a client profile")) return "missing-client";
  if (message.includes("email addresses do not match")) return "identity-mismatch";
  if (message.includes("quotation amount")) return "missing-price";
  if (message.includes("currency is not supported")) return "currency";
  if (message.includes("no current version")) return "reconcile";
  return "failed";
}

export async function createContractDraft(formData: FormData): Promise<void> {
  await requireAdmin();

  const quoteId = String(formData.get("quoteId") ?? "").trim();
  const title = String(formData.get("contractTitle") ?? "").trim();

  if (!UUID_REGEX.test(quoteId)) {
    throw new Error("Invalid quotation ID.");
  }

  if (title.length > 180) {
    redirect(`/admin/quotes/${quoteId}?contractError=invalid-title`);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .rpc("create_contract_draft_from_accepted_quote", {
      p_quote_id: quoteId,
      p_contract_title: title || null,
    })
    .single();

  if (error || !data) {
    console.error("Unable to create contract draft:", error?.message ?? "No contract returned.");
    redirect(`/admin/quotes/${quoteId}?contractError=${getContractErrorCode(error?.message ?? "")}`);
  }

  const result = data as {
    contract_id: string;
    contract_number: string;
    contract_version_id: string;
    client_project_id: string;
    created: boolean;
  };

  if (!UUID_REGEX.test(result.contract_id)) {
    console.error("Contract draft RPC returned an invalid contract identifier.");
    redirect(`/admin/quotes/${quoteId}?contractError=failed`);
  }

  revalidatePath("/admin/contracts");
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/contracts/${result.contract_id}`);
  redirect(`/admin/contracts/${result.contract_id}?created=${result.created ? "1" : "0"}`);
}
