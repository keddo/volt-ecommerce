import { API_ORIGIN } from "./apiClient";

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  // Absolute URLs (seed/placeholder images) and client-local previews (unsaved file picks,
  // rendered via URL.createObjectURL before upload) must pass through untouched - only a
  // server-relative "/uploads/..." path needs the API's origin prefixed.
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `${API_ORIGIN}${url}`;
}
