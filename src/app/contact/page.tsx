'use client';

import { useRef, useState } from 'react';
import { siteConfig } from '../../lib/siteConfig';
import { useRecaptcha } from '../../lib/useRecaptcha';

type FormErrors = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [botField, setBotField] = useState('');
  const formStartRef = useRef(Date.now());
  const { enabled: captchaEnabled, ready: captchaReady, loadError: captchaLoadError, getToken } = useRecaptcha();

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
        return '';
      case 'subject':
        if (!value.trim()) return 'Subject is required';
        if (value.trim().length < 3) return 'Subject must be at least 3 characters';
        return '';
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 10) return 'Message must be at least 10 characters';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key as keyof FormErrors] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    let captchaToken = '';
    if (captchaEnabled) {
      if (!captchaReady) {
        setSubmitError('reCAPTCHA is still loading. Please wait a moment and try again.');
        setSubmitting(false);
        return;
      }

      try {
        captchaToken = await getToken('contact_form');
      } catch (error) {
        setSubmitError('Unable to verify reCAPTCHA. Please refresh the page and try again.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/contact', {
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
        throw new Error(data?.error || 'Unable to submit message.');
      }

      setSubmitted(true);
      setSuccessMessage('Thank you for your message! I\'ll get back to you soon.');

      setTimeout(() => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        setErrors({});
        setTouched({});
        setBotField('');
        setSubmitted(false);
        setSuccessMessage('');
      }, 4000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to submit message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen">
      {/* Header */}
      <section className="py-20 px-6 border-b border-[var(--card-border)] fade-in">
        <div className="max-w-5xl mx-auto">
          <h1 className="section-title mb-4">Get In Touch</h1>
          <p className="section-subtitle">
            Have a project in mind? I'd love to hear from you. Let's discuss how I can help.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-dark-blue-400)] mb-8 stagger-1">Contact Information</h2>
              
              <div className="space-y-8">
                <div className="card stagger-1">
                  <div className="text-3xl mb-3">📧</div>
                  <h3 className="font-semibold text-[var(--color-forest-green-400)] mb-2">Email</h3>
                  <a href={`mailto:${siteConfig.email}`} className="text-slate-300 hover:text-[var(--color-dark-blue-400)] transition-colors">
                    {siteConfig.email}
                  </a>
                </div>

                <div className="card stagger-2">
                  <div className="text-3xl mb-3">�</div>
                  <h3 className="font-semibold text-[var(--color-forest-green-400)] mb-2">Phone</h3>
                  <a href={`tel:${siteConfig.phone}`} className="text-slate-300 hover:text-[var(--color-dark-blue-400)] transition-colors">
                    {siteConfig.phone}
                  </a>
                </div>

                <div className="card">
                  <div className="text-3xl mb-3">�💼</div>
                  <h3 className="font-semibold text-[var(--color-forest-green-400)] mb-2">LinkedIn</h3>
                  <a href={siteConfig.linkedin} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-[var(--color-dark-blue-400)] transition-colors">
                    {siteConfig.linkedin.replace('https://', '')}
                  </a>
                </div>

                <div className="card">
                  <div className="text-3xl mb-3">🐙</div>
                  <h3 className="font-semibold text-[var(--color-forest-green-400)] mb-2">GitHub</h3>
                  <a href={siteConfig.github} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-[var(--color-dark-blue-400)] transition-colors">
                    {siteConfig.github.replace('https://', '')}
                  </a>
                </div>

                <div className="card stagger-4">
                  <div className="text-3xl mb-3">🌐</div>
                  <h3 className="font-semibold text-[var(--color-forest-green-400)] mb-2">Location</h3>
                  <p className="text-slate-300">{siteConfig.location}</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-dark-blue-400)] mb-8 stagger-2">Send Me a Message</h2>
              
              {submitted ? (
                <div className="card border-[var(--color-forest-green-600)] border-2 bg-[var(--color-forest-green-900)]/20 scale-fade-in">
                  <div className="text-5xl mb-4 text-center">✓</div>
                  <p className="text-center text-[var(--color-forest-green-400)] font-semibold">
                    {successMessage}
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
                  <div className="stagger-1">
                    <label className="block text-slate-300 font-medium mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-slate-100 focus:outline-none transition-all ${
                        touched.name && errors.name
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-700 focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20'
                      }`}
                      placeholder="Your Name"
                    />
                    {touched.name && errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="stagger-2">
                    <label className="block text-slate-300 font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-slate-100 focus:outline-none transition-all ${
                        touched.email && errors.email
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-700 focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20'
                      }`}
                      placeholder="your@email.com"
                    />
                    {touched.email && errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="stagger-3">
                    <label className="block text-slate-300 font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-slate-100 focus:outline-none transition-all ${
                        touched.subject && errors.subject
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-700 focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20'
                      }`}
                      placeholder="Project subject"
                    />
                    {touched.subject && errors.subject && (
                      <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
                    )}
                  </div>

                  <div className="stagger-4">
                    <label className="block text-slate-300 font-medium mb-2">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows={6}
                      className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-slate-100 focus:outline-none transition-all resize-none ${
                        touched.message && errors.message
                          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                          : 'border-slate-700 focus:border-[var(--color-dark-blue-600)] focus:ring-2 focus:ring-[var(--color-dark-blue-600)]/20'
                      }`}
                      placeholder="Tell me about your project..."
                    />
                    {touched.message && errors.message && (
                      <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full btn-primary stagger-5 hover:shadow-lg hover:shadow-[var(--accent)]/30 transition-all ${submitting ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Social Links Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800 fade-in">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-8 stagger-1">Connect With Me</h2>
          <div className="flex justify-center gap-6 flex-wrap">
            <a href={siteConfig.facebook} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[var(--color-dark-blue-600)] hover:bg-[var(--color-dark-blue-700)] rounded-full flex items-center justify-center transition-colors stagger-1 hover:scale-110 hover:shadow-lg hover:shadow-[var(--accent)]/40 transform duration-300">
              <span className="text-white">f</span>
            </a>
            <a href={siteConfig.twitter} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[var(--color-dark-blue-600)] hover:bg-[var(--color-dark-blue-700)] rounded-full flex items-center justify-center transition-colors stagger-2 hover:scale-110 hover:shadow-lg hover:shadow-[var(--accent)]/40 transform duration-300">
              <span className="text-white">𝕏</span>
            </a>
            <a href={siteConfig.linkedin} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[var(--color-forest-green-600)] hover:bg-[var(--color-forest-green-700)] rounded-full flex items-center justify-center transition-colors stagger-3 hover:scale-110 hover:shadow-lg hover:shadow-[var(--accent-2)]/40 transform duration-300">
              <span className="text-white">in</span>
            </a>
            <a href={siteConfig.github} target="_blank" rel="noreferrer" className="w-12 h-12 bg-[var(--color-dark-blue-600)] hover:bg-[var(--color-dark-blue-700)] rounded-full flex items-center justify-center transition-colors stagger-4 hover:scale-110 hover:shadow-lg hover:shadow-[var(--accent)]/40 transform duration-300">
              <span className="text-white">⚙</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
