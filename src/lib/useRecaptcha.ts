"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const loadRecaptchaScript = (siteKey: string) => {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("reCAPTCHA is only available in the browser."));
      return;
    }

    if (window.grecaptcha?.execute) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      `script[src*="recaptcha/api.js?render=${siteKey}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), {
        once: true,
      });

      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load reCAPTCHA script.")),
        { once: true },
      );

      return;
    }

    const script = document.createElement("script");

    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();

    script.onerror = () => {
      reject(new Error("Failed to load reCAPTCHA script."));
    };

    document.head.appendChild(script);
  });
};

export function useRecaptcha() {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) {
      return;
    }

    let mounted = true;

    loadRecaptchaScript(SITE_KEY)
      .then(() => {
        if (!mounted) return;

        window.grecaptcha?.ready(() => {
          if (mounted) {
            setReady(true);
          }
        });
      })
      .catch(() => {
        if (!mounted) return;

        setLoadError(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const getToken = async (action: string) => {
    if (!SITE_KEY) {
      throw new Error("reCAPTCHA site key is not configured.");
    }

    if (!window.grecaptcha) {
      throw new Error("reCAPTCHA is unavailable.");
    }

    if (!ready) {
      throw new Error("reCAPTCHA has not finished loading.");
    }

    return window.grecaptcha.execute(SITE_KEY, { action });
  };

  return {
    enabled: Boolean(SITE_KEY) && !loadError,
    ready,
    loadError,
    getToken,
    siteKey: SITE_KEY,
  };
}
