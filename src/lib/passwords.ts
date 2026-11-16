import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { env } from "./env";

/** Sub-keys are derived from APP_SECRET so setup only needs one secret. */
function subkey(label: string): Buffer {
  return createHmac("sha256", env.appSecret).update(label).digest();
}

// ---------------------------------------------------------------------------
// Admin password: scrypt hash in ADMIN_PASSWORD_HASH, format `s1.<salt>.<hash>`
// (hex, no `$`, so it survives .env files untouched).
// ---------------------------------------------------------------------------

export function verifyAdminPassword(password: string): boolean {
  const [version, saltHex, hashHex] = env.adminPasswordHash.trim().split(".");
  if (version !== "s1" || !saltHex || !hashHex) {
    throw new Error("ADMIN_PASSWORD_HASH is malformed. Run `npm run setup-secrets`.");
  }
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

// ---------------------------------------------------------------------------
// Wishlist passwords: case-insensitive, looked up by keyed HMAC (unique in DB),
// and stored AES-GCM encrypted so the admin dashboard can show them.
// ---------------------------------------------------------------------------

export function normalizeWishlistPassword(password: string): string {
  return password.trim().toLowerCase();
}

export function passwordLookupKey(password: string): string {
  return createHmac("sha256", subkey("wishlist-password-lookup"))
    .update(normalizeWishlistPassword(password))
    .digest("hex");
}

export function encryptPassword(password: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", subkey("wishlist-password-enc"), iv);
  const ciphertext = Buffer.concat([
    cipher.update(normalizeWishlistPassword(password), "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), ciphertext]
    .map((b) => b.toString("base64url"))
    .join(".");
}

export function decryptPassword(stored: string): string | null {
  try {
    const [iv, tag, ciphertext] = stored.split(".").map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", subkey("wishlist-password-enc"), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export const MIN_PASSWORD_LENGTH = 6;

const WORDS = [
  "amber", "aspen", "autumn", "biscuit", "bloom", "breeze", "candle", "cedar",
  "cherry", "cinder", "clover", "cobalt", "comet", "coral", "cosmo", "cotton",
  "crimson", "dahlia", "dune", "ember", "fable", "fern", "fjord", "frost",
  "gilded", "ginger", "glade", "harbor", "hazel", "honey", "indigo", "ivory",
  "juniper", "kettle", "lagoon", "lantern", "lemon", "linen", "lunar", "maple",
  "marble", "meadow", "mellow", "mint", "misty", "nectar", "nova", "oak",
  "olive", "opal", "orchid", "pebble", "pepper", "pine", "plum", "pollen",
  "quartz", "quill", "raven", "river", "saffron", "sage", "satin", "sierra",
  "silver", "sparrow", "spruce", "summit", "sunny", "tango", "thistle", "tidal",
  "topaz", "tulip", "velvet", "violet", "willow", "winter", "zephyr", "zinnia",
];

export function suggestPassphrase(): string {
  const a = WORDS[randomInt(WORDS.length)];
  let b = WORDS[randomInt(WORDS.length)];
  while (b === a) b = WORDS[randomInt(WORDS.length)];
  return `${a}-${b}-${randomInt(10, 100)}`;
}

/** Stable, non-reversible id for rate-limiting by IP. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(subkey("ip")).update(ip).digest("hex").slice(0, 32);
}
