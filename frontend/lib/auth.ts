import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.SECRET_KEY || "CHANGE_ME_SECRET");

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
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return String(payload.sub || "");
}
