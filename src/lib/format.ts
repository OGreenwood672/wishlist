const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatPrice(value: number | null, currency?: string | null): string | null {
  if (value === null || Number.isNaN(value)) return null;
  if (currency && currency.toUpperCase() !== "GBP") {
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency.toUpperCase(),
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${value} ${currency}`;
    }
  }
  return gbp.format(value);
}

export function formatRange(min: number | null, max: number | null): string | null {
  if (min !== null && max !== null) return `${gbp.format(min)}–${gbp.format(max)}`;
  if (min !== null) return `from ${gbp.format(min)}`;
  if (max !== null) return `up to ${gbp.format(max)}`;
  return null;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "wishlist"
  );
}
