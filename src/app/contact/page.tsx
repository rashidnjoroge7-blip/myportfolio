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
                  <div className="mb-3 text-3xl">ðŸ“§</div>

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
                  <div className="mb-3 text-3xl">ðŸ“ž</div>

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

                {/* LinkedIn */}
                <div className="card">
                  <div className="mb-3 text-3xl">ðŸ’¼</div>

                  <h3 className="mb-2 font-semibold text-[var(--color-forest-green-400)]">
                    LinkedIn
                  </h3>

                  <a
                    href={siteConfig.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 transition-colors hover:text-[var(--color-dark-blue-400)]"
                  >
                    {siteConfig.linkedin.replace("https://", "")}
                  </a>
                </div>

                {/* GitHub */}
                <div className="card">
                  <div className="mb-3 text-3xl">ðŸ™</div>

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
                  <div className="mb-3 text-3xl">ðŸŒ</div>

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
                  <div className="mb-4 text-center text-5xl">âœ“</div>

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
            {/* Facebook */}
            <a
              href={siteConfig.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="stagger-1 flex h-12 w-12 transform items-center justify-center rounded-full bg-[var(--color-dark-blue-600)] transition-colors duration-300 hover:scale-110 hover:bg-[var(--color-dark-blue-700)] hover:shadow-lg hover:shadow-[var(--accent)]/40"
            >
              <span className="text-white">f</span>
            </a>

            {/* X / Twitter */}
            <a
              href={siteConfig.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X / Twitter"
              className="stagger-2 flex h-12 w-12 transform items-center justify-center rounded-full bg-[var(--color-dark-blue-600)] transition-colors duration-300 hover:scale-110 hover:bg-[var(--color-dark-blue-700)] hover:shadow-lg hover:shadow-[var(--accent)]/40"
            >
              <span className="text-white">ð•</span>
            </a>

            {/* LinkedIn */}
            <a
              href={siteConfig.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="stagger-3 flex h-12 w-12 transform items-center justify-center rounded-full bg-[var(--color-forest-green-600)] transition-colors duration-300 hover:scale-110 hover:bg-[var(--color-forest-green-700)] hover:shadow-lg hover:shadow-[var(--accent-2)]/40"
            >
              <span className="text-white">in</span>
            </a>

            {/* GitHub */}
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="stagger-4 flex h-12 w-12 transform items-center justify-center rounded-full bg-[var(--color-dark-blue-600)] transition-colors duration-300 hover:scale-110 hover:bg-[var(--color-dark-blue-700)] hover:shadow-lg hover:shadow-[var(--accent)]/40"
            >
              <span className="text-white">âš™</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}


