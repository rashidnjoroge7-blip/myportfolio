"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, FocusEvent } from "react";
import { useRecaptcha } from "../../lib/useRecaptcha";

type FormData = {
  name: string;
  email: string;
  company: string;
  phone: string;
  projectName: string;
  projectType: string;
  projectDescription: string;
  budgetRange: string;
  timeline: string;
  features: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialFormData: FormData = {
  name: "",
  email: "",
  company: "",
  phone: "",
  projectName: "",
  projectType: "",
  projectDescription: "",
  budgetRange: "",
  timeline: "",
  features: "",
};

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20";

const labelClass = "mb-2 block text-sm font-medium text-slate-300";

export default function RequestQuote() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [botField, setBotField] = useState("");

  const formStartRef = useRef(Date.now());

  const {
    enabled: captchaEnabled,
    ready: captchaReady,
    loadError: captchaLoadError,
    getToken,
  } = useRecaptcha();

  // Automatically populate the selected portfolio project.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const project = params.get("project");

    if (project) {
      setFormData((prev) => ({
        ...prev,
        projectName: project.slice(0, 150),
      }));
    }
  }, []);

  const projectTypes = [
    "Website Development",
    "Web Application",
    "Mobile App",
    "E-Commerce Website",
    "WordPress Development",
    "Business Website",
    "SaaS Product",
    "Dashboard / Analytics",
    "Landing Page",
    "API Development",
    "Website Redesign",
    "Other",
  ];

  const budgetRanges = [
    "Below KES 15,000",
    "KES 15,000 - 30,000",
    "KES 30,000 - 60,000",
    "KES 60,000 - 100,000",
    "KES 100,000 - 250,000",
    "KES 250,000+",
    "Below USD 500",
    "USD 500 - 1,000",
    "USD 1,000 - 5,000",
    "USD 5,000+",
    "Not sure / Need advice",
  ];

  const timelines = [
    "ASAP (Less than 1 month)",
    "1-3 months",
    "3-6 months",
    "6+ months",
    "Flexible",
  ];

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Full name is required.";
        if (value.trim().length < 2) return "Please enter a valid name.";
        return "";

      case "email":
        if (!value.trim()) return "Email address is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address.";
        }
        return "";

      case "projectType":
        return value ? "" : "Please select a project type.";

      case "budgetRange":
        return value ? "" : "Please select a budget range.";

      case "timeline":
        return value ? "" : "Please select a timeline.";

      case "projectDescription":
        if (!value.trim()) return "Project description is required.";
        if (value.trim().length < 20) {
          return "Please provide at least 20 characters describing your project.";
        }
        return "";

      default:
        return "";
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleBlur = (
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);

      if (error) {
        newErrors[key as keyof FormData] = error;
      }
    });

    setErrors(newErrors);

    setTouched((prev) => ({
      ...prev,
      ...Object.fromEntries(Object.keys(newErrors).map((key) => [key, true])),
    }));

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    console.log("[QUOTE] Submit handler fired");

    e.preventDefault();

    const isValid = validateForm();

    console.log("[QUOTE] Validation result:", isValid);

    if (!isValid) {
      console.log("[QUOTE] Validation errors:", errors);
      return;
    }

    setSubmitError("");
    setSubmitting(true);

    let captchaToken = "";

    if (captchaEnabled) {
      if (!captchaReady) {
        setSubmitError(
          "Security verification is loading. Please wait and try again.",
        );
        setSubmitting(false);
        return;
      }

      try {
        captchaToken = await getToken("quote_form");
      } catch {
        setSubmitError(
          "Unable to verify reCAPTCHA. Please refresh and try again.",
        );
        setSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          botField,
          formStart: formStartRef.current,
          captchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit your request.");
      }

      setSubmitted(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <section className="border-b border-[var(--card-border)] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent-2)]">
            Let's work together
          </p>

          <h1 className="section-title mb-4">Request a Quote</h1>

          <p className="section-subtitle">
            Tell me about your project, your goals and what you would like to
            achieve. I'll prepare a tailored proposal based on your
            requirements.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          {submitted ? (
            <div className="card border-2 border-emerald-500/40 p-10 text-center">
              <div className="mb-5 text-6xl text-emerald-400">✓</div>

              <h2 className="mb-3 text-3xl font-bold text-white">Thank You!</h2>

              <p className="mb-3 text-lg font-semibold text-emerald-400">
                Your quotation request has been received.
              </p>

              <p className="mb-6 text-[var(--muted)]">
                I'll review your requirements and get back to you within 24-48
                hours.
              </p>

              {formData.projectName && (
                <p className="mb-6 text-sm text-[var(--muted)]">
                  Project: {formData.projectName}
                </p>
              )}

              <a href="/projects" className="btn-primary inline-block">
                Explore More Projects
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Honeypot */}
              <input
                type="text"
                name="botField"
                value={botField}
                onChange={(e) => setBotField(e.target.value)}
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
                className="hidden"
              />

              {captchaEnabled && captchaLoadError && (
                <div className="rounded-xl border border-yellow-500 bg-yellow-500/10 p-4 text-sm text-yellow-200">
                  Unable to initialize reCAPTCHA. Please refresh the page.
                </div>
              )}

              {submitError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500 bg-red-500/10 p-4 text-sm text-red-200"
                >
                  {submitError}
                </div>
              )}

              {/* SECTION 1: Personal Information */}
              <div className="card space-y-5 p-6 md:p-8">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-dark-blue-400)]">
                    01. Your Information
                  </h2>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Tell me how to get in touch with you.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="name">
                      Full Name *
                    </label>

                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={inputClass}
                      placeholder="Your full name"
                      autoComplete="name"
                      aria-invalid={!!errors.name}
                      required
                    />

                    {errors.name && (
                      <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="email">
                      Email Address *
                    </label>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={inputClass}
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      required
                    />

                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="company">
                      Company / Business Name
                    </label>

                    <input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Your business name"
                      autoComplete="organization"
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="phone">
                      Phone / WhatsApp Number
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="+254 7XX XXX XXX"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Project Details */}
              <div className="card space-y-5 p-6 md:p-8">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-forest-green-400)]">
                    02. Project Requirements
                  </h2>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Describe the solution you want to build.
                  </p>
                </div>

                <div>
                  <label className={labelClass} htmlFor="projectName">
                    Project of Interest
                  </label>

                  <input
                    id="projectName"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter project name, if applicable"
                    maxLength={150}
                  />

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Automatically populated when you request a quote from a
                    portfolio project.
                  </p>
                </div>

                <div>
                  <label className={labelClass} htmlFor="projectType">
                    Project Type *
                  </label>

                  <select
                    id="projectType"
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputClass}
                    required
                  >
                    <option value="">Select project type</option>

                    {projectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  {errors.projectType && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.projectType}
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass} htmlFor="projectDescription">
                    Project Description *
                  </label>

                  <textarea
                    id="projectDescription"
                    name="projectDescription"
                    value={formData.projectDescription}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={5}
                    maxLength={5000}
                    className={`${inputClass} resize-y`}
                    placeholder="Describe your project, business goals, target audience and the problem you want to solve..."
                    required
                  />

                  <div className="mt-1 flex justify-between text-xs text-[var(--muted)]">
                    <span>
                      {errors.projectDescription || "Minimum 20 characters."}
                    </span>

                    <span>{formData.projectDescription.length}/5000</span>
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="features">
                    Key Features & Requirements
                  </label>

                  <textarea
                    id="features"
                    name="features"
                    value={formData.features}
                    onChange={handleChange}
                    rows={4}
                    maxLength={5000}
                    className={`${inputClass} resize-y`}
                    placeholder="Examples: User accounts, payment integration, booking system, admin dashboard, mobile responsiveness..."
                  />
                </div>
              </div>

              {/* SECTION 3: Budget and Timeline */}
              <div className="card space-y-5 p-6 md:p-8">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-dark-blue-400)]">
                    03. Budget & Timeline
                  </h2>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Help me understand your project expectations.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="budgetRange">
                      Estimated Budget *
                    </label>

                    <select
                      id="budgetRange"
                      name="budgetRange"
                      value={formData.budgetRange}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={inputClass}
                      required
                    >
                      <option value="">Select your budget</option>

                      {budgetRanges.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>

                    {errors.budgetRange && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.budgetRange}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="timeline">
                      Expected Timeline *
                    </label>

                    <select
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={inputClass}
                      required
                    >
                      <option value="">Select your timeline</option>

                      {timelines.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>

                    {errors.timeline && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.timeline}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Information */}
              <div className="rounded-xl border border-[var(--color-dark-blue-600)] bg-[var(--color-dark-blue-900)]/20 p-5">
                <p className="text-sm leading-relaxed text-slate-300">
                  <strong className="text-[var(--color-dark-blue-400)]">
                    What happens next?
                  </strong>
                  <br />
                  I'll review your requirements and prepare a tailored quotation
                  outlining the proposed scope, deliverables, estimated timeline
                  and pricing. Submitting this request is free and carries no
                  obligation.
                </p>
              </div>

              {/* Submit */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="submit"
                  disabled={
                    submitting || (captchaEnabled && !!captchaLoadError)
                  }
                  className={`btn-primary flex-1 ${
                    submitting ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  {submitting
                    ? "Submitting Request..."
                    : "Submit Quote Request →"}
                </button>

                <a href="/contact" className="btn-secondary flex-1 text-center">
                  Contact Instead
                </a>
              </div>

              <p className="text-center text-xs text-[var(--muted)]">
                Your information will only be used to respond to your enquiry.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="section-title mb-12 text-center">Quote Process FAQ</h2>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: "How long does it take to receive a quote?",
                description:
                  "I typically provide a detailed quotation within 24-48 hours. Complex projects may require up to 3 business days.",
              },
              {
                title: "Is the quotation free?",
                description:
                  "Yes. Requesting a quotation is completely free and carries no obligation.",
              },
              {
                title: "What's included in the quotation?",
                description:
                  "Project scope, deliverables, estimated timeline, recommended technologies, pricing and support options.",
              },
              {
                title: "What happens after receiving the quote?",
                description:
                  "We can discuss the proposal, clarify requirements and agree on the next steps before development begins.",
              },
            ].map((item) => (
              <div key={item.title} className="card">
                <h3 className="mb-2 text-lg font-semibold text-[var(--color-dark-blue-400)]">
                  {item.title}
                </h3>

                <p className="text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
