"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import TurnstileWidget from "../../components/TurnstileWidget";
import {
  calculateProjectEstimate,
  type EstimatorSelections,
  type ProjectCategory,
  type ProjectSize,
  type DesignLevel,
  type EstimatorFeature,
  type EstimatorService,
} from "../../lib/projectEstimator";

const categories: {
  value: ProjectCategory;
  label: string;
  description: string;
  price: string;
}[] = [
  { value: "landing", label: "Landing Page", description: "A focused page for a product, service or campaign.", price: "KES 15,000 – 25,000" },
  { value: "business", label: "Business Website", description: "A professional website for a growing business.", price: "KES 35,000 – 50,000" },
  { value: "corporate", label: "Corporate Website", description: "A comprehensive business website with multiple sections.", price: "KES 60,000 – 85,000" },
  { value: "ecommerce", label: "E-commerce", description: "An online store with product and shopping functionality.", price: "KES 75,000 – 120,000" },
  { value: "webapp", label: "Custom Web Application", description: "A tailored digital platform with application functionality.", price: "KES 100,000 – 180,000" },
];

const sizes: {
  value: ProjectSize;
  label: string;
  description: string;
}[] = [
  { value: "small", label: "Small", description: "A simple project with a focused set of pages and features." },
  { value: "medium", label: "Medium", description: "Several pages and a moderate level of functionality." },
  { value: "large", label: "Large", description: "More extensive content, workflows and functionality." },
  { value: "enterprise", label: "Enterprise", description: "Complex requirements, advanced workflows or multiple systems." },
];

const designs: {
  value: DesignLevel;
  label: string;
  description: string;
}[] = [
  { value: "standard", label: "Standard", description: "Clean, professional design using established patterns." },
  { value: "custom", label: "Custom", description: "A tailored visual identity and custom page layouts." },
  { value: "premium", label: "Premium", description: "Advanced visual design, interactions and polished experiences." },
];

const features: {
  value: EstimatorFeature;
  label: string;
  description: string;
}[] = [
  { value: "booking", label: "Booking system", description: "Appointments, reservations or service scheduling." },
  { value: "payments", label: "Online payments", description: "Payment gateway and checkout integration." },
  { value: "accounts", label: "User accounts", description: "Registration, login and user profiles." },
  { value: "dashboard", label: "Admin dashboard", description: "Management tools and reporting interfaces." },
  { value: "integrations", label: "Third-party integrations", description: "Connect external services and APIs." },
  { value: "cms", label: "Content management", description: "Manage website content without editing code." },
  { value: "seo", label: "SEO setup", description: "Technical SEO and search visibility foundations." },
];

const services: {
  value: EstimatorService;
  label: string;
  description: string;
}[] = [
  { value: "hosting", label: "Hosting provision", description: "Estimated hosting provision and initial setup." },
  { value: "maintenance", label: "Maintenance", description: "Estimated maintenance and ongoing support provision." },
];

const timelines = [
  "ASAP (Less than 1 month)",
  "1–3 months",
  "3–6 months",
  "6+ months",
  "Flexible",
];

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-400 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";

const labelClass = "mb-2 block text-sm font-semibold text-white";

const initialSelections: EstimatorSelections = {
  category: "business",
  size: "small",
  design: "standard",
  features: [],
  services: [],
};

const initialContact = {
  name: "",
  email: "",
  company: "",
  phone: "",
  projectName: "",
  projectDescription: "",
  timeline: "",
};

function formatKES(amount: number) {
  return `KES ${new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export default function ProjectEstimatorPage() {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState<EstimatorSelections>(initialSelections);
  const [contact, setContact] = useState(initialContact);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [botField, setBotField] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const formStartRef = useRef(0);

  useEffect(() => {
    formStartRef.current = Date.now();
  }, []);

  const estimate = calculateProjectEstimate(selections);
  const selectedCategory = categories.find((item) => item.value === selections.category);

  const updateContact = (field: keyof typeof initialContact, value: string) => {
    setContact((previous) => ({ ...previous, [field]: value }));
    setFormErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const toggleFeature = (value: EstimatorFeature) => {
    setSelections((previous) => ({
      ...previous,
      features: previous.features.includes(value)
        ? previous.features.filter((item) => item !== value)
        : [...previous.features, value],
    }));
  };

  const toggleService = (value: EstimatorService) => {
    setSelections((previous) => ({
      ...previous,
      services: previous.services.includes(value)
        ? previous.services.filter((item) => item !== value)
        : [...previous.services, value],
    }));
  };

  const validateContact = () => {
    const errors: Record<string, string> = {};

    if (contact.name.trim().length < 2) {
      errors.name = "Please enter your full name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!contact.timeline) {
      errors.timeline = "Please select your expected timeline.";
    }

    if (
      contact.projectDescription.trim() &&
      contact.projectDescription.trim().length < 20
    ) {
      errors.projectDescription = "Please enter at least 20 characters or leave this field blank.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    setSubmitError("");

    if (step === 4 && !contact.timeline) {
      setFormErrors((previous) => ({
        ...previous,
        timeline: "Please select your expected timeline.",
      }));
      return;
    }

    if (step < 5) {
      setStep((previous) => previous + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const previousStep = () => {
    setSubmitError("");
    setStep((previous) => Math.max(1, previous - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateContact()) return;

    if (!turnstileToken) {
      setSubmitError("Please complete the security verification.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const description =
      contact.projectDescription.trim() ||
      `Project estimate request for a ${selectedCategory?.label}. Project size: ${selections.size}. Design level: ${selections.design}. Selected features: ${selections.features.join(", ") || "None"}. Additional services: ${selections.services.join(", ") || "None"}.`;

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name,
          email: contact.email,
          company: contact.company,
          phone: contact.phone,
          projectName: contact.projectName,
          projectType: selectedCategory?.label || "Website Development",
          projectDescription: description,
          budgetRange: `${formatKES(estimate.minimum)} - ${formatKES(estimate.maximum)}`,
          timeline: contact.timeline,
          features: [
            ...selections.features,
            ...selections.services,
          ].join(", "),
          estimator: selections,
          submissionSource: "project_estimator",
          botField,
          formStart: formStartRef.current,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit your estimate request.");
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setTurnstileToken("");
      setResetSignal((previous) => previous + 1);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const optionCard = (
    selected: boolean,
    title: string,
    description: string,
    onClick: () => void,
    extra?: string,
  ) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-xl border p-5 text-left transition ${
        selected
          ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]"
          : "border-[var(--card-border)] bg-[var(--surface)] hover:border-[var(--accent)]/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold text-[var(--text)]">{title}</span>
        <span
          className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${
            selected
              ? "border-[var(--accent)] bg-[var(--accent)]"
              : "border-slate-500"
          }`}
        />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{description}</p>
      {extra && (
        <p className="mt-3 text-sm font-semibold text-[var(--accent-2)]">{extra}</p>
      )}
    </button>
  );

  if (submitted) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-6 py-24">
        <div className="card mx-auto max-w-2xl p-10 text-center">
          <div className="mb-5 text-5xl text-emerald-400">✓</div>
          <h1 className="mb-4 text-3xl font-bold text-[var(--text)]">
            Estimate request received
          </h1>
          <p className="mb-4 text-[var(--muted)]">
            Thank you. Your project requirements and indicative estimate have been submitted successfully.
          </p>
          <p className="mb-8 text-lg font-semibold text-[var(--accent-2)]">
            {formatKES(estimate.minimum)} – {formatKES(estimate.maximum)}
          </p>
          <p className="mb-8 text-sm text-[var(--muted)]">
            I&apos;ll review the scope and contact you to discuss the requirements and prepare a formal quotation.
          </p>
          <Link href="/" className="btn-primary inline-block">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <section className="border-b border-[var(--card-border)] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--accent-2)]">
            Plan your next digital project
          </p>
          <h1 className="section-title mb-4">Project Cost Estimator</h1>
          <p className="section-subtitle max-w-3xl">
            Configure your project requirements and receive an indicative development cost in Kenyan shillings.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[var(--text)]">Step {step} of 5</span>
              <span className="text-[var(--muted)]">{step * 20}% complete</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-slate-700"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={5}
              aria-valuenow={step}
            >
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${step * 20}%` }}
              />
            </div>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
            <div className="card p-6 md:p-8">
              {step === 1 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-[var(--accent-2)]">STEP 01</p>
                  <h2 className="mb-2 text-2xl font-bold text-[var(--text)]">What would you like to build?</h2>
                  <p className="mb-7 text-sm text-[var(--muted)]">Choose the project category that best describes your idea.</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {categories.map((item) => (
                      <div key={item.value}>
                        {optionCard(
                          selections.category === item.value,
                          item.label,
                          item.description,
                          () => setSelections((previous) => ({ ...previous, category: item.value })),
                          item.price,
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-[var(--accent-2)]">STEP 02</p>
                  <h2 className="mb-2 text-2xl font-bold text-[var(--text)]">Define your project scope</h2>
                  <p className="mb-7 text-sm text-[var(--muted)]">Select the approximate size and complexity of your project.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sizes.map((item) => (
                      <div key={item.value}>
                        {optionCard(
                          selections.size === item.value,
                          item.label,
                          item.description,
                          () => setSelections((previous) => ({ ...previous, size: item.value })),
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-[var(--accent-2)]">STEP 03</p>
                  <h2 className="mb-2 text-2xl font-bold text-[var(--text)]">Design and functionality</h2>
                  <p className="mb-6 text-sm text-[var(--muted)]">Choose a design approach and the features you need.</p>

                  <h3 className="mb-4 font-semibold text-[var(--text)]">Design level</h3>
                  <div className="mb-8 grid gap-4 md:grid-cols-3">
                    {designs.map((item) => (
                      <div key={item.value}>
                        {optionCard(
                          selections.design === item.value,
                          item.label,
                          item.description,
                          () => setSelections((previous) => ({ ...previous, design: item.value })),
                        )}
                      </div>
                    ))}
                  </div>

                  <h3 className="mb-2 font-semibold text-[var(--text)]">Additional features</h3>
                  <p className="mb-4 text-xs text-[var(--muted)]">Select all that apply.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {features.map((item) => {
                      const selected = selections.features.includes(item.value);
                      return (
                        <button
                          type="button"
                          key={item.value}
                          aria-pressed={selected}
                          onClick={() => toggleFeature(item.value)}
                          className={`rounded-xl border p-4 text-left transition ${
                            selected
                              ? "border-[var(--accent)] bg-[var(--accent)]/10"
                              : "border-[var(--card-border)] hover:border-[var(--accent)]/60"
                          }`}
                        >
                          <span className="flex items-center gap-2 font-semibold text-[var(--text)]">
                            <span>{selected ? "☑" : "□"}</span>
                            {item.label}
                          </span>
                          <span className="mt-2 block text-xs text-[var(--muted)]">{item.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-[var(--accent-2)]">STEP 04</p>
                  <h2 className="mb-2 text-2xl font-bold text-[var(--text)]">Services and delivery</h2>
                  <p className="mb-7 text-sm text-[var(--muted)]">Choose any additional services and your preferred delivery timeline.</p>

                  <h3 className="mb-4 font-semibold text-[var(--text)]">Additional services</h3>
                  <div className="mb-8 grid gap-4 sm:grid-cols-2">
                    {services.map((item) => {
                      const selected = selections.services.includes(item.value);
                      return (
                        <button
                          type="button"
                          key={item.value}
                          aria-pressed={selected}
                          onClick={() => toggleService(item.value)}
                          className={`rounded-xl border p-5 text-left transition ${
                            selected
                              ? "border-[var(--accent)] bg-[var(--accent)]/10"
                              : "border-[var(--card-border)] hover:border-[var(--accent)]/60"
                          }`}
                        >
                          <span className="font-semibold text-[var(--text)]">
                            {selected ? "☑ " : "□ "}{item.label}
                          </span>
                          <span className="mt-2 block text-sm text-[var(--muted)]">{item.description}</span>
                        </button>
                      );
                    })}
                  </div>

                  <label className={labelClass} htmlFor="timeline">Preferred delivery timeline *</label>
                  <select
                    id="timeline"
                    value={contact.timeline}
                    onChange={(event) => updateContact("timeline", event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select your timeline</option>
                    {timelines.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  {formErrors.timeline && <p className="mt-2 text-sm text-red-400">{formErrors.timeline}</p>}

                  <p className="mt-5 text-xs leading-relaxed text-[var(--muted)]">
                    Hosting and maintenance figures are indicative provisions. Recurring service periods and final costs will be confirmed in your formal proposal.
                  </p>
                </div>
              )}

              {step === 5 && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-[var(--accent-2)]">STEP 05</p>
                    <h2 className="mb-2 text-2xl font-bold text-[var(--text)]">Your estimate and contact details</h2>
                    <p className="text-sm text-[var(--muted)]">Review your estimate and provide your contact details to receive a tailored quotation.</p>
                  </div>

                  <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-5">
                    <p className="text-sm text-[var(--muted)]">Your indicative project estimate</p>
                    <p className="mt-2 text-2xl font-bold text-[var(--text)]">
                      {formatKES(estimate.minimum)} – {formatKES(estimate.maximum)}
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      This is an initial planning estimate, not a formal quotation.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="name">Full name *</label>
                      <input id="name" autoComplete="name" value={contact.name} onChange={(event) => updateContact("name", event.target.value)} className={inputClass} placeholder="Your full name" required />
                      {formErrors.name && <p className="mt-1 text-sm text-red-400">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="email">Email address *</label>
                      <input id="email" type="email" autoComplete="email" value={contact.email} onChange={(event) => updateContact("email", event.target.value)} className={inputClass} placeholder="you@example.com" required />
                      {formErrors.email && <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="company">Company / business</label>
                      <input id="company" autoComplete="organization" value={contact.company} onChange={(event) => updateContact("company", event.target.value)} className={inputClass} placeholder="Business name" />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="phone">Phone / WhatsApp</label>
                      <input id="phone" type="tel" autoComplete="tel" value={contact.phone} onChange={(event) => updateContact("phone", event.target.value)} className={inputClass} placeholder="+254 7XX XXX XXX" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="projectName">Project name (optional)</label>
                    <input id="projectName" value={contact.projectName} onChange={(event) => updateContact("projectName", event.target.value)} className={inputClass} placeholder="Name of your project" maxLength={150} />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="projectDescription">Tell us more about your project (optional)</label>
                    <textarea
                      id="projectDescription"
                      value={contact.projectDescription}
                      onChange={(event) => updateContact("projectDescription", event.target.value)}
                      className={`${inputClass} resize-y`}
                      rows={4}
                      maxLength={5000}
                      placeholder="Describe your goals, target users or any special requirements..."
                    />
                    {formErrors.projectDescription && <p className="mt-1 text-sm text-red-400">{formErrors.projectDescription}</p>}
                  </div>

                  <input
                    type="text"
                    name="botField"
                    value={botField}
                    onChange={(event) => setBotField(event.target.value)}
                    autoComplete="off"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="hidden"
                  />

                  <div className="space-y-2">
                    <TurnstileWidget
                      action="quote_form"
                      resetSignal={resetSignal}
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
                        Security verification could not initialize. Please refresh and try again.
                      </p>
                    )}
                  </div>

                  {submitError && (
                    <div role="alert" className="rounded-xl border border-red-500 bg-red-500/10 p-4 text-sm text-red-200">
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || turnstileError || !turnstileToken}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Submitting estimate..." : "Submit Estimate Request"}
                  </button>

                  <p className="text-center text-xs text-[var(--muted)]">
                    Your details will only be used to respond to your enquiry.
                  </p>
                </form>
              )}

              {step !== 5 && (
                <div className="mt-8 flex justify-between gap-4 border-t border-[var(--card-border)] pt-6">
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={step === 1}
                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Back
                  </button>
                  <button type="button" onClick={nextStep} className="btn-primary">
                    Continue
                  </button>
                </div>
              )}

              {step === 5 && (
                <div className="mt-5 border-t border-[var(--card-border)] pt-5">
                  <button type="button" onClick={previousStep} className="btn-secondary w-full">
                    Back to edit selections
                  </button>
                </div>
              )}
            </div>

            <aside className="card p-6 lg:sticky lg:top-24">
              <h3 className="mb-4 text-lg font-bold text-[var(--text)]">Project summary</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-[var(--muted)]">Project type</p>
                  <p className="mt-1 font-semibold text-[var(--text)]">{selectedCategory?.label}</p>
                </div>
                <div>
                  <p className="text-[var(--muted)]">Project size</p>
                  <p className="mt-1 font-semibold capitalize text-[var(--text)]">{selections.size}</p>
                </div>
                <div>
                  <p className="text-[var(--muted)]">Design level</p>
                  <p className="mt-1 font-semibold capitalize text-[var(--text)]">{selections.design}</p>
                </div>
                <div>
                  <p className="text-[var(--muted)]">Additional features</p>
                  <p className="mt-1 text-[var(--text)]">{selections.features.length} selected</p>
                </div>
                <div>
                  <p className="text-[var(--muted)]">Additional services</p>
                  <p className="mt-1 text-[var(--text)]">{selections.services.length} selected</p>
                </div>
                <div className="border-t border-[var(--card-border)] pt-4">
                  <p className="text-[var(--muted)]">Indicative estimate</p>
                  <p className="mt-2 text-xl font-bold text-[var(--accent-2)]">
                    {formatKES(estimate.minimum)} – {formatKES(estimate.maximum)}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-[var(--muted)]">
                Final pricing depends on detailed requirements, technical scope and the agreed deliverables.
              </p>
            </aside>
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-[var(--muted)]">
              Prefer to discuss your project directly?{" "}
              <Link href="/contact" className="font-semibold text-[var(--accent-2)] hover:underline">
                Contact us
              </Link>
              {" "}or{" "}
              <Link href="/quote" className="font-semibold text-[var(--accent-2)] hover:underline">
                request a detailed quote
              </Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
