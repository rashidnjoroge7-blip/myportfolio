import TestimonialsCarousel from "../../components/TestimonialsCarousel";

export default function Testimonials() {
  return (
    <div className="bg-[var(--bg)] min-h-screen">
      {/* Header */}
      <section className="py-20 px-6 border-b border-[var(--card-border)] fade-in">
        <div className="max-w-5xl mx-auto">
          <h1 className="section-title mb-4">Client Testimonials</h1>
          <p className="section-subtitle">
            What clients and collaborators have to say about working with me.
          </p>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-20 px-6 fade-in">
        <div className="max-w-5xl mx-auto">
          <TestimonialsCarousel />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-[var(--surface)] border-t border-[var(--card-border)] fade-in">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[var(--accent-3)] mb-2">50+</div>
              <p className="text-[var(--muted)]">Projects Completed</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--accent-2)] mb-2">40+</div>
              <p className="text-[var(--muted)]">Happy Clients</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--accent-3)] mb-2">8+</div>
              <p className="text-[var(--muted)]">Years Experience</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--accent-2)] mb-2">100%</div>
              <p className="text-[var(--muted)]">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 fade-in">
        <div className="max-w-4xl mx-auto rounded-2xl p-12 text-center border border-[var(--accent-2)] bg-[var(--surface)] shadow-xl shadow-[rgba(22,163,74,0.10)]">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-4">Ready to Join Them?</h2>
          <p className="text-[var(--muted)] mb-8">Let's create something amazing together</p>
          <a href="/contact" className="btn-secondary">
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
}
