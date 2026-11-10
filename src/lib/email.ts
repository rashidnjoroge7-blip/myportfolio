import { SMTPClient } from "emailjs";
import { siteConfig } from "./siteConfig";

type EmailOptions = {
  to?: string;
  subject: string;
  text: string;
  html: string;
};

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_TO,
  EMAIL_FROM,
} = process.env;

const isSmtpConfigured = Boolean(
  SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS
);

export async function sendEmail(options: EmailOptions) {
  const message = {
    from: EMAIL_FROM || SMTP_USER || "no-reply@example.com",
    to: options.to || EMAIL_TO || siteConfig.email || "hello@example.com",
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  if (!isSmtpConfigured) {
    console.warn(
      "[email] SMTP is not configured. Falling back to console output."
    );
    console.log(message);
    return;
  }

  const port = Number(SMTP_PORT);

  const client = new SMTPClient({
    host: SMTP_HOST!,
    port,
    user: SMTP_USER!,
    password: SMTP_PASS!,
    ssl: port === 465,
    tls: port === 587,
    timeout: 15000,
  });

  try {
    await client.sendAsync({
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      attachment: [
        {
          data: message.html,
          alternative: true,
          contentType: "text/html",
        },
      ],
    });
  } finally {
    client.smtp.close();
  }
}
