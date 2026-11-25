import TestimonialsCarousel from "../../components/TestimonialsCarousel";

export default function Testimonials() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <section className="fade-in border-b border-[var(--card-border)] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="section-title mb-4">Client Testimonials</h1>
          <p className="section-subtitle">
            What clients and collaborators have to say about working with me.
          </p>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="fade-in px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <TestimonialsCarousel />
        </div>
      </section>

      {/* Stats Section */}
      <section className="fade-in border-t border-[var(--card-border)] bg-[var(--surface)] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 text-center md:grid-cols-4">
            <div>
              <div className="mb-2 text-4xl font-bold text-[var(--accent-3)]">
                50+
              </div>
              <p className="text-[var(--muted)]">Projects Completed</p>
            </div>

            <div>
              <div className="mb-2 text-4xl font-bold text-[var(--accent-2)]">
                40+
              </div>
              <p className="text-[var(--muted)]">Happy Clients</p>
            </div>

            <div>
              <div className="mb-2 text-4xl font-bold text-[var(--accent-3)]">
                8+
              </div>
              <p className="text-[var(--muted)]">Years Experience</p>
            </div>

            <div>
              <div className="mb-2 text-4xl font-bold text-[var(--accent-2)]">
                100%
              </div>
              <p className="text-[var(--muted)]">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="fade-in px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--accent-2)] bg-[var(--surface)] p-12 text-center shadow-xl shadow-[rgba(22,163,74,0.10)]">
          <h2 className="mb-4 text-3xl font-bold text-[var(--text)]">
            Ready to Join Them?
          </h2>

          <p className="mb-8 text-[var(--muted)]">
            Let&apos;s create something amazing together.
          </p>

          <a href="/contact" className="btn-secondary">
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
}
