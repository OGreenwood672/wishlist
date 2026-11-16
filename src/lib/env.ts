import "server-only";

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get appSecret() {
    return required("APP_SECRET", process.env.APP_SECRET);
  },
  get adminPasswordHash() {
    return required("ADMIN_PASSWORD_HASH", process.env.ADMIN_PASSWORD_HASH);
  },
  // The Vercel <> Supabase integration sets these names automatically.
  get supabaseUrl() {
    return required(
      "SUPABASE_URL",
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabaseServiceKey() {
    return required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
    );
  },
  get hasAnthropicKey() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },
};
