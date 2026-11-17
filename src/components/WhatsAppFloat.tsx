const WHATSAPP_URL =
  "https://wa.me/254764000664?text=Hello%20UniHost%20Technologies,%20I%20would%20like%20to%20make%20an%20enquiry.";

export default function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with UniHost Technologies on WhatsApp"
      title="Chat with us on WhatsApp"
      className="group fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-[#20BA5A] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
    >
      {/* Pulse animation */}
      <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-30" />

      {/* WhatsApp tooltip - desktop only */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-full mr-3 hidden -translate-x-2 whitespace-nowrap rounded-lg bg-[#172033] px-4 py-2.5 text-sm font-medium text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:block"
      >
        Chat with us
        <span className="ml-2 text-[#25D366]">●</span>
      </span>

      {/* WhatsApp icon */}
      <svg
        viewBox="0 0 32 32"
        fill="currentColor"
        className="relative z-10 h-8 w-8"
        aria-hidden="true"
      >
        <path d="M16.04 2.67A13.28 13.28 0 0 0 4.64 22.8L2.67 29.33l6.7-1.93a13.3 13.3 0 1 0 6.67-24.73Zm0 24.2c-2.08 0-4.12-.56-5.9-1.62l-.42-.25-3.98 1.15 1.18-3.87-.28-.45a10.91 10.91 0 1 1 9.4 5.04Zm5.99-8.17c-.33-.16-1.95-.96-2.25-1.07-.3-.11-.52-.16-.74.16-.22.33-.85 1.07-1.04 1.29-.19.22-.38.25-.71.08-.33-.16-1.4-.52-2.67-1.65-.99-.88-1.65-1.96-1.84-2.29-.19-.33-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.57-.08-.16-.74-1.78-1.01-2.43-.27-.65-.54-.56-.74-.57h-.63c-.22 0-.57.08-.87.41-.3.33-1.14 1.12-1.14 2.73s1.17 3.17 1.34 3.39c.16.22 2.3 3.51 5.58 4.92.78.34 1.39.55 1.87.7.79.25 1.5.22 2.07.13.63-.09 1.95-.8 2.23-1.56.27-.77.27-1.43.19-1.56-.08-.14-.3-.22-.63-.38Z" />
      </svg>
    </a>
  );
}
