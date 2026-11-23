export const BLOG_PAGE_SIZE = 12;

// Prisma's skip is a signed 32-bit integer. Invalid or overflowing URLs start
// at page one instead of producing an unbounded or invalid database request.
const MAX_BLOG_PAGE = Math.floor(2_147_483_647 / BLOG_PAGE_SIZE) + 1;

export function normalizeBlogPage(value: unknown): number {
  if (typeof value !== "number" && (typeof value !== "string" || !/^\d+$/.test(value))) {
    return 1;
  }
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && page <= MAX_BLOG_PAGE ? page : 1;
}

export function blogPageHref(page: number, tagSlug?: string): string {
  const params = new URLSearchParams();
  if (tagSlug) params.set("tag", tagSlug);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}
