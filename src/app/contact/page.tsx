"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";

import { siteConfig } from "../../lib/siteConfig";
import TurnstileWidget from "../../components/TurnstileWidget";

type FormErrors = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialFormData: ContactFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [botField, setBotField] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState(false);
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);

  const formStartRef = useRef<number>(0);

  // Record form initialization time.
  useEffect(() => {
    formStartRef.current = Date.now();
  }, []);


  // Validate individual fields.
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 2) {
          return "Name must be at least 2 characters";
        }
        return "";

      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email";
        }
        return "";

      case "subject":
        if (!value.trim()) return "Subject is required";
        if (value.trim().length < 3) {
          return "Subject must be at least 3 characters";
        }
        return "";

      case "message":
        if (!value.trim()) return "Message is required";
        if (value.trim().length < 10) {
          return "Message must be at least 10 characters";
        }
        return "";

      default:
        return "";
    }
  };

  // Handle field changes.
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      const error = validateField(name, value);

      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  // Validate fields when focus leaves them.
  const handleBlur = (
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Validate the entire form.
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof ContactFormData]);

      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });

    setErrors(newErrors);

    setTouched((prev) => ({
      ...prev,
      ...Object.fromEntries(Object.keys(formData).map((key) => [key, true])),
    }));

    return Object.keys(newErrors).length === 0;
  };

  // Submit contact message.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    if (!turnstileToken) {
      setSubmitError(
        "Please complete the security verification before submitting.",
      );
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          botField,
          formStart: formStartRef.current,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit message.");
      }

      setSubmitted(true);

      setSuccessMessage(
        "Thank you for your message! I'll get back to you soon.",
      );

      // Reset form after displaying success message.
      window.setTimeout(() => {
        setFormData(initialFormData);
        setErrors({});
        setTouched({});
        setBotField("");
        setSubmitted(false);
        setSuccessMessage("");
        formStartRef.current = Date.now();
        setTurnstileToken("");
        setTurnstileResetSignal((value) => value + 1);
      }, 4000);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit message.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <section className="border-b border-[var(--card-border)] px-6 py-20 fade-in">
        <div className="mx-auto max-w-5xl">
          <h1 className="section-title mb-4">Get In Touch</h1>

          <p className="section-subtitle">
            Have a project in mind? I&apos;d love to hear from you. Let&apos;s
            discuss how I can help.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Contact Information */}
            <div>
              <h2 className="stagger-1 mb-8 text-2xl font-bold text-[var(--color-dark-blue-400)]">
                Contact Information
              </h2>

              <div className="space-y-8">
                {/* Email */}
                <div className="card stagger-1">
                  <div className="mb-3 text-[var(--color-forest-green-400)]"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></div>

                  <h3 className="mb-2 font-semibold text-[var(--color-forest-green-400)]">
                    Email
                  </h3>

                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="text-slate-300 transition-colors hover:text-[var(--color-dark-blue-400)]"
                  >
                    {siteConfig.email}
                  </a>
                </div>

                {/* Phone */}
                <div className="card stagger-2">
                  <div className="mb-3 text-[var(--color-forest-green-400)]"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.08 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.69A2 2 0 0 1 22 16.92z"/></svg></div>

                  <h3 className="mb-2 font-semibold text-[var(--color-forest-green-400)]">
                    Phone
                  </h3>

                  <a
                    href={`tel:${siteConfig.phone}`}
                    className="text-slate-300 transition-colors hover:text-[var(--color-dark-blue-400)]"
                  >
                    {siteConfig.phone}
                  </a>
                </div>
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${siteConfig.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Hello UniHost Technologies, I would like to make an enquiry.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card stagger-3 block"
                  aria-label="Chat with UniHost Technologies on WhatsApp"
                >
                  <div className="mb-3 text-[var(--color-forest-green-400)]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.5 0 .15 5.35.15 11.93c0 2.1.55 4.16 1.6 5.98L.05 24l6.23-1.63a11.9 11.9 0 0 0 5.8 1.5h.01c6.58 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.19-3.5-8.46ZM12.09 21.85a9.9 9.9 0 0 1-5.05-1.39l-.36-.21-3.7.97.99-3.6-.24-.37a9.88 9.88 0 0 1-1.52-5.32c0-5.45 4.44-9.89 9.9-9.89a9.82 9.82 0 0 1 7 2.9 9.82 9.82 0 0 1 2.9 7c0 5.46-4.45 9.9-9.91 9.9Zm5.43-7.41c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.23-.65.08-.3-.15-1.26-.47-2.4-1.49-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.28.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.23 5.14 4.53.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z"/>
                    </svg>
                  </div>

                  <h3 className="mb-2 font-semibold text-[var(--color-forest-green-400)]">
                    WhatsApp
                  </h3>

                  <p className="text-slate-300 transition-colors hover:text-[var(--color-dark-blue-400)]">
                    Chat with us directly
                  </p>
                </a>
                {/* GitHub */}
                <div className="card">
                  <div className="mb-3 text-[var(--color-forest-green-400)]"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.07c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.48-.28-5.08-1.24-5.08-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.06 1.15a10.6 10.6 0 0 1 5.57 0c2.12-1.45 3.06-1.15 3.06-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.6 5.23-5.09 5.51.4.35.76 1.03.76 2.08V22c0 .29.2.64.77.53A11.1 11.1 0 0 0 12 .9z"/></svg></div>

                  <h3 className="mb-2 font-semibold text-[var(--color-forest-green-400)]">
                    GitHub
                  </h3>

                  <a
                    href={siteConfig.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 transition-colors hover:text-[var(--color-dark-blue-400)]"
                  >
                    {siteConfig.github.replace("https://", "")}
                  </a>
                </div>

                {/* Location */}
                <div className="card stagger-4">
                  <div className="mb-3 text-[var(--color-forest-green-400)]"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></div>

                  <h3 className="mb-2 font-semibold text-[var(--color-forest-green-400)]">
                    Location
                  </h3>

                  <p className="text-slate-300">{siteConfig.location}</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="stagger-2 mb-8 text-2xl font-bold text-[var(--color-dark-blue-400)]">
                Send Me a Message
              </h2>

              {submitted ? (
                <div className="card scale-fade-in border-2 border-[var(--color-forest-green-600)] bg-[var(--color-forest-green-900)]/20">
                  <div className="mb-4 text-center text-5xl">&#10003;</div>

                  <p className="text-center font-semibold text-[var(--color-forest-green-400)]">
                    {successMessage}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="botField"
                    value={botField}
                    onChange={(e) => setBotField(e.target.value)}
                    autoComplete="off"
                    aria-hidden="true"
                    tabIndex={-1}
                    className="hidden"
                  />

                  <div className="space-y-2">
                    <TurnstileWidget
                      action="contact_form"
                      resetSignal={turnstileResetSignal}
                      onToken={(token) => {
                        setTurnstileToken(token);
                        setTurnstileError(false);
                        setSubmitError("");
                      }}
                      onError={() => {
                        setTurnstileToken("");
                        setTurnstileError(true);
                      }}
                    />

                    {turnstileError && (
                      <p role="alert" className="text-sm text-yellow-300">
                        Security verification could not initialize.
                        Please refresh the page and try again.
                      </p>
                    )}
                  </div>

                  {/* Submission Error */}
                  {submitError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-500 bg-red-500/10 p-4 text-sm text-red-200"
                    >
                      {submitError}
                    </div>
                  )}

                  {/* Name */}
                  <div className="stagger-1">
                    <label
                      htmlFor="name"
                      className="mb-2 block font-medium text-slate-300"
                    >
                      Name
                    </label>

                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="name"
                      required
                      aria-invalid={!!(touched.name && errors.name)}
                      className={`w-full rounded-lg border bg-slate-900 px-4 py-2 text-slate-100 transition-all focus:outline-none ${
                        touched.name && errors.name
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : "border-slate-700 focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20"
                      }`}
                      placeholder="Your Name"
                    />

                    {touched.name && errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="stagger-2">
                    <label
                      htmlFor="email"
                      className="mb-2 block font-medium text-slate-300"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="email"
                      required
                      aria-invalid={!!(touched.email && errors.email)}
                      className={`w-full rounded-lg border bg-slate-900 px-4 py-2 text-slate-100 transition-all focus:outline-none ${
                        touched.email && errors.email
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : "border-slate-700 focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20"
                      }`}
                      placeholder="your@email.com"
                    />

                    {touched.email && errors.email && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="stagger-3">
                    <label
                      htmlFor="subject"
                      className="mb-2 block font-medium text-slate-300"
                    >
                      Subject
                    </label>

                    <input
                      id="subject"
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-invalid={!!(touched.subject && errors.subject)}
                      className={`w-full rounded-lg border bg-slate-900 px-4 py-2 text-slate-100 transition-all focus:outline-none ${
                        touched.subject && errors.subject
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : "border-slate-700 focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20"
                      }`}
                      placeholder="Project subject"
                    />

                    {touched.subject && errors.subject && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="stagger-4">
                    <label
                      htmlFor="message"
                      className="mb-2 block font-medium text-slate-300"
                    >
                      Message
                    </label>

                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows={6}
                      required
                      aria-invalid={!!(touched.message && errors.message)}
                      className={`w-full resize-none rounded-lg border bg-slate-900 px-4 py-2 text-slate-100 transition-all focus:outline-none ${
                        touched.message && errors.message
                          ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : "border-slate-700 focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20"
                      }`}
                      placeholder="Tell me about your project..."
                    />

                    {touched.message && errors.message && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={
                      submitting || turnstileError || !turnstileToken
                    }
                    className={`btn-primary stagger-5 w-full transition-all hover:shadow-lg hover:shadow-[var(--accent)]/30 ${
                      submitting ? "cursor-not-allowed opacity-70" : ""
                    }`}
                  >
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="border-t border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-20 fade-in">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="stagger-1 mb-8 text-2xl font-bold text-white">
            Connect With Me
          </h2>

          <div className="flex flex-wrap justify-center gap-6">

            {/* GitHub */}
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="stagger-4 flex h-12 w-12 transform items-center justify-center rounded-full bg-[var(--color-dark-blue-600)] transition-colors duration-300 hover:scale-110 hover:bg-[var(--color-dark-blue-700)] hover:shadow-lg hover:shadow-[var(--accent)]/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="currentColor" className="text-white" aria-hidden="true"><path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.07c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.48-.28-5.08-1.24-5.08-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.06 1.15a10.6 10.6 0 0 1 5.57 0c2.12-1.45 3.06-1.15 3.06-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.6 5.23-5.09 5.51.4.35.76 1.03.76 2.08V22c0 .29.2.64.77.53A11.1 11.1 0 0 0 12 .9z"/></svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}



