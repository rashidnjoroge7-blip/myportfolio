import { NextResponse } from "next/server";
import { sendEmail } from "../../../lib/email";
import {
  isRateLimited,
  isTooFast,
  recordRequest,
  verifyCaptcha,
} from "../../../lib/spam";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/\0/g, "")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value: string): string {
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

export async function POST(request: Request) {
  try {
    // 1. Rate limiting
    if (isRateLimited(request)) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait and try again." },
        { status: 429 }
      );
    }

    // 2. Parse request
    let body: Record<string, unknown>;

    try {
      const parsed = await request.json();

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json(
          { error: "Invalid submission data." },
          { status: 400 }
        );
      }

      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid request format." },
        { status: 400 }
      );
    }

    // 3. Extract and sanitise fields
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 254).toLowerCase();
    const company = cleanText(body.company, 150);
    const phone = cleanText(body.phone, 40);
    const projectName = cleanText(body.projectName, 150);
    const projectType = cleanText(body.projectType, 100);
    const projectDescription = cleanText(body.projectDescription, 10000);
    const budgetRange = cleanText(body.budgetRange, 100);
    const timeline = cleanText(body.timeline, 100);
    const features = cleanText(body.features, 5000);
    const botField = cleanText(body.botField, 500);
    const captchaToken = cleanText(body.captchaToken, 5000);

    // 4. Honeypot protection
    if (botField) {
      return NextResponse.json(
        { error: "Spam detected." },
        { status: 400 }
      );
    }

    // 5. reCAPTCHA verification when configured
    const captchaEnabled = Boolean(
      process.env.RECAPTCHA_SECRET_KEY &&
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    );

    if (captchaEnabled) {
      if (!captchaToken) {
        return NextResponse.json(
          { error: "Security verification is required." },
          { status: 400 }
        );
      }

      const verified = await verifyCaptcha(captchaToken);

      if (!verified) {
        return NextResponse.json(
          { error: "Security verification failed." },
          { status: 400 }
        );
      }
    }

    // 6. Submission timing protection
    if (isTooFast(body.formStart)) {
      return NextResponse.json(
        { error: "Form submitted too quickly. Please try again." },
        { status: 400 }
      );
    }

    // 7. Required field validation
    if (
      !name ||
      !email ||
      !projectType ||
      !budgetRange ||
      !timeline ||
      projectDescription.length < 20
    ) {
      return NextResponse.json(
        {
          error:
            "Please complete all required fields. Project description must contain at least 20 characters.",
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // 8. Record valid submission attempt
    recordRequest(request);

    // 9. Save quotation to Supabase
    const supabase = getSupabaseAdmin();

    const { data: quote, error: databaseError } = await supabase
      .from("quote_requests")
      .insert({
        name,
        email,
        company: company || null,
        phone: phone || null,
        project_name: projectName || null,
        project_type: projectType,
        project_description: projectDescription,
        budget_range: budgetRange,
        timeline,
        features: features || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (databaseError || !quote) {
      console.error("QUOTE DATABASE ERROR:", databaseError);

      return NextResponse.json(
        { error: "Unable to save your quotation. Please try again later." },
        { status: 500 }
      );
    }

    // 10. Send administrator notification
    let emailSent = false;

    const smtpConfigured = Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );

    if (smtpConfigured) {
      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safeCompany = escapeHtml(company || "N/A");
      const safePhone = escapeHtml(phone || "N/A");
      const safeProject = escapeHtml(projectName || projectType);
      const safeType = escapeHtml(projectType);
      const safeBudget = escapeHtml(budgetRange);
      const safeTimeline = escapeHtml(timeline);
      const safeDescription = escapeHtml(projectDescription).replace(
        /\n/g,
        "<br />"
      );
      const safeFeatures = escapeHtml(features || "N/A").replace(
        /\n/g,
        "<br />"
      );

      try {
        await sendEmail({
          subject: `New Quote Request: ${projectType}`,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Company: ${company || "N/A"}`,
            `Phone: ${phone || "N/A"}`,
            `Project: ${projectName || projectType}`,
            `Project Type: ${projectType}`,
            `Budget: ${budgetRange}`,
            `Timeline: ${timeline}`,
            "",
            "Project Description:",
            projectDescription,
            "",
            "Features:",
            features || "N/A",
            "",
            `Reference: ${quote.id}`,
          ].join("\n"),
          html: `
            <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
              <div style="background:#0f172a;color:white;padding:24px">
                <h2 style="margin:0">New Website Quotation Request</h2>
              </div>
              <div style="padding:24px;border:1px solid #e2e8f0">
                <p><strong>Client:</strong> ${safeName}</p>
                <p><strong>Email:</strong> ${safeEmail}</p>
                <p><strong>Company:</strong> ${safeCompany}</p>
                <p><strong>Phone:</strong> ${safePhone}</p>
                <p><strong>Project:</strong> ${safeProject}</p>
                <p><strong>Project Type:</strong> ${safeType}</p>
                <p><strong>Budget:</strong> ${safeBudget}</p>
                <p><strong>Timeline:</strong> ${safeTimeline}</p>
                <hr />
                <h3>Project Description</h3>
                <p>${safeDescription}</p>
                <h3>Requested Features</h3>
                <p>${safeFeatures}</p>
                <hr />
                <p><strong>Quotation Reference:</strong> ${quote.id}</p>
              </div>
            </div>
          `,
        });

        emailSent = true;
      } catch (emailError) {
        console.error("QUOTE NOTIFICATION EMAIL ERROR:", emailError);
      }
    } else {
      console.warn(
        "[QUOTE] SMTP is not configured. Request saved, but notification was not sent."
      );
    }

    // 11. Successful response
    return NextResponse.json(
      {
        success: true,
        message: "Your quotation request was received successfully.",
        quoteId: quote.id,
        emailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("QUOTE SUBMISSION ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to process your quotation. Please try again later.",
      },
      { status: 500 }
    );
  }
}
