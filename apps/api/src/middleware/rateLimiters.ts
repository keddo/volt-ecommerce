import rateLimit from "express-rate-limit";

// These limits are a production abuse backstop. Outside production (local dev, and especially
// repeated/back-to-back E2E suite runs against the real dev server) they'd throttle legitimate
// traffic that would never happen from a single real client, so scale them up by 50x there instead
// of disabling them outright - the limiter's wiring itself still gets exercised.
const isProd = process.env.NODE_ENV === "production";
const scale = (n: number) => (isProd ? n : n * 50);

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: scale(20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});

// For sensitive mutations a real user might do several times a session (checkout, reviews,
// password change, coupon attempts) - looser than auth's, but still a real backstop against abuse.
export const actionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: scale(60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down and try again shortly." },
});

// Global backstop on all of /api - generous enough that normal browsing never hits it.
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: scale(300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
