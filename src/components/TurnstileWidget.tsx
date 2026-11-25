"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action: string;
          theme?: "light" | "dark" | "auto";
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  action: "contact_form" | "quote_form";
  onToken: (token: string) => void;
  onError: () => void;
  resetSignal?: number;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      'script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]',
    );

    const handleLoad = () => {
      if (window.turnstile) {
        resolve();
      } else {
        reject(new Error("Turnstile failed to initialize."));
      }
    };

    const handleError = () => {
      scriptPromise = null;
      reject(new Error("Unable to load Turnstile."));
    };

    if (!script) {
      script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
    }

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!script.isConnected) {
      document.head.appendChild(script);
    }
  });

  return scriptPromise;
}

export default function TurnstileWidget({
  action,
  onToken,
  onError,
  resetSignal = 0,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);

  onTokenRef.current = onToken;
  onErrorRef.current = onError;

  useEffect(() => {
    let mounted = true;
    let widgetId: string | undefined;

    if (!SITE_KEY) {
      onErrorRef.current();
      return;
    }

    loadTurnstileScript()
      .then(() => {
        if (!mounted || !containerRef.current || !window.turnstile) {
          return;
        }

        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          action,
          theme: "auto",
          callback: (token) => {
            onTokenRef.current(token);
          },
          "error-callback": () => {
            onTokenRef.current("");
            onErrorRef.current();
          },
          "expired-callback": () => {
            onTokenRef.current("");
          },
        });
      })
      .catch(() => {
        if (mounted) {
          onTokenRef.current("");
          onErrorRef.current();
        }
      });

    return () => {
      mounted = false;

      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [action, resetSignal]);

  return (
    <div
      ref={containerRef}
      className="min-h-[65px]"
      aria-label="Security verification"
    />
  );
}
