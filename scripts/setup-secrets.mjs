// Usage: npm run setup-secrets -- "your-admin-password"
// Prints the two env vars the app needs. Paste them into .env.local and Vercel.
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Usage: npm run setup-secrets -- "your-admin-password"  (8+ characters)');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);

console.log("\nAdd these environment variables (local: .env.local, prod: Vercel → Settings → Environment Variables):\n");
console.log(`APP_SECRET=${randomBytes(32).toString("base64url")}`);
console.log(`ADMIN_PASSWORD_HASH=s1.${salt.toString("hex")}.${hash.toString("hex")}`);
console.log("\nKeep APP_SECRET stable: changing it logs everyone out and breaks stored wishlist passwords.\n");
