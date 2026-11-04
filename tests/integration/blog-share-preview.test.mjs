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
  vm.runInNewContext(output, { module: mod, exports: mod.exports, URL, require: (id) => {
    if (id in mocks) return mocks[id];
    if (id.startsWith("react")) return require(id);
    throw new Error(`Unexpected dependency: ${id}`);
  } });
  return mod.exports;
}
const sharePreview = JSON.parse(readFileSync("src/lib/share-preview.json", "utf8"));
const pass = ({ children }) => React.createElement("div", null, children);
const firstShareImage = "https://res.cloudinary.com/demo/image/upload/c_limit,w_1200,h_630,f_jpg,q_70/first.jpg";
const post = {
  id: "private-id", slug: "celebrar-la-cosecha", status: "PUBLISHED", visibility: "MEMBERS",
  title: "Celebrar la cosecha", excerpt: "A public summary", content: '<p>SECRET ARTICLE BODY</p><div data-type="masonry-gallery"><img src="https://res.cloudinary.com/demo/image/upload/first.jpg"><img src="/second.jpg"></div>',
  tags: [], comments: [{ id: "comment", content: "SECRET COMMENT", authorName: "Member", createdAt: new Date() }],
  likes: [], _count: { likes: 7 }, authorName: "Author", createdAt: new Date(),
};
function repository(record = post) {
  const queries = [];
  const repo = load("modules/blog/server/blog.repository.ts", {
    "@prisma/client": { BlogPostStatus: { PUBLISHED: "PUBLISHED" }, BlogPostVisibility: { PUBLIC: "PUBLIC", MEMBERS: "MEMBERS" } },
    "@/modules/blog/lib/blog-pagination": {},
    "@/modules/blog/lib/blog-share-image": load("modules/blog/lib/blog-share-image.ts", { "@/lib/share-preview.json": sharePreview }),
    "@/lib/prisma": { prisma: { blogPost: { findFirst: async (query) => {
      queries.push(plain(query));
      if (!record || Object.entries(query.where).some(([key, value]) => record[key] !== value)) return null;
      return query.select ? Object.fromEntries(Object.keys(query.select).map((key) => [key, record[key]])) : record;
    } } } },
  });
  return { repo, queries };
}
function view(repo, session = null) {
  return load("modules/blog/views/blog-post-view.tsx", {
    "@prisma/client": { BlogPostVisibility: { PUBLIC: "PUBLIC", MEMBERS: "MEMBERS" } },
    "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
    "next/image": { __esModule: true, default: ({ unoptimized, ...props }) => {
      assert.equal(unoptimized, true);
      return React.createElement("img", props);
    } },
    "next/navigation": { notFound: () => { throw new Error("NOT_FOUND"); }, redirect: (url) => { throw new Error(`REDIRECT:${url}`); } },
    "next/headers": { headers: async () => ({}) },
    "lucide-react": { MessageCircleIcon: pass },
    "@/lib/auth": { auth: { api: { getSession: async () => session } } },
    "@/modules/blog/components/blog-event-toast": { BlogEventToast: pass },
    "@/modules/blog/components/blog-like-button": { BlogLikeButton: pass },
    "@/components/ui/textarea": { Textarea: pass },
    "@/modules/blog/server/blog.actions": { createBlogCommentAction: "/test-comment" },
    "@/modules/blog/server/blog.repository": repo,
    "@/modules/blog/lib/sanitize-blog-html": { sanitizeBlogHtml: (html) => html },
  }).BlogPostView;
}
function metadata(repo) {
  return load("app/blog/[slug]/page.tsx", {
    "@/lib/share-preview.json": sharePreview,
    "@/modules/blog/views/blog-post-view": { BlogPostView: pass },
    "@/modules/blog/server/blog.repository": repo,
  }).generateMetadata({ params: Promise.resolve({ slug: post.slug }) });
}

test("published restricted previews expose only approved fields, never article HTML or engagement", async () => {
  const { repo, queries } = repository();
  const preview = await repo.getPublicPublishedPostMetadataBySlug(post.slug);
  assert.deepEqual(plain(preview), { title: post.title, excerpt: post.excerpt, imageUrl: firstShareImage });
  assert.deepEqual(queries[0].where, { slug: post.slug, status: "PUBLISHED" });
  assert.doesNotMatch(JSON.stringify(preview), /SECRET|private-id|comments|likes|content/);
});

test("anonymous restricted post renders preview and login return link without redirect or protected body", async () => {
  const { repo } = repository();
  const element = await view(repo)({ slug: post.slug });
  const html = renderToStaticMarkup(element);
  assert.match(html, /Celebrar la cosecha/);
  assert.match(html, /A public summary/);
  assert.ok(html.includes(`src="${firstShareImage}"`));
  assert.match(html, /href="\/sign-in\?returnTo=%2Fblog%2Fcelebrar-la-cosecha"/);
  assert.doesNotMatch(html + JSON.stringify(element), /SECRET|second.jpg|Comentarios|private-id/);
});

test("metadata is article-specific for restricted and public published posts and selects only the first image in document order", async () => {
  for (const visibility of ["MEMBERS", "PUBLIC"]) {
    for (const content of [
      '<img src="/first.jpg"><p>Text after</p>',
      '<p>Text before</p><img src="/first.jpg">',
      '<p>Text before</p><div data-type="masonry-gallery"><img src="/first.jpg"><img src="/second.jpg"><img src="/third.jpg"></div>',
      '<img src="/first.jpg"><p>Text between</p><img src="/second.jpg">',
    ]) {
      const { repo } = repository({ ...post, visibility, content });
      const result = await metadata(repo);
      assert.equal(result.title, `${post.title} | Koru`);
      assert.equal(result.description, post.excerpt);
      assert.equal(result.alternates.canonical, `/blog/${post.slug}`);
      assert.equal(result.openGraph.url, `/blog/${post.slug}`);
      assert.equal(result.openGraph.type, "article");
      assert.equal(result.openGraph.title, post.title);
      assert.equal(result.openGraph.description, post.excerpt);
      assert.deepEqual(plain(result.openGraph.images), [{ url: "/first.jpg", alt: post.title }]);
      assert.equal(result.twitter.title, post.title);
      assert.equal(result.twitter.description, post.excerpt);
      assert.deepEqual(plain(result.twitter.images), ["/first.jpg"]);
      assert.doesNotMatch(JSON.stringify(result), /second.jpg|third.jpg|SECRET/);
    }
  }
});

test("missing and draft posts expose no metadata or page, regardless of authentication", async () => {
  for (const record of [null, { ...post, status: "DRAFT" }]) {
    for (const session of [null, { user: { id: "member" } }]) {
      const { repo } = repository(record);
      assert.deepEqual(plain(await metadata(repo)), {});
      await assert.rejects(view(repo, session)({ slug: post.slug }), /NOT_FOUND/);
    }
  }
});

test("existing full-body access stays public for public posts and authenticated-only for members posts", async () => {
  for (const [visibility, session] of [["PUBLIC", null], ["MEMBERS", { user: { id: "member" } }]]) {
    const { repo, queries } = repository({ ...post, visibility });
    const html = renderToStaticMarkup(await view(repo, session)({ slug: post.slug }));
    assert.match(html, /SECRET ARTICLE BODY/);
    assert.match(html, /SECRET COMMENT/);
    assert.match(html, /Comentarios/);
    assert.equal(queries[0].where.visibility, session ? undefined : "PUBLIC");
    assert.equal(queries[0].where.status, "PUBLISHED");
  }
});

test("posts without usable images never advertise the homepage collage and HTTPS images remain unchanged", async () => {
  for (const [content, expected] of [
    ["<p>No images</p>", null],
    ['<img src="javascript:alert(1)">', null],
    ['<img src="data:image/png;base64,abc">', null],
    ['<img src="https://example.com/first.jpg">', "https://example.com/first.jpg"],
  ]) {
    const { repo } = repository({ ...post, content });
    const result = await metadata(repo);
    assert.deepEqual(plain(result.openGraph.images), expected ? [{ url: expected, alt: post.title }] : []);
    assert.deepEqual(plain(result.twitter.images), expected ? [expected] : []);
    assert.doesNotMatch(JSON.stringify(result), /koru-share-|branding/);
    if (!expected) {
      const element = await view(repo)({ slug: post.slug });
      const html = renderToStaticMarkup(element);
      assert.doesNotMatch(html, /<img|koru-share-/);
      assert.match(html, /Inicia sesión/);
    }
  }
});

test("Cloudinary previews use a bounded JPEG of the first photo without changing article images", async () => {
  for (const content of [
    '<img src="https://res.cloudinary.com/demo/image/upload/v123/first.png"><p>Text</p><img src="/second.jpg">',
    '<p>Text</p><div data-type="masonry-gallery"><img src="https://res.cloudinary.com/demo/image/upload/v123/first.png"><img src="/second.jpg"></div>',
  ]) {
    const { repo } = repository({ ...post, content });
    const result = await metadata(repo);
    const expected = "https://res.cloudinary.com/demo/image/upload/c_limit,w_1200,h_630,f_jpg,q_70/v123/first.jpg";
    assert.equal(result.openGraph.images[0].url, expected);
    assert.equal(result.twitter.images[0], expected);
    const html = renderToStaticMarkup(await view(repo, { user: { id: "reader" } })({ slug: post.slug }));
    assert.match(html, /src="https:\/\/res.cloudinary.com\/demo\/image\/upload\/v123\/first.png"/);
    assert.doesNotMatch(html, /c_limit|f_jpg/);
  }
});

test("complete publication, visibility and authentication access matrix", async () => {
  for (const status of ["PUBLISHED", "DRAFT"]) {
    for (const visibility of ["PUBLIC", "MEMBERS"]) {
      for (const session of [null, { user: { id: "reader" } }]) {
        const { repo } = repository({ ...post, status, visibility });
        const result = await metadata(repo);

        if (status === "DRAFT") {
          assert.deepEqual(plain(result), {});
          await assert.rejects(view(repo, session)({ slug: post.slug }), /NOT_FOUND/);
          continue;
        }

        assert.equal(result.openGraph.images[0].url, firstShareImage);
        assert.doesNotMatch(JSON.stringify(result), /SECRET|private-id|second.jpg|comment/);

        const element = await view(repo, session)({ slug: post.slug });
        const html = renderToStaticMarkup(element);
        if (visibility === "MEMBERS" && !session) {
          assert.doesNotMatch(html + JSON.stringify(element), /SECRET|private-id|second.jpg|comment/);
          assert.match(html, /Inicia sesión/);
        } else {
          assert.match(html, /SECRET ARTICLE BODY/);
          assert.match(html, /SECRET COMMENT/);
          assert.match(html, /second.jpg/);
        }
      }
    }
  }
});
