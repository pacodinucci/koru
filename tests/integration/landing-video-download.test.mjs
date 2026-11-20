import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { NextResponse } from "next/server.js";
import ts from "typescript";

const originalUrl = "https://res.cloudinary.com/trsbzk8f/video/upload/v1789744125/koru/documentos/landing-video.mp4";
const silentUrl = originalUrl.replace("/video/upload/", "/video/upload/ac_none/");

function loadRoute(document) {
  const effects = { lookups: [], fetches: [] };
  const module = { exports: {} };
  const source = readFileSync(new URL("../../src/app/documentos/[slug]/route.ts", import.meta.url), "utf8");
  const mocks = {
    "next/server": { NextResponse },
    "@/modules/documents/server/document.repository": {
      getPublishedDocumentBySlug: async (slug) => {
        effects.lookups.push(slug);
        return document;
      },
    },
    "@/modules/documents/server/cloudinary-documents": {
      getDocumentDownloadUrl: () => "https://example.com/signed-document.pdf",
    },
  };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    module, exports: module.exports, console,
    require(id) {
      assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency: ${id}`);
      return mocks[id];
    },
    fetch: async (url) => {
      effects.fetches.push(url);
      return new Response("pdf-content");
    },
  });
  return {
    effects,
    get: (slug) => module.exports.GET(new Request(`https://koru.example/documentos/${slug}`), { params: Promise.resolve({ slug }) }),
  };
}

const video = { cloudinaryUrl: originalUrl, mimeType: "video/mp4", originalFileName: "loopkoru2.mp4" };

test("landing video redirects to the silent Cloudinary derivative without changing the original record", async () => {
  const document = { ...video };
  const app = loadRoute(document);
  const response = await app.get("landing-video");
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), silentUrl);
  assert.equal(await response.text(), "");
  assert.deepEqual(document, video);
  assert.deepEqual(app.effects, { lookups: ["landing-video"], fetches: [] });
});

test("other videos preserve their original URL and audio", async () => {
  const app = loadRoute({ ...video });
  const response = await app.get("school-event");
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), originalUrl);
  assert.equal(await response.text(), "");
  assert.deepEqual(app.effects, { lookups: ["school-event"], fetches: [] });
});

test("PDF downloads preserve their content and headers", async () => {
  const app = loadRoute({ mimeType: "application/pdf", originalFileName: "handbook.pdf", cloudinaryPublicId: "handbook" });
  const response = await app.get("handbook");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.equal(response.headers.get("content-disposition"), 'attachment; filename="handbook.pdf"');
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(await response.text(), "pdf-content");
  assert.deepEqual(app.effects, { lookups: ["handbook"], fetches: ["https://example.com/signed-document.pdf"] });
});

test("an unpublished or missing landing video still returns 404", async () => {
  const app = loadRoute(null);
  const response = await app.get("landing-video");
  assert.equal(response.status, 404);
  assert.equal(await response.text(), "Documento no encontrado.");
  assert.deepEqual(app.effects, { lookups: ["landing-video"], fetches: [] });
});
