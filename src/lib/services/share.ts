import type { CakeConfig } from "@/types/cake";
import { BASE_PATH } from "@/lib/basePath";

/** Encode a design (minus heavy photo/thumbnail data) into a URL-safe string. */
export function encodeDesign(config: CakeConfig): string {
  const slim: CakeConfig = { ...config, thumbnail: undefined, photo: { ...config.photo, dataUrl: null } };
  const json = JSON.stringify(slim);
  const b64 = typeof window === "undefined" ? Buffer.from(json, "utf8").toString("base64") : btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeDesign(s: string): CakeConfig | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof window === "undefined" ? Buffer.from(b64, "base64").toString("utf8") : decodeURIComponent(escape(atob(b64)));
    const c = JSON.parse(json) as CakeConfig;
    if (!c || !Array.isArray(c.tiers) || !c.tiers.length) return null;
    return c;
  } catch {
    return null;
  }
}

export function shareUrl(config: CakeConfig) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${BASE_PATH}/studio/?design=${encodeDesign(config)}`;
}
