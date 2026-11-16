import { SignJWT, jwtVerify } from "jose";

// Kept free of `next/headers` and `server-only` so the proxy can import it too.

export const SESSION_COOKIE = "wl_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Session =
  | { role: "admin" }
  | { role: "guest"; wid: string; v: number };

function key(): Uint8Array {
  const secret = process.env.APP_SECRET;
  if (!secret) throw new Error("Missing environment variable: APP_SECRET");
  return new TextEncoder().encode(`${secret}:session`);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (payload.role === "admin") return { role: "admin" };
    if (
      payload.role === "guest" &&
      typeof payload.wid === "string" &&
      typeof payload.v === "number"
    ) {
      return { role: "guest", wid: payload.wid, v: payload.v };
    }
    return null;
  } catch {
    return null;
  }
}
