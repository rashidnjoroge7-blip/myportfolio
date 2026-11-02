import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail } from "@/lib/authOptions";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"]]);
  const extension = allowed.get(file.type);
  if (!extension) return NextResponse.json({ error: "Use JPEG, PNG, WebP, or AVIF." }, { status: 400 });
  if (file.size < 1 || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const key = `${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage.from("project-images").upload(key, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error || !data) return NextResponse.json({ error: "Upload failed. Check the project-images bucket setup." }, { status: 500 });
  return NextResponse.json({ url: supabase.storage.from("project-images").getPublicUrl(data.path).data.publicUrl });
}
