'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const loadRecaptchaScript = (siteKey: string) => {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('reCAPTCHA is only available in the browser.'));
    }

    if (window.grecaptcha?.execute) {
      return resolve();
    }

    const existingScript = document.querySelector(`script[src*="recaptcha/api.js?render=${siteKey}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA script.')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA script.'));
    document.head.appendChild(script);
  });
};

export function useRecaptcha() {
  const [enabled, setEnabled] = useState(Boolean(SITE_KEY));
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) {
      setEnabled(false);
      return;
    }

    let mounted = true;
    loadRecaptchaScript(SITE_KEY)
      .then(() => {
        if (!mounted) return;
        window.grecaptcha?.ready(() => setReady(true));
      })
      .catch(() => {
        if (!mounted) return;
        setLoadError(true);
        setEnabled(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const getToken = async (action: string) => {
    if (!SITE_KEY) {
      throw new Error('reCAPTCHA site key is not configured.');
    }

    if (!window.grecaptcha) {
      throw new Error('reCAPTCHA is unavailable.');
    }

    return window.grecaptcha.execute(SITE_KEY, { action });
  };

  return {
    enabled,
    ready,
    loadError,
    getToken,
    siteKey: SITE_KEY,
  };
}
