import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface LinkPreview {
  url: string;
  title: string;
  image_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
  price: number | null;
  currency: string | null;
}

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 7000;
const MAX_REDIRECTS = 5;

export function normalizeUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  const v6 = ip.toLowerCase();
  return (
    v6 === "::1" ||
    v6 === "::" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe80") ||
    v6.startsWith("::ffff:127.") ||
    v6.startsWith("::ffff:10.") ||
    v6.startsWith("::ffff:192.168.")
  );
}

/** Blocks requests to internal hosts (basic SSRF guard). */
async function assertPublicHost(url: URL): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new Error("Blocked host");
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error("Blocked host");
  }
}

async function fetchHtml(start: URL): Promise<{ html: string; finalUrl: URL }> {
  let url = start;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      await assertPublicHost(url);
      const res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "en-GB,en;q=0.9",
        },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        url = new URL(res.headers.get("location")!, url);
        continue;
      }
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html") || !res.body) {
        return { html: "", finalUrl: url };
      }
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (size < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.length;
      }
      await reader.cancel().catch(() => {});
      return { html: new TextDecoder().decode(Buffer.concat(chunks)), finalUrl: url };
    }
    return { html: "", finalUrl: url };
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .trim();
}

function metaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k}["'][^>]*content=["']([^"']*)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${k}["']`, "i"),
    ];
    for (const re of patterns) {
      const match = html.match(re);
      if (match?.[1]) return decodeEntities(match[1]);
    }
  }
  return null;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^\d.,]/g, "").replace(/,(?=\d{3}\b)/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Looks for a schema.org Product offer in JSON-LD blocks. */
function jsonLdOffer(html: string): { price: number | null; currency: string | null; image: string | null; name: string | null } {
  const result = { price: null as number | null, currency: null as string | null, image: null as string | null, name: null as string | null };
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object" || result.price !== null) return;
    if (Array.isArray(node)) return node.forEach(visit);
    const obj = node as Record<string, unknown>;
    const type = obj["@type"];
    const isProduct = type === "Product" || (Array.isArray(type) && type.includes("Product"));
    if (isProduct) {
      const offers = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
      if (offers && typeof offers === "object") {
        const o = offers as Record<string, unknown>;
        result.price = parsePrice(o.price ?? o.lowPrice);
        result.currency = typeof o.priceCurrency === "string" ? o.priceCurrency : null;
      }
      const image = Array.isArray(obj.image) ? obj.image[0] : obj.image;
      if (typeof image === "string") result.image = image;
      else if (image && typeof image === "object" && typeof (image as Record<string, unknown>).url === "string") {
        result.image = (image as Record<string, string>).url;
      }
      if (typeof obj.name === "string") result.name = obj.name;
    }
    Object.values(obj).forEach(visit);
  };
  for (const block of blocks) {
    try {
      visit(JSON.parse(block[1]));
    } catch {
      // Ignore malformed JSON-LD.
    }
  }
  return result;
}

function absolute(value: string | null, base: URL): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function fetchLinkPreview(url: URL): Promise<LinkPreview> {
  const base: LinkPreview = {
    url: url.toString(),
    title: "",
    image_url: null,
    favicon_url: `${url.origin}/favicon.ico`,
    site_name: url.hostname.replace(/^www\./, ""),
    price: null,
    currency: null,
  };

  let html = "";
  let finalUrl = url;
  try {
    ({ html, finalUrl } = await fetchHtml(url));
  } catch {
    return base;
  }
  if (!html) return base;

  const ld = jsonLdOffer(html);
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const iconHref =
    html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)?.[1] ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i)?.[1] ??
    html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i)?.[1] ??
    null;

  const metaPrice = metaContent(html, ["product:price:amount", "og:price:amount", "price"]);
  const metaCurrency = metaContent(html, ["product:price:currency", "og:price:currency", "priceCurrency"]);

  return {
    url: url.toString(),
    title: (
      metaContent(html, ["og:title", "twitter:title"]) ??
      ld.name ??
      (titleTag ? decodeEntities(titleTag) : "")
    ).slice(0, 200),
    image_url: absolute(metaContent(html, ["og:image", "og:image:url", "twitter:image", "twitter:image:src"]) ?? ld.image, finalUrl),
    favicon_url: absolute(iconHref, finalUrl) ?? base.favicon_url,
    site_name: metaContent(html, ["og:site_name", "application-name"]) ?? base.site_name,
    price: ld.price ?? parsePrice(metaPrice),
    currency: (ld.price !== null ? ld.currency : metaCurrency)?.toUpperCase().slice(0, 3) ?? null,
  };
}
