import type { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
};

/**
 * Parse duration string (e.g., "15m", "7d", "1h") to milliseconds
 */
function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,              // seconds
    m: 60 * 1000,         // minutes
    h: 60 * 60 * 1000,    // hours
    d: 24 * 60 * 60 * 1000, // days
  };

  return value * multipliers[unit];
}

// Token expiry times from env (synced with JWT expiry)
const ACCESS_TOKEN_MAX_AGE = parseDurationToMs(process.env.JWT_ACCESS_EXPIRES_IN || "15m");
const REFRESH_TOKEN_MAX_AGE = parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN || "7d");

/**
 * Set authentication cookies on response
 */
export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
): void {
  res.cookie("accessToken", tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  res.cookie("refreshToken", tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/api/auth", // Restrict refresh token to auth endpoints only
  });
}

/**
 * Clear authentication cookies on response
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie("accessToken", {
    ...COOKIE_OPTIONS,
  });

  res.clearCookie("refreshToken", {
    ...COOKIE_OPTIONS,
    path: "/api/auth",
  });
}
