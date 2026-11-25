import { Resend } from "resend";

type EmailOptions = {
  to?: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(options: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const resend = new Resend(apiKey);

  const from =
    process.env.EMAIL_FROM ||
    "Unihost Support <support@unihost.co.ke>";

  const to =
    options.to ||
    process.env.EMAIL_TO ||
    "support@unihost.co.ke";

  const { data, error } = await resend.emails.send({
    from,
    to,
    replyTo: options.replyTo,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  if (error) {
    console.error("[email] Resend delivery failed:", error);
    throw new Error(error.message);
  }

  console.log("[email] Resend accepted message:", data?.id);

  return data;
}
