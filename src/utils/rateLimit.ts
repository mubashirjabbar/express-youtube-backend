import rateLimit from 'express-rate-limit';

// Define the general rate limiter configuration
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true, // Sends rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disables the `X-RateLimit-*` headers
});

// Define a stricter rate limiter configuration (e.g., for login)
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
