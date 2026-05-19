import { NextResponse } from "next/server";
import { sendEmail } from "../../../lib/email";
import { isRateLimited, isTooFast, recordRequest, verifyCaptcha } from "../../../lib/spam";

export async function POST(request: Request) {
  try {
    if (isRateLimited(request)) {
      return NextResponse.json({ error: "Too many submissions. Please wait and try again." }, { status: 429 });
    }

    const data = await request.json();
    const {
      name,
      email,
      company,
      projectType,
      budgetRange,
      timeline,
      projectDescription,
      features,
      phone,
      botField,
      formStart,
      captchaToken,
    } = data;

    if (botField?.trim()) {
      return NextResponse.json({ error: "Spam detected." }, { status: 400 });
    }

    const captchaEnabled = Boolean(process.env.RECAPTCHA_SECRET_KEY && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);

    if (captchaEnabled) {
      if (!captchaToken?.trim()) {
        return NextResponse.json({ error: "reCAPTCHA verification is required." }, { status: 400 });
      }

      if (!(await verifyCaptcha(captchaToken))) {
        return NextResponse.json({ error: "reCAPTCHA verification failed." }, { status: 400 });
      }
    }

    if (isTooFast(formStart)) {
      return NextResponse.json({ error: "Form submitted too quickly. Please try again." }, { status: 400 });
    }

    if (!name?.trim() || !email?.trim() || !projectType?.trim() || !budgetRange?.trim() || !timeline?.trim() || !projectDescription?.trim()) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    recordRequest(request);

    await sendEmail({
      subject: `Quote Request: ${projectType}`,
      text: `Name: ${name}\nEmail: ${email}\nCompany: ${company || 'N/A'}\nPhone: ${phone || 'N/A'}\nProject Type: ${projectType}\nBudget Range: ${budgetRange}\nTimeline: ${timeline}\n\nProject Description:\n${projectDescription}\n\nFeatures:\n${features || 'N/A'}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Company:</strong> ${company || 'N/A'}</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><p><strong>Project Type:</strong> ${projectType}</p><p><strong>Budget Range:</strong> ${budgetRange}</p><p><strong>Timeline:</strong> ${timeline}</p><p><strong>Project Description:</strong></p><p>${projectDescription.replace(/\n/g, "<br />")}</p><p><strong>Features:</strong></p><p>${(features || 'N/A').replace(/\n/g, "<br />")}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote submit error:", error);
    return NextResponse.json({ error: "Unable to submit quote request. Please try again later." }, { status: 500 });
  }
}
