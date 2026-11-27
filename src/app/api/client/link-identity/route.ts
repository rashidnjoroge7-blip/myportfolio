import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { linkAuthenticatedClient } from "@/lib/clientIdentity";

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;

  if (!requestOrigin || requestOrigin !== expectedOrigin) {
    return NextResponse.json(
      { success: false, error: "Invalid request origin." },
      { status: 403 },
    );
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }
try {
  const result = await linkAuthenticatedClient(user);

  if (!result.success) {
    await supabase.auth.signOut();

    console.error("Client identity linking rejected:", result.reason);

    return NextResponse.json(
      {
        success: false,
        error:
          "Your account could not be linked to a client profile. Please contact support.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ success: true });
} catch (error) {
  console.error("Unexpected client identity verification error:", error);

  await supabase.auth.signOut();

  return NextResponse.json(
    {
      success: false,
      error: "Unable to verify your client account. Please try again.",
    },
    { status: 500 },
  );
}
}
