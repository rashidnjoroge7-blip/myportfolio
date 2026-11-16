import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminEmail } from "@/lib/authOptions";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_REQUEST_SIZE = 4.5 * 1024 * 1024;

const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

function matchesImageSignature(type: string, bytes: Uint8Array): boolean {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));

  switch (type) {
    case "image/jpeg":
      return bytes.length >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff;

    case "image/png":
      return bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        ascii(1, 4) === "PNG" &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a;

    case "image/webp":
      return bytes.length >= 12 &&
        ascii(0, 4) === "RIFF" &&
        ascii(8, 12) === "WEBP";

    case "image/avif":
      return bytes.length >= 12 &&
        ascii(4, 8) === "ftyp" &&
        (ascii(8, 12) === "avif" || ascii(8, 12) === "avis");

    default:
      return false;
  }
}

export async function POST(request: Request) {
  try {
    // Authenticate before processing the uploaded file.
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Reject oversized requests before parsing multipart data.
    const contentLengthHeader = request.headers.get("content-length");

    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);

      if (!Number.isFinite(contentLength) || contentLength < 0) {
        return NextResponse.json(
          { error: "Invalid request size." },
          { status: 400 }
        );
      }

      if (contentLength > MAX_REQUEST_SIZE) {
        return NextResponse.json(
          { error: "Upload request is too large." },
          { status: 413 }
        );
      }
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid upload request." },
        { status: 400 }
      );
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose an image file." },
        { status: 400 }
      );
    }

    const extension = ALLOWED_TYPES.get(file.type);

    if (!extension) {
      return NextResponse.json(
        { error: "Use JPEG, PNG, WebP, or AVIF." },
        { status: 400 }
      );
    }

    if (file.size < 1 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be 4 MB or smaller." },
        { status: 400 }
      );
    }

    // Verify the actual binary signature, not just the MIME header.
    const signature = new Uint8Array(
      await file.slice(0, 12).arrayBuffer()
    );

    if (!matchesImageSignature(file.type, signature)) {
      return NextResponse.json(
        { error: "The uploaded file does not match its declared image format." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Unique filename and upsert disabled prevent accidental overwrites.
    const key = `${crypto.randomUUID()}.${extension}`;

    const { data, error } = await supabase.storage
      .from("project-images")
      .upload(key, file, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error || !data) {
      console.error("Project image upload error:", error?.message);

      return NextResponse.json(
        { error: "Upload failed. Check the project-images bucket setup." },
        { status: 500 }
      );
    }

    const publicUrl = supabase.storage
      .from("project-images")
      .getPublicUrl(data.path).data.publicUrl;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Admin upload error:", error);

    return NextResponse.json(
      { error: "Unable to process the upload." },
      { status: 500 }
    );
  }
}
