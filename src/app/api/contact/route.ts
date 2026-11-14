import { NextResponse } from "next/server";
import { sendEmail } from "../../../lib/email";
import { consumeDistributedRateLimit, isTooFast, verifyTurnstile } from "../../../lib/spam";

export async function POST(request: Request) {
  try {
    let rateLimitAllowed: boolean;

    try {
      rateLimitAllowed = await consumeDistributedRateLimit(request, "contact");
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

    const data = await request.json();
    const { name, email, subject, message, botField, formStart, turnstileToken } = data;

    if (botField?.trim()) {
      return NextResponse.json({ error: "Spam detected." }, { status: 400 });
    }

    if (!process.env.TURNSTILE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Security verification is temporarily unavailable." },
        { status: 503 }
      );
    }

    if (typeof turnstileToken !== "string" || !turnstileToken.trim()) {
      return NextResponse.json(
        { error: "Security verification is required." },
        { status: 400 }
      );
    }

    let verified: boolean;

    try {
      verified = await verifyTurnstile(turnstileToken, "contact_form", request);
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

    if (isTooFast(formStart)) {
      return NextResponse.json({ error: "Form submitted too quickly. Please try again." }, { status: 400 });
    }

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    await sendEmail({
      replyTo: email,
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
