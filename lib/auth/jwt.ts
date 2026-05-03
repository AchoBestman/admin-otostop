import jwt from "jsonwebtoken";
import type { JWTPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h";

// Generate JWT token
export function generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Generate OTP code (6 digits)
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get OTP expiration date (10 minutes from now)
export function getOTPExpiration(): Date {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10);
  return expires;
}

// Check if OTP is expired
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

// Generate password reset token
export function generateResetToken(email: string): string {
  return jwt.sign({ email, type: "reset" }, JWT_SECRET, { expiresIn: "1h" });
}

// Verify password reset token
export function verifyResetToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; type: string };
    if (decoded.type !== "reset") return null;
    return { email: decoded.email };
  } catch {
    return null;
  }
}
