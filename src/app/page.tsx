import Link from "next/link";
import { siteConfig } from "../lib/siteConfig";
import { TECHS } from "../lib/techData";

export default function Home() {
  const trustedBrands = [
    "Acme",
    "Nimbus",
    "Pulse",
    "Orbit",
    "Astra",
    "Vivid",
  ];

  return (
    <div className="bg-[var(--bg)]">
      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex items-center justify-center px-6 py-20 fade-in">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="stagger-1">
              <div className="inline-block px-4 py-2 bg-[var(--surface)] border border-[var(--card-border)] rounded-full mb-6">
                <p className="text-sm text-[var(--accent-2)]">Welcome to UniHost Technologies</p>
              </div>
              <h1 className="section-title mb-6 text-5xl md:text-6xl">
                Hi, I'm {siteConfig.name}
              </h1>
              <p className="text-xl text-[var(--muted)] mb-8">
                {siteConfig.tagline} Let's build something extraordinary together.
              </p>
              <div className="flex gap-4 flex-wrap stagger-2">
                <Link href="/projects" className="btn-primary px-8 py-3 text-lg hover:shadow-lg hover:shadow-[var(--accent)]/30 transition-all">
                  View My Work
                </Link>
                <Link href="/contact" className="btn-outline px-8 py-3 text-lg hover:shadow-lg hover:shadow-[var(--accent)]/20 transition-all">
                  Get In Touch
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-16 stagger-3">
                <div>
                  <p className="text-3xl font-bold text-[var(--accent-3)]">50+</p>
                  <p className="text-sm text-[var(--muted)]">Projects Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--accent-2)]">100+</p>
                  <p className="text-sm text-[var(--muted)]">Happy Clients</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[var(--accent-3)]">5+</p>
                  <p className="text-sm text-[var(--muted)]">Years Experience</p>
                </div>
              </div>
            </div>

            {/* Right - Laptop Image/Illustration */}
            <div className="stagger-2 hidden md:flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Laptop Frame */}
                <div className="bg-[var(--surface)] rounded-xl p-8 border-2 border-[var(--card-border)] shadow-2xl shadow-[var(--accent)]/20 hover:shadow-[var(--accent)]/40 transition-all duration-300">
                  {/* Screen */}
                  <div className="bg-gradient-to-br from-[var(--accent-3)] to-[var(--accent-2)] rounded-lg p-1 mb-4">
                    <div className="bg-[var(--surface)] rounded-lg p-12 flex items-center justify-center min-h-48">
                      <div className="text-center">
                        <div className="text-6xl mb-4">💻</div>
                        <p className="text-[var(--accent-3)] font-semibold">Your Project Here</p>
                      </div>
                    </div>
                  </div>
                  {/* Laptop Bottom */}
                  <div className="h-3 bg-[var(--surface-alt)] rounded-b-lg border-t border-[var(--card-border)]"></div>
                  {/* Laptop Stand */}
                  <div className="flex justify-center mt-4">
                    <div className="w-2/3 h-2 bg-[var(--card-border)] rounded-full"></div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 bg-[var(--accent-2)] rounded-lg p-4 shadow-lg animate-pulse">
                  <p className="text-sm font-semibold text-white">✨ Modern Design</p>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-[var(--accent)] rounded-lg p-4 shadow-lg animate-pulse" style={{animationDelay: '0.5s'}}>
                  <p className="text-sm font-semibold text-white">⚡ Performance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-6 fade-in">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <div className="card hover-card stagger-1">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-semibold text-[var(--accent-3)] mb-2">Web Development</h3>
              <p className="text-[var(--muted)]">Creating responsive, performant web applications</p>
            </div>
            <div className="card hover-card stagger-2">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-[var(--accent-2)] mb-2">UI/UX Design</h3>
              <p className="text-[var(--muted)]">Designing intuitive and beautiful user interfaces</p>
            </div>
            <div className="card hover-card stagger-3">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-[var(--accent-3)] mb-2">Performance</h3>
              <p className="text-[var(--muted)]">Optimized solutions for maximum efficiency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech-stack" className="py-20 px-6 bg-[var(--surface)] fade-in">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title text-center mb-12">Tech Stack</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {TECHS.map((tech, index) => {
              const staggerClass = `stagger-${(index % 5) + 1}`;
              return (
                <Link
                  key={tech.slug}
                  href={`/tech/${tech.slug}`}
                  className={`card text-center hover-card ${staggerClass} block`}
                >
                  <div className="text-3xl mb-2">{tech.icon ?? "🔧"}</div>
                  <p className="font-semibold text-[var(--accent-3)]">{tech.name}</p>
                  {tech.summary && <p className="text-sm text-[var(--muted)] mt-2">{tech.summary}</p>}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="trusted-by" className="py-20 px-6 fade-in">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)] mb-4">Trusted by teams at</p>
          <h2 className="section-title mb-8">Trusted by fast-growing startups</h2>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-items-center">
            {trustedBrands.map((brand) => (
              <div key={brand} className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface)] px-6 py-4 text-sm text-[var(--muted)] shadow-sm hover:border-[var(--accent)] hover:shadow-[var(--accent)]/10 transition">
                <span className="font-semibold text-[var(--text)]">{brand}</span>
              </div>
            ))}
          </div>
          <p className="mt-10 text-[var(--muted)] max-w-2xl mx-auto">
            Over 50 projects delivered for ambitious teams across design, product, and engineering. Real work, real results, and strong client partnerships.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact-cta" className="py-20 px-6 fade-in">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[var(--accent-3)] to-[var(--accent-2)] rounded-2xl p-12 text-center border border-[var(--accent)]">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Work Together?</h2>
          <p className="text-[var(--text)]/80 mb-8">Let's discuss your next project</p>
          <Link href="/contact" className="btn-secondary">
            Start a Conversation
          </Link>
        </div>
      </section>
    </div>
  );
}
