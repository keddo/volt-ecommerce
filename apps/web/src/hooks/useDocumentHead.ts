import { useEffect } from "react";

const DEFAULT_TITLE = "VOLT — Electronics, specified";
const DEFAULT_DESCRIPTION =
  "VOLT stocks considered electronics — every listing specified, every order tracked from warehouse to doorstep.";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

interface DocumentHeadOptions {
  image?: string | null;
  type?: "website" | "product";
}

export function useDocumentHead(title?: string | null, description?: string | null, options: DocumentHeadOptions = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | VOLT` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESCRIPTION;

    document.title = fullTitle;
    upsertMeta("name", "description", desc);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", options.type ?? "website");
    upsertMeta("property", "og:url", window.location.href);
    if (options.image) upsertMeta("property", "og:image", options.image);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, options.image, options.type]);
}
