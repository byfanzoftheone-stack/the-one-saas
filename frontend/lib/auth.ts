import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.SECRET_KEY || "CHANGE_ME_SECRET");

// In-memory users for MVP (resets on cold start — fine for deploy proof)
const g = globalThis as any;
if (!g.__oneUsers) g.__oneUsers = new Map<string, string>();
export const users: Map<string, string> = g.__oneUsers;

export async function createToken(email: string) {
  return new SignJWT({ sub: email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return String(payload.sub || "");
}
