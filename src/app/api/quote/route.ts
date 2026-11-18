import { NextResponse } from "next/server";
import { sendEmail } from "../../../lib/email";
import {
  consumeDistributedRateLimit,
  isTooFast,
  verifyTurnstile,
} from "../../../lib/spam";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import {
  calculateProjectEstimate,
  validateEstimatorSelections,
  type EstimatorSelections,
  type ProjectCategory,
} from "../../../lib/projectEstimator";

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

const categoryLabels: Record<ProjectCategory, string> = {
  landing: "Landing Page",
  business: "Business Website",
  corporate: "Corporate Website",
  ecommerce: "E-commerce Website",
  webapp: "Custom Web Application",
};

const sizeLabels: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  enterprise: "Enterprise",
};

const designLabels: Record<string, string> = {
  standard: "Standard",
  custom: "Custom",
  premium: "Premium",
};

const featureLabels: Record<string, string> = {
  booking: "Booking System",
  payments: "Online Payments",
  accounts: "User Accounts",
  dashboard: "Admin Dashboard",
  integrations: "Third-party Integrations",
  cms: "Content Management System",
  seo: "SEO Setup",
};

const serviceLabels: Record<string, string> = {
  hosting: "Hosting",
  maintenance: "Maintenance",
};

function formatKES(amount: number): string {
  return `KES ${new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export async function POST(request: Request) {
  try {
    // 1. Distributed rate limiting
    let rateLimitAllowed: boolean;

    try {
      rateLimitAllowed = await consumeDistributedRateLimit(request, "quote");
    } catch {
      return NextResponse.json(
        { error: "Submission service temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    if (!rateLimitAllowed) {
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

    // 3. Extract and sanitise common fields
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 254).toLowerCase();
    const company = cleanText(body.company, 150);
    const phone = cleanText(body.phone, 40);
    const projectName = cleanText(body.projectName, 150);
    const submittedProjectType = cleanText(body.projectType, 100);
    const submittedDescription = cleanText(body.projectDescription, 10000);
    const submittedBudget = cleanText(body.budgetRange, 100);
    const timeline = cleanText(body.timeline, 100);
    const submittedFeatures = cleanText(body.features, 5000);
    const botField = cleanText(body.botField, 500);
    const turnstileToken = cleanText(body.turnstileToken, 5000);

    // 4. Determine whether this is an estimator submission
    const isEstimator = body.submissionSource === "project_estimator";

    let estimatorSelections: EstimatorSelections | null = null;
    let estimate: ReturnType<typeof calculateProjectEstimate> | null = null;

    let projectType = submittedProjectType;
    let projectDescription = submittedDescription;
    let budgetRange = submittedBudget;
    let features = submittedFeatures;

    if (isEstimator) {
      if (!validateEstimatorSelections(body.estimator)) {
        return NextResponse.json(
          { error: "Invalid project estimator selections. Please review your project options." },
          { status: 400 }
        );
      }

      estimatorSelections = body.estimator;
      estimate = calculateProjectEstimate(estimatorSelections);

      // Derive the project type from the validated category.
      projectType = categoryLabels[estimatorSelections.category];

      const selectedFeatures = estimatorSelections.features.map(
        (feature) => featureLabels[feature]
      );

      const selectedServices = estimatorSelections.services.map(
        (service) => serviceLabels[service]
      );

      features = [
        ...selectedFeatures,
        ...selectedServices.map((service) => `${service} requested`),
      ].join("\n");

      if (!projectDescription) {
        projectDescription = [
          `Project estimate request for a ${projectType}.`,
          `Project size: ${sizeLabels[estimatorSelections.size]}.`,
          `Design level: ${designLabels[estimatorSelections.design]}.`,
          `Selected features: ${selectedFeatures.join(", ") || "None specified"}.`,
          `Additional services: ${selectedServices.join(", ") || "None specified"}.`,
        ].join("\n");
      }

      // Never trust a price submitted by the browser.
      budgetRange = `${formatKES(estimate.minimum)} - ${formatKES(estimate.maximum)}`;
    }

    // 5. Honeypot protection
    if (botField) {
      return NextResponse.json(
        { error: "Spam detected." },
        { status: 400 }
      );
    }

    // 6. Cloudflare Turnstile verification
    if (!process.env.TURNSTILE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Security verification is temporarily unavailable." },
        { status: 503 }
      );
    }

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Security verification is required." },
        { status: 400 }
      );
    }

    let verified: boolean;

    try {
      verified = await verifyTurnstile(turnstileToken, "quote_form", request);
    } catch {
      return NextResponse.json(
        { error: "Security verification is temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Security verification failed. Please try again." },
        { status: 400 }
      );
    }

    // 7. Submission timing protection
    if (isTooFast(body.formStart)) {
      return NextResponse.json(
        { error: "Form submitted too quickly. Please try again." },
        { status: 400 }
      );
    }

    // 8. Required field validation
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
        estimate_min: estimate?.minimum ?? null,
        estimate_max: estimate?.maximum ?? null,
        estimate_currency: "KES",
        estimator_details: estimatorSelections ?? {},
        submission_source: isEstimator ? "project_estimator" : "quote_form",
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

      const estimateText = estimate
        ? `${formatKES(estimate.minimum)} - ${formatKES(estimate.maximum)}`
        : "";

      const safeEstimate = escapeHtml(estimateText);

      try {
        await sendEmail({
          subject: `${isEstimator ? "New Project Estimate" : "New Quote Request"}: ${projectType}`,
          text: [
            `Submission Type: ${isEstimator ? "Project Estimator" : "Standard Quote Form"}`,
            `Name: ${name}`,
            `Email: ${email}`,
            `Company: ${company || "N/A"}`,
            `Phone: ${phone || "N/A"}`,
            `Project: ${projectName || projectType}`,
            `Project Type: ${projectType}`,
            `Budget: ${budgetRange}`,
            ...(estimate ? [`Indicative Estimate: ${estimateText}`] : []),
            `Timeline: ${timeline}`,
            "",
            "Project Description:",
            projectDescription,
            "",
            "Features and Services:",
            features || "N/A",
            "",
            `Reference: ${quote.id}`,
          ].join("\n"),
          html: `
            <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#1e293b;line-height:1.6">
              <div style="background:#0f172a;color:white;padding:24px">
                <h2 style="margin:0">${isEstimator ? "New Project Estimate Request" : "New Website Quotation Request"}</h2>
              </div>
              <div style="padding:24px;border:1px solid #e2e8f0">
                <p><strong>Submission Type:</strong> ${isEstimator ? "Project Estimator" : "Standard Quote Form"}</p>
                <p><strong>Client:</strong> ${safeName}</p>
                <p><strong>Email:</strong> ${safeEmail}</p>
                <p><strong>Company:</strong> ${safeCompany}</p>
                <p><strong>Phone:</strong> ${safePhone}</p>
                <p><strong>Project:</strong> ${safeProject}</p>
                <p><strong>Project Type:</strong> ${safeType}</p>
                <p><strong>Budget:</strong> ${safeBudget}</p>
                ${estimate ? `<p><strong>Indicative Estimate:</strong> ${safeEstimate}</p>` : ""}
                <p><strong>Timeline:</strong> ${safeTimeline}</p>
                <hr />
                <h3>Project Description</h3>
                <p>${safeDescription}</p>
                <h3>Requested Features and Services</h3>
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
        message: isEstimator
          ? "Your project estimate request was received successfully."
          : "Your quotation request was received successfully.",
        quoteId: quote.id,
        emailSent,
        ...(estimate
          ? {
              estimate: {
                minimum: estimate.minimum,
                maximum: estimate.maximum,
                currency: estimate.currency,
              },
            }
          : {}),
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
