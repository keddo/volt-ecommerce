import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, type Locale } from "../i18n/translations";

type Dict = typeof translations.en;

type DotPaths<T> = T extends string
  ? never
  : { [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}` }[keyof T & string];

export type TranslationKey = DotPaths<Dict>;

const STORAGE_KEY = "volt_locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "am") return stored;
  return navigator.language?.toLowerCase().startsWith("am") ? "am" : "en";
}

function lookup(key: string, locale: Locale): string | undefined {
  const parts = key.split(".");
  let node: unknown = translations[locale];
  for (const part of parts) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private browsing / storage disabled - locale just won't persist
    }
  }

  const t = useMemo(() => {
    return (key: TranslationKey, vars?: Record<string, string | number>) => {
      let value = lookup(key, locale) ?? lookup(key, "en") ?? key;
      if (vars) {
        for (const [varKey, varValue] of Object.entries(vars)) {
          value = value.replaceAll(`{${varKey}}`, String(varValue));
        }
      }
      return value;
    };
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
