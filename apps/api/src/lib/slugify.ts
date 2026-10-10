export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const baseSlug = slugify(base);
  let candidate = baseSlug;
  let suffix = 2;
  while (await exists(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}
