import nodemailer from "nodemailer";
import { siteConfig } from "./siteConfig";

type EmailOptions = {
  subject: string;
  text: string;
  html: string;
};

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_TO, EMAIL_FROM } = process.env;

const isSmtpConfigured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

async function createTransport() {
  if (!isSmtpConfigured) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function sendEmail(options: EmailOptions) {
  const transport = await createTransport();

  const message = {
    from: EMAIL_FROM || SMTP_USER || "no-reply@example.com",
    to: EMAIL_TO || siteConfig.email || "hello@example.com",
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  if (!transport) {
    console.warn("[email] SMTP is not configured. Falling back to console output.");
    console.log(message);
    return;
  }

  await transport.sendMail(message);
}
