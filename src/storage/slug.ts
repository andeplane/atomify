/**
 * Project dirName slugs (ADR-001 §2): alphabet [a-z0-9-], non-empty,
 * human-readable because the dirName is what the Jupyter file browser shows.
 */

const FALLBACK = "project";

/** "Diffusion coefficients!" -> "diffusion-coefficients". */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    // Strip combining marks left by NFKD (é -> e).
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || FALLBACK;
}

/** First of slug, slug-2, slug-3, … not in `taken`. */
export function uniqueSlug(name: string, taken: Set<string>): string {
  const base = slugify(name);
  if (!taken.has(base)) {
    return base;
  }
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
}
