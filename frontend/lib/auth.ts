import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const s = process.env.SECRET_KEY;
  if (!s && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("SECRET_KEY must be set in production");
  }
  return new TextEncoder().encode(s || "dev-only-insecure-secret");
}

export const DEMO_EMAIL = "demo@the-one-saas.app";
export const DEMO_PASSWORD = "demo1234";

// In-memory users for MVP (resets on cold start — fine for deploy proof)
const g = globalThis as any;
if (!g.__oneUsers) g.__oneUsers = new Map<string, string>();
export const users: Map<string, string> = g.__oneUsers;

// Always keep a demo account available
users.set(DEMO_EMAIL, DEMO_PASSWORD);

export function ensureDemoUser() {
  users.set(DEMO_EMAIL, DEMO_PASSWORD);
}

export function isDemoUser(email: string) {
  return email.trim().toLowerCase() === DEMO_EMAIL;
}

export async function createToken(email: string) {
  return new SignJWT({ sub: email, demo: isDemoUser(email) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return String(payload.sub || "");
}
