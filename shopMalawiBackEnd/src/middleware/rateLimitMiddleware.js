import rateLimit from "express-rate-limit";

export const messageRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each user to 30 messages per minute
  message: { error: "Too many messages sent. Please try again later." },
});

export const reactionRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: { error: "Too many reactions. Please try again later." },
});
