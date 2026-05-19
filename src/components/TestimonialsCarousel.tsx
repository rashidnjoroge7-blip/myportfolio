"use client";

import { useEffect, useState } from "react";

type Testimonial = {
  id: number;
  name: string;
  role: string;
  image: string;
  content: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "CEO at TechStart",
    image: "👩‍💼",
    content:
      "Exceptional developer with great attention to detail. Delivered the project ahead of schedule and exceeded our expectations.",
    rating: 5,
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Product Manager at InnovateLab",
    image: "👨‍💼",
    content:
      "Outstanding collaboration skills and technical expertise. They transformed our vision into a beautiful, performant application.",
    rating: 5,
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Designer at CreativeStudio",
    image: "👩‍🎨",
    content:
      "Great to work with! They understood the design vision and implemented it flawlessly. Highly recommend!",
    rating: 5,
  },
  {
    id: 4,
    name: "David Lee",
    role: "CTO at DataFlow",
    image: "👨‍💻",
    content:
      "Technical excellence combined with great communication. A true professional who delivers results.",
    rating: 5,
  },
];

export default function TestimonialsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeTestimonial = testimonials[activeIndex];

  const goNext = () => setActiveIndex((current) => (current + 1) % testimonials.length);
  const goPrev = () => setActiveIndex((current) => (current - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    if (isPaused) return;

    const timer = window.setInterval(goNext, 6000);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="relative">
      <div
        className="card hover-card rounded-3xl border-[var(--card-border)] bg-[var(--surface)] p-8 shadow-xl shadow-[rgba(56,189,248,0.08)] transition-all duration-300"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="flex justify-between items-center gap-4 mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent)]">Client feedback</p>
            <p className="text-xl font-semibold text-[var(--text)] mt-2">What clients say</p>
          </div>
          <div className="flex items-center gap-2 text-[var(--muted)] text-sm">
            <span>{activeIndex + 1}</span>
            <span>/</span>
            <span>{testimonials.length}</span>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex gap-3 mb-4 items-center">
            <div className="text-4xl">{activeTestimonial.image}</div>
            <div>
              <p className="font-semibold text-[var(--accent-3)]">{activeTestimonial.name}</p>
              <p className="text-sm text-[var(--muted)]">{activeTestimonial.role}</p>
            </div>
          </div>
          <p className="text-[var(--muted)] text-lg leading-relaxed">“{activeTestimonial.content}”</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {[...Array(activeTestimonial.rating)].map((_, index) => (
              <span key={index} className="text-yellow-400 text-xl">★</span>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-full border border-[var(--card-border)] bg-[var(--surface-alt)] px-4 py-2 text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
              aria-label="Previous testimonial"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-full border border-[var(--card-border)] bg-[var(--surface-alt)] px-4 py-2 text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
              aria-label="Next testimonial"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {testimonials.map((testimonial, index) => (
          <button
            key={testimonial.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2 w-8 rounded-full transition ${index === activeIndex ? "bg-[var(--accent)]" : "bg-[var(--card-border)]"}`}
            aria-label={`Show testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
