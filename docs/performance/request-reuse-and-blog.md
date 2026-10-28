# Request reuse and bounded blog listings

This unit implements S3 and the blog-list portion of S4 in `odd/tasks/fluid-cpu-optimization.md`. Identity stays private and request-scoped; public blog queries return at most 13 rows and render 12 cards. These are structural reductions, not measured production CPU savings.

## Review and integration

1. Integrate unit A's `@/modules/cms/server/published-cms-cache` export `invalidatePublishedCms(): void`. It must immediately expire the `cms-published` tag. This unit intentionally does not provide that helper.
2. Run the focused VM tests below, then the parent-owned integrated typecheck/full suite. The tests mock persistence and invalidation; they require no credentials, database connection or environment files.
3. For the existing `calendar-area-side-effects.test.mjs` loader, the parent must permit the new `react` import when loading `auth-guards.ts` (real React cache is a no-op outside a server render). Its strict mock-only loader currently rejects that dependency before its policy assertion runs. This file is outside this unit's allowed edit surfaces.

```sh
node --test tests/integration/fluid-request-reuse.test.mjs tests/integration/fluid-blog-pagination.test.mjs
node --test tests/integration/psychopedagogy-role.test.mjs tests/integration/psychopedagogy-permissions.test.mjs tests/integration/calendar-area-side-effects.test.mjs tests/integration/blog-event-time-zone.test.mjs
```

## Reuse boundaries

| Work | Lifetime | Policy and recovery |
| --- | --- | --- |
| Session, actual identity, effective identity | React server request/render cache | No `unstable_cache`, shared promise, tag cache or process-global identity. Outside a React server dispatcher, React cache does not deduplicate; correctness does not depend on reuse. A new request resolves its own session and permissions. |
| Development switcher | Development only | Production effects never fetch the endpoint and render nothing. Production GET/POST return `{ "ok": false }` with 404 before auth, cookies, body parsing or database reads. Development viewer and target eligibility rules are unchanged. |
| Filesystem route discovery | Successful/in-flight production process promise | Concurrent production callers share the scan. Rejections clear the promise so the next call retries. Callers get copies to avoid corrupting cached route records. Development scans afresh. Only public route metadata is memoized. |
| CMS editor save | No editor/draft cache | After both existing page and block upserts succeed, invalidate published content. Draft transitions invalidate too, because they can unpublish previously public content. Neither failed upsert triggers invalidation. Existing two-step persistence is not made transactional here. |

React's server dispatcher supplies the actual identity-cache isolation. The VM tests model this boundary with independent concurrent request stores and verify session/user/impersonation call counts and refusals; they are not an end-to-end Next server-render test. Existing permission composition, inactive dynamic-role behavior, redirects and development impersonation remain unchanged.

## Blog navigation and data

- `/blog` starts at page one; `/blog?page=2` opens page two. `/blog?tag=arte&page=2` retains the tag when using **Anterior** or **Siguiente**. Choosing another tag resets to page one. Tags are URL-encoded.
- Page size is 12. The repository fetches at most 13 rows using `skip`/`take`; the thirteenth is only a lookahead to decide whether to show **Siguiente**, never a rendered card. No total-count query is needed. The repository's array contract explicitly includes that lookahead row.
- Missing, malformed, fractional, nonpositive, repeated or overflowing page parameters fall back to one. Valid integer pages beyond available data retain the empty state and a previous-page link. The maximum accepted offset fits Prisma's signed 32-bit `skip` input.
- Published status, anonymous public-only visibility, authenticated visibility, tag filtering, approved comment counts, total likes, viewer-specific liked state and tag ordering are retained. Publication date descending and creation date descending remain the primary order, with descending ID added only to resolve ties deterministically between pages.
- The first legacy HTML image remains the cover. Extraction now happens in the repository; returned rows contain `thumbnailUrl` instead of full `content`. Detail/editor queries are unchanged. Engagement data is never globally cached.
- Pagination is ordinary keyboard-accessible links within a named navigation landmark, with `rel="prev"`/`rel="next"` and an `aria-current="page"` indicator. No JavaScript-only navigation is required.

## Residual costs and limits

The database still reads full HTML for up to 13 posts to derive the legacy thumbnail. This bounds list payload and extraction work by page size, not by content byte size. Avoiding that database content cost would require persisted thumbnail metadata or a different data model; no raw SQL or schema migration is introduced. Deep offset pagination can still make the database scan skipped rows, and inserts/removals between requests can shift offset pages. These are not snapshot/cursor semantics.

Production route discovery remains one scan per process/cold start, not a deployment-wide cache. React reuse is per render/request, not cross-request authentication caching. Public chrome separation is owned by unit A, not this unit. Real savings require comparable production request/invocation/CPU measurements; none are asserted here.
