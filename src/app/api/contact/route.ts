import { NextResponse } from "next/server";
import { sendEmail } from "../../../lib/email";
import { isRateLimited, isTooFast, recordRequest, verifyCaptcha } from "../../../lib/spam";

export async function POST(request: Request) {
  try {
    if (isRateLimited(request)) {
      return NextResponse.json({ error: "Too many submissions. Please wait and try again." }, { status: 429 });
    }

    const data = await request.json();
    const { name, email, subject, message, botField, formStart, captchaToken } = data;

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

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    recordRequest(request);

    await sendEmail({
      subject: `Portfolio Contact: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, "<br />")}</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact submit error:", error);
    return NextResponse.json({ error: "Unable to submit message. Please try again later." }, { status: 500 });
  }
}
