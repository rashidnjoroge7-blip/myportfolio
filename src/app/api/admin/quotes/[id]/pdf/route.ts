import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { siteConfig } from "@/lib/siteConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

function cleanText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCurrency(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null) {
  if (!value) return "Not specified";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Protect the PDF download using the existing admin authentication.
  await requireAdmin();

  try {
    const { id } = await params;

    const { data: quote, error } = await getSupabaseAdmin()
      .from("quote_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[quotation PDF] Database error:", error);
      return Response.json(
        { error: "Unable to retrieve quotation." },
        { status: 500 },
      );
    }

    if (!quote) {
      return Response.json({ error: "Quotation not found." }, { status: 404 });
    }

    if (quote.quote_amount === null || quote.quote_amount === undefined) {
      return Response.json(
        { error: "Please prepare and save the quotation amount first." },
        { status: 400 },
      );
    }

    const pdfDoc = await PDFDocument.create();

    pdfDoc.setTitle(`Quotation - ${quote.name}`);
    pdfDoc.setAuthor(siteConfig.company);
    pdfDoc.setSubject("Project quotation");
    pdfDoc.setCreator(siteConfig.name);

    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const navy = rgb(0.08, 0.14, 0.25);
    const accent = rgb(0.05, 0.48, 0.55);
    const muted = rgb(0.4, 0.44, 0.5);
    const light = rgb(0.94, 0.96, 0.98);
    const border = rgb(0.87, 0.89, 0.92);
    const white = rgb(1, 1, 1);

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    function drawText(
      text: string,
      x: number,
      top: number,
      size = 10,
      font = regularFont,
      color = navy,
    ) {
      page.drawText(cleanText(text), {
        x,
        y: top - size,
        size,
        font,
        color,
      });
    }

    function newPage() {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    function ensureSpace(height: number) {
      if (y - height < MARGIN + 25) {
        newPage();
      }
    }

    function wrapText(text: string, maxWidth: number, size = 10) {
      const words = cleanText(text).split(" ");
      const lines: string[] = [];
      let current = "";

      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;

        if (
          regularFont.widthOfTextAtSize(candidate, size) > maxWidth &&
          current
        ) {
          lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }

      if (current) lines.push(current);

      return lines;
    }

    function drawParagraph(
      text: string,
      options?: {
        size?: number;
        lineHeight?: number;
        color?: typeof navy;
        indent?: number;
      },
    ) {
      const size = options?.size ?? 10;
      const lineHeight = options?.lineHeight ?? 15;
      const color = options?.color ?? navy;
      const indent = options?.indent ?? 0;
      const maxWidth = PAGE_WIDTH - MARGIN * 2 - indent;

      const lines = wrapText(text, maxWidth, size);

      for (const line of lines) {
        ensureSpace(lineHeight);
        drawText(line, MARGIN + indent, y, size, regularFont, color);
        y -= lineHeight;
      }

      y -= 4;
    }

    function drawSection(title: string) {
      ensureSpace(35);

      y -= 8;

      page.drawRectangle({
        x: MARGIN,
        y: y - 20,
        width: PAGE_WIDTH - MARGIN * 2,
        height: 25,
        color: light,
      });

      drawText(title.toUpperCase(), MARGIN + 10, y - 3, 9, boldFont, accent);

      y -= 36;
    }

    function drawDetail(label: string, value: string) {
      ensureSpace(22);

      drawText(label, MARGIN, y, 9, boldFont, muted);
      drawText(value || "Not provided", MARGIN + 125, y, 10);

      y -= 21;
    }

    const reference =
      `QT-${new Date(quote.created_at).getFullYear()}-` +
      quote.id.replace(/-/g, "").slice(0, 8).toUpperCase();

    // Header
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 145,
      width: PAGE_WIDTH,
      height: 145,
      color: navy,
    });

    drawText(siteConfig.company, MARGIN, PAGE_HEIGHT - 48, 22, boldFont, white);
    drawText(
      siteConfig.tagline,
      MARGIN,
      PAGE_HEIGHT - 77,
      9,
      regularFont,
      white,
    );
    drawText(
      siteConfig.email,
      MARGIN,
      PAGE_HEIGHT - 105,
      9,
      regularFont,
      white,
    );
    drawText(
      siteConfig.phone,
      MARGIN,
      PAGE_HEIGHT - 120,
      9,
      regularFont,
      white,
    );
    drawText(
      siteConfig.location,
      MARGIN,
      PAGE_HEIGHT - 135,
      9,
      regularFont,
      white,
    );

    y = PAGE_HEIGHT - 180;

    drawText("PROJECT QUOTATION", MARGIN, y, 17, boldFont, navy);
    y -= 35;

    drawDetail("Quotation reference", reference);
    drawDetail("Quotation date", formatDate(quote.created_at));
    drawDetail("Valid until", formatDate(quote.quote_valid_until));

    // Client information
    drawSection("Client Information");

    drawDetail("Client name", quote.name);
    drawDetail("Company", quote.company || "Not provided");
    drawDetail("Email", quote.email);
    drawDetail("Phone", quote.phone || "Not provided");

    // Project information
    drawSection("Project Details");

    drawDetail("Project", quote.project_name || quote.project_type);
    drawDetail("Project type", quote.project_type);
    drawDetail("Budget range", quote.budget_range);
    drawDetail("Timeline", quote.timeline);

    drawText("Project description", MARGIN, y, 9, boldFont, muted);
    y -= 17;

    drawParagraph(quote.project_description || "No description provided.");

    if (quote.features) {
      drawText("Requested features", MARGIN, y, 9, boldFont, muted);
      y -= 17;
      drawParagraph(quote.features);
    }

    // Quotation amount
    drawSection("Quotation Summary");

    ensureSpace(75);

    const currency = quote.quote_currency || "KES";
    const amount = Number(quote.quote_amount);

    page.drawRectangle({
      x: MARGIN,
      y: y - 45,
      width: PAGE_WIDTH - MARGIN * 2,
      height: 58,
      color: light,
    });

    drawText("TOTAL PROJECT QUOTATION", MARGIN + 14, y - 5, 9, boldFont, muted);

    drawText(
      formatCurrency(amount, currency),
      MARGIN + 14,
      y - 28,
      19,
      boldFont,
      accent,
    );

    y -= 75;

    // Proposal notes
    if (quote.quote_notes) {
      drawSection("Proposal Notes");
      drawParagraph(quote.quote_notes);
    }

    // Footer on every page
    const pages = pdfDoc.getPages();

    pages.forEach((pdfPage, index) => {
      pdfPage.drawLine({
        start: { x: MARGIN, y: 32 },
        end: { x: PAGE_WIDTH - MARGIN, y: 32 },
        thickness: 0.7,
        color: border,
      });

      pdfPage.drawText(cleanText(siteConfig.company), {
        x: MARGIN,
        y: 19,
        size: 8,
        font: regularFont,
        color: muted,
      });

      pdfPage.drawText(`Page ${index + 1} of ${pages.length}`, {
        x: PAGE_WIDTH - MARGIN - 65,
        y: 19,
        size: 8,
        font: regularFont,
        color: muted,
      });
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reference}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[quotation PDF] Generation failed:", error);

    return Response.json(
      { error: "Unable to generate quotation PDF." },
      { status: 500 },
    );
  }
}
