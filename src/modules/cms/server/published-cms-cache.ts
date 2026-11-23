import "server-only";

import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";

const PUBLISHED_CMS_TAG = "cms-published";

/** Persist public content only; React also deduplicates home/layout reads per request. */
export function cachePublishedCms<Args extends unknown[], Result>(
  key: string,
  read: (...args: Args) => Promise<Result>,
) {
  return cache(unstable_cache(read, [key], { tags: [PUBLISHED_CMS_TAG], revalidate: 300 }));
}

/** Call after the owning write/transaction commits, never inside a transaction. */
export function invalidatePublishedCms(): void {
  revalidateTag(PUBLISHED_CMS_TAG, { expire: 0 });
}
