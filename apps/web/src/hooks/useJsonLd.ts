import { useEffect } from "react";

/** Injects/removes a <script type="application/ld+json"> block for the current page. */
export function useJsonLd(data: Record<string, unknown> | null) {
  useEffect(() => {
    if (!data) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [data]);
}
