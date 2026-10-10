const currencyFormatters = {
  en: new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB", maximumFractionDigits: 0 }),
  am: new Intl.NumberFormat("am-ET", { style: "currency", currency: "ETB", maximumFractionDigits: 0 }),
};

export function formatCurrency(value: number, locale: "en" | "am" = "en"): string {
  return currencyFormatters[locale].format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
