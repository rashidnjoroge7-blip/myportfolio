'use client';

import { useRef, useState } from 'react';
import { useRecaptcha } from '../../lib/useRecaptcha';

type FormErrors = {
  name?: string;
  email?: string;
  projectType?: string;
  budgetRange?: string;
  timeline?: string;
  projectDescription?: string;
};

export default function RequestQuote() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    projectType: '',
    projectDescription: '',
    budgetRange: '',
    timeline: '',
    features: '',
    phone: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [botField, setBotField] = useState('');
  const formStartRef = useRef(Date.now());
  const { enabled: captchaEnabled, ready: captchaReady, loadError: captchaLoadError, getToken } = useRecaptcha();

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Please enter a valid name';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
      case 'projectType':
        if (!value.trim()) return 'Project type is required';
        return '';
      case 'budgetRange':
        if (!value.trim()) return 'Budget range is required';
        return '';
      case 'timeline':
        if (!value.trim()) return 'Timeline is required';
        return '';
      case 'projectDescription':
        if (!value.trim()) return 'Project description is required';
        if (value.trim().length < 20) return 'Please share more details about the project';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        newErrors[key as keyof FormErrors] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitError('');
    setSubmitting(true);

    let captchaToken = '';
    if (captchaEnabled) {
      if (!captchaReady) {
        setSubmitError('reCAPTCHA is still loading. Please wait a moment and try again.');
        setSubmitting(false);
        return;
      }

      try {
        captchaToken = await getToken('quote_form');
      } catch (error) {
        setSubmitError('Unable to verify reCAPTCHA. Please refresh the page and try again.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        throw new Error(data?.error || 'Unable to submit quote request.');
      }

      setSubmitted(true);

      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          company: '',
          projectType: '',
          projectDescription: '',
          budgetRange: '',
          timeline: '',
          features: '',
          phone: '',
        });
        setErrors({});
        setTouched({});
        setBotField('');
        setSubmitted(false);
        setSubmitError('');
      }, 5000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit quote request.');
    } finally {
      setSubmitting(false);
    }
  };

  const projectTypes = [
    'Web Application',
    'Mobile App',
    'E-Commerce Site',
    'SaaS Product',
    'Dashboard/Analytics',
    'Landing Page',
    'API Development',
    'Other',
  ];

  const budgetRanges = [
    '$5,000 - $10,000',
    '$10,000 - $25,000',
    '$25,000 - $50,000',
    '$50,000 - $100,000',
    '$100,000+',
    'Not sure',
  ];

  const timelines = [
    'ASAP (Less than 1 month)',
    '1-3 months',
    '3-6 months',
    '6+ months',
    'Flexible',
  ];

  return (
    <div className="bg-[var(--bg)] min-h-screen">
      {/* Header */}
      <section className="py-20 px-6 border-b border-[var(--card-border)] fade-in">
        <div className="max-w-5xl mx-auto">
          <h1 className="section-title mb-4">Request a Quote</h1>
          <p className="section-subtitle">
            Tell us about your project and get a custom quote for your needs.
          </p>
        </div>
      </section>

      {/* Quote Form */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {submitted ? (
            <div className="card border-[var(--color-forest-green-600)] border-2 bg-[var(--color-forest-green-900)]/20">
              <div className="text-6xl mb-4 text-center">✓</div>
              <h2 className="text-2xl font-bold text-center text-white mb-2">Thank You!</h2>
              <p className="text-center text-[var(--color-forest-green-400)] font-semibold mb-4">
                Your quote request has been received successfully.
              </p>
              <p className="text-center text-slate-300">
                I'll review your project details and get back to you within 24-48 hours with a personalized quote.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="text"
                name="botField"
                value={botField}
                onChange={(e) => setBotField(e.target.value)}
                autoComplete="off"
                className="hidden"
                tabIndex={-1}
              />
              {captchaEnabled && captchaLoadError ? (
                <div className="rounded-xl border border-yellow-500 bg-yellow-500/10 p-4 text-sm text-yellow-200">
                  Unable to initialize reCAPTCHA. Please refresh the page and try again.
                </div>
              ) : null}
              {submitError ? (
                <div className="rounded-xl border border-red-500 bg-red-500/10 p-4 text-sm text-red-200">
                  {submitError}
                </div>
              ) : null}
              {/* Personal Information */}
              <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
                <h2 className="text-xl font-bold text-[var(--color-dark-blue-400)] mb-4">Personal Information</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20 transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Company Name</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20 transition-all"
                      placeholder="Your Company"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20 transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
                <h2 className="text-xl font-bold text-[var(--color-forest-green-400)] mb-4">Project Details</h2>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Project Type *</label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20 transition-all"
                    >
                      <option value="">Select a project type</option>
                      {projectTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Budget Range *</label>
                    <select
                      name="budgetRange"
                      value={formData.budgetRange}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20 transition-all"
                    >
                      <option value="">Select a budget range</option>
                      {budgetRanges.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-2">Timeline *</label>
                    <select
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20 transition-all"
                    >
                      <option value="">Select a timeline</option>
                      {timelines.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">Project Description *</label>
                  <textarea
                    name="projectDescription"
                    value={formData.projectDescription}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20 transition-all resize-none"
                    placeholder="Tell us about your project. What problem does it solve? What are your main goals?"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-2">Key Features & Requirements</label>
                  <textarea
                    name="features"
                    value={formData.features}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20 transition-all resize-none"
                    placeholder="List the main features and requirements (e.g., user authentication, payment processing, real-time updates, etc.)"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-[var(--color-dark-blue-900)]/20 border border-[var(--color-dark-blue-600)] rounded-lg p-4">
                <p className="text-slate-300 text-sm">
                  <span className="font-semibold text-[var(--color-dark-blue-400)]">Note:</span> Based on your project details, you'll receive a detailed quote including project scope, timeline, deliverables, and pricing.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`btn-primary flex-1 ${submitting ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  {submitting ? 'Sending...' : 'Request Quote'}
                </button>
                <a href="/contact" className="btn-secondary flex-1 text-center">
                  Contact Instead
                </a>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-center mb-12">Quote Process FAQ</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-[var(--color-dark-blue-400)] mb-2">📋 How long does it take to receive a quote?</h3>
              <p className="text-slate-300">
                I typically provide a detailed quote within 24-48 hours of receiving your request. For complex projects, it may take up to 3 business days.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-[var(--color-forest-green-400)] mb-2">💰 Is the quote free?</h3>
              <p className="text-slate-300">
                Yes! Quote requests are completely free. There's no obligation, and you can use the quote to compare with other developers.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-[var(--color-dark-blue-400)] mb-2">🔧 What's included in the quote?</h3>
              <p className="text-slate-300">
                Detailed project breakdown, timeline, deliverables, tech stack recommendations, payment terms, and support options.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-[var(--color-forest-green-400)] mb-2">🤝 What's the next step?</h3>
              <p className="text-slate-300">
                After you receive the quote, we can schedule a call to discuss details, answer questions, and move forward if interested.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
