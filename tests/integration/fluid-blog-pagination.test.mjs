import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const plain = (value) => JSON.parse(JSON.stringify(value));
function load(file, mocks = {}) {
  const source = readFileSync(new URL(`../../src/${file}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, URLSearchParams, require: (id) => {
    if (id in mocks) return mocks[id];
    if (id.startsWith("react")) return require(id);
    throw new Error(`Unexpected dependency: ${id}`);
  } });
  return mod.exports;
}
const pagination = () => load("modules/blog/lib/blog-pagination.ts");
const posts = Array.from({ length: 30 }, (_, i) => ({
  id: String(i).padStart(2, "0"), slug: `post-${i}`, title: `Post ${i}`, excerpt: "Summary", content: i === 0 ? '<p>Text</p><img src="/cover.jpg"><img src="/second.jpg">' : "<p>No image</p>",
  status: i === 29 ? "DRAFT" : "PUBLISHED", visibility: i % 2 ? "AUTHENTICATED" : "PUBLIC",
  publishedAt: new Date("2026-01-01"), createdAt: new Date("2025-01-01"), authorName: "Author", editorialAuthorName: "Editor",
  tags: [{ tag: { id: "t", name: "Arte", slug: i % 3 ? "other" : "arte" } }],
  _count: { comments: 3, likes: 5 }, likes: [{ id: "liked" }],
}));

function repository() {
  const queries = [];
  const repo = load("modules/blog/server/blog.repository.ts", {
    "@prisma/client": { BlogPostStatus: { PUBLISHED: "PUBLISHED" }, BlogPostVisibility: { PUBLIC: "PUBLIC" } },
    "@/modules/blog/lib/blog-pagination": pagination(),
    "@/lib/prisma": { prisma: { blogPost: {
      findMany: async (query) => {
        queries.push(query);
        const matches = posts.filter((p) => p.status === query.where.status && (!query.where.visibility || p.visibility === query.where.visibility) && (!query.where.tags || p.tags.some(({ tag }) => tag.slug === query.where.tags.some.tag.slug)));
        // Tied publication dates must have a deterministic final tie-breaker.
        matches.sort((a, b) => query.orderBy.some((o) => o.id === "desc") ? b.id.localeCompare(a.id) : 0);
        return matches.slice(query.skip ?? 0, (query.skip ?? 0) + (query.take ?? matches.length)).map((p) => ({ ...p, likes: query.select.likes ? p.likes : undefined }));
      },
    } } },
  });
  return { repo, queries };
}

test("page input normalizes malformed, repeated and overflow values; links retain and encode tags", () => {
  const { normalizeBlogPage, blogPageHref, BLOG_PAGE_SIZE } = pagination();
  assert.equal(BLOG_PAGE_SIZE, 12);
  for (const input of [undefined, "", "0", "-1", "2.5", "abc", "1e2", "Infinity", ["2", "3"], "999999999999999999999999"]) assert.equal(normalizeBlogPage(input), 1);
  for (const input of [2, "2", "0002"]) assert.equal(normalizeBlogPage(input), 2);
  assert.equal(blogPageHref(1), "/blog");
  assert.equal(blogPageHref(2), "/blog?page=2");
  assert.equal(blogPageHref(1, "arte & música"), "/blog?tag=arte+%26+m%C3%BAsica");
  assert.equal(blogPageHref(2, "arte"), "/blog?tag=arte&page=2");
});

test("anonymous listing is bounded and retains public/published/tag filters, order, engagement and server-extracted thumbnail without HTML", async () => {
  const { repo, queries } = repository();
  const result = await repo.getPublishedPosts({ tagSlug: "arte", page: 1 });
  const q = queries[0];
  assert.deepEqual(plain(q.where), { status: "PUBLISHED", visibility: "PUBLIC", tags: { some: { tag: { slug: "arte" } } } });
  assert.deepEqual(plain(q.orderBy), [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }]);
  assert.equal(q.skip, 0); assert.equal(q.take, 13);
  assert.equal(q.select._count.select.comments.where.approved, true);
  assert.equal(q.select._count.select.likes, true); assert.equal(q.select.likes, false);
  assert.deepEqual(plain(result.map((p) => p.id)), ["24", "18", "12", "06", "00"]);
  assert.equal(result.at(-1).thumbnailUrl, "/cover.jpg");
  assert.equal(result[0].thumbnailUrl, null);
  for (const p of result) {
    assert.equal("content" in p, false);
    assert.deepEqual(p._count, { comments: 3, likes: 5 });
    assert.equal(p.likes, undefined); assert.equal(p.tags[0].tag.slug, "arte");
  }
});

test("authenticated listing preserves private access and current-user likes; adjacent pages are disjoint apart from lookahead", async () => {
  const { repo, queries } = repository();
  const first = await repo.getPublishedPosts({ userId: "alice", page: 1 });
  const second = await repo.getPublishedPosts({ userId: "alice", page: 2 });
  assert.equal(first.length, 13); assert.equal(second.length, 13);
  assert.equal(queries[0].where.visibility, undefined);
  assert.deepEqual(plain(queries[0].select.likes), { where: { userId: "alice" }, select: { id: true }, take: 1 });
  assert.equal(queries[1].skip, 12); assert.equal(queries[1].take, 13);
  assert.ok(first.some((p) => p.visibility === "AUTHENTICATED"));
  assert.ok(first.every((p) => p.likes.length === 1));
  assert.equal(new Set([...first.slice(0, 12), ...second.slice(0, 12)].map((p) => p.id)).size, 24);
  assert.equal(first[12].id, second[0].id);
  assert.equal(first.some((p) => p.id === "29"), false);
  const tagged = await repo.getPublishedPosts({ userId: "alice", tagSlug: "arte", page: 2 });
  assert.equal(tagged.length, 0);
  assert.deepEqual(plain(queries[2].where.tags), { some: { tag: { slug: "arte" } } });
  await repo.getPublishedPosts({ page: "bad" });
  assert.equal(queries[3].skip, 0);
});

const Link = ({ children, ...props }) => React.createElement("a", props, children);
const pass = ({ children }) => React.createElement("div", null, children);
function listView(rows) {
  const requests = [];
  const { BlogListView } = load("modules/blog/views/blog-list-view.tsx", {
    "next/link": { __esModule: true, default: Link },
    "next/image": { __esModule: true, default: (props) => React.createElement("img", { src: props.src, alt: props.alt }) },
    "lucide-react": { ChevronRightIcon: pass, ClockIcon: pass, MapPinIcon: pass, MessageCircleIcon: pass },
    "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => ({ id: "alice", role: "TEACHER" }) },
    "@/modules/blog/lib/blog-pagination": pagination(),
    "@/modules/blog/server/blog.repository": {
      getPublishedPosts: async (query) => { requests.push(query); return rows; },
      getPublishedBlogTags: async () => [{ id: "t", name: "Arte", slug: "arte" }],
    },
    "@/modules/blog/components/blog-like-button": { BlogLikeButton: ({ initialLiked, initialCount }) => React.createElement("span", null, `liked:${initialLiked};count:${initialCount}`) },
    "@/modules/blog/components/blog-page-header": { BlogPageHeader: pass },
    "@/modules/blog/components/blog-event-dialog": { BlogEventDialog: pass },
    "@/modules/dashboard/server/calendar.repository": { listUpcomingPublicCalendarEvents: async () => [] },
    "@/modules/calendar/lib/calendar-time-zone": {},
  });
  return { BlogListView, requests };
}

test("list renders 12 cards, preserves thumbnail/engagement and exposes accessible next/previous links retaining tag", async () => {
  const rows = posts.slice(0, 13).map(({ content, ...p }, i) => ({ ...p, thumbnailUrl: i ? null : "/cover.jpg" }));
  const { BlogListView, requests } = listView(rows);
  const html = renderToStaticMarkup(await BlogListView({ page: 2, tagSlug: "arte" }));
  assert.equal((html.match(/<article/g) ?? []).length, 12);
  assert.doesNotMatch(html, /Post 12/);
  assert.match(html, /src="\/cover.jpg"/); assert.match(html, /liked:true;count:5/);
  assert.match(html, /aria-label="Paginación del blog"/);
  assert.match(html, /href="\/blog\?tag=arte"[^>]*rel="prev"/);
  assert.match(html, /href="\/blog\?tag=arte&amp;page=3"[^>]*rel="next"/);
  assert.match(html, /aria-current="page"[^>]*>Página 2/);
  assert.deepEqual(plain(requests), [{ userId: "alice", tagSlug: "arte", page: 2 }]);
  const first = listView(rows.slice(0, 12));
  const firstHtml = renderToStaticMarkup(await first.BlogListView({}));
  assert.doesNotMatch(firstHtml, /rel="prev"|rel="next"/);
  const empty = listView([]);
  const emptyHtml = renderToStaticMarkup(await empty.BlogListView({ page: 99, tagSlug: "arte" }));
  assert.match(emptyHtml, /Todavía no hay posts publicados\./);
  assert.match(emptyHtml, /href="\/blog\?tag=arte&amp;page=98"[^>]*rel="prev"/);
  assert.doesNotMatch(emptyHtml, /rel="next"/);
});

test("blog page passes normalized page and existing tag/CMS text through to listing", async () => {
  const { default: Page } = load("app/blog/page.tsx", {
    "@/modules/blog/views/blog-list-view": { BlogListView: pass },
    "@/modules/blog/lib/blog-pagination": pagination(),
    "@/modules/cms/server/cms-text.repository": { getCmsPublishedTextMapBySlug: async (slug) => { assert.equal(slug, "/blog"); return { title: "Blog" }; } },
  });
  for (const [input, expected] of [["2", 2], ["bogus", 1]]) {
    const element = await Page({ searchParams: Promise.resolve({ tag: "arte", page: input }) });
    assert.deepEqual(plain(element.props), { tagSlug: "arte", page: expected, textMap: { title: "Blog" } });
  }
});
