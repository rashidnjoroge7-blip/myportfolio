const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const ipRequestTimes = new Map<string, number[]>();

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return (forwarded ? forwarded.split(",")[0].trim() : realIp?.trim()) || "unknown";
}

export function recordRequest(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const requests = ipRequestTimes.get(ip) || [];
  const windowed = requests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  windowed.push(now);
  ipRequestTimes.set(ip, windowed);
}

export function isRateLimited(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const requests = ipRequestTimes.get(ip) || [];
  const windowed = requests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  ipRequestTimes.set(ip, windowed);
  return windowed.length >= RATE_LIMIT_MAX_REQUESTS;
}

export function isTooFast(startedAt: unknown) {
  const startedAtNumber = Number(startedAt);
  if (!startedAtNumber || Number.isNaN(startedAtNumber)) {
    return true;
  }
  return Date.now() - startedAtNumber < 3000;
}

export async function verifyCaptcha(token: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.warn("RECAPTCHA_SECRET_KEY is not configured; captcha verification disabled.");
    return true;
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret,
      response: token,
    }),
  });

  const data = await response.json();
  return data.success === true;
}
