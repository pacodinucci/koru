import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function fixture() {
  const state = { textReads: 0, imageReads: 0, pageReads: 0, invalidations: [], blockWrites: [], failRead: false, failWrite: false, failCommit: false, request: 0 };
  let text = [{ key: 'title', draftValue: 'private', publishedValue: 'public' }, { key: 'draft-only', draftValue: 'secret', publishedValue: null }];
  let page = { status: 'PUBLISHED', blocks: [{ data: { cmsLandingDraftOverrides: { title: 'private page' }, cmsLandingPublishedOverrides: { title: 'public page' } } }] };
  let images = [{ key: 'hero', draftUrl: 'secret', draftPublicId: 'draft', publishedUrl: 'public.jpg', publishedPublicId: 'published' }];
  const failWrite = () => { if (state.failWrite) throw new Error('write failed'); };
  const prisma = {
    cmsTextEntry: { findMany: async () => { state.textReads++; if (state.failRead) throw new Error('read failed'); return structuredClone(text); } },
    page: { findUnique: async () => { state.pageReads++; return structuredClone(page); }, upsert: async () => { failWrite(); return { id: 'page' }; } },
    pageBlock: { upsert: async args => { failWrite(); state.blockWrites.push(args); } },
    cmsImageEntry: { findMany: async () => { state.imageReads++; return structuredClone(images); }, upsert: async () => { failWrite(); if (state.failImage) throw new Error('image failed'); } },
    $executeRaw: async () => { failWrite(); },
    $transaction: async work => { const result = await work(prisma); if (state.failCommit) throw new Error('commit failed'); return result; },
  };
  const stored = new Map();
  const modules = {};
  const mocks = {
    'server-only': {},
    'react': { cache: fn => {
      const requests = new Map();
      return (...args) => {
        const key = JSON.stringify([state.request, args]);
        if (!requests.has(key)) requests.set(key, fn(...args));
        return requests.get(key);
      };
    } },
    'next/cache': {
      unstable_cache: (fn, keys, options) => {
        assert.deepEqual(Array.from(options.tags), ['cms-published']);
        assert.equal(options.revalidate, 300);
        return async (...args) => {
          const key = JSON.stringify([keys, args]);
          if (!stored.has(key)) {
            const value = Promise.resolve().then(() => fn(...args));
            stored.set(key, value);
            value.catch(() => stored.delete(key));
          }
          return stored.get(key);
        };
      },
      revalidateTag: (tag, profile) => { state.invalidations.push([tag, profile]); stored.clear(); },
    },
    '@/lib/prisma': { prisma },
    '@prisma/client': { BlockType: { RICH_TEXT: 'RICH_TEXT' }, PageStatus: { DRAFT: 'DRAFT', PUBLISHED: 'PUBLISHED' }, Prisma: { sql: (...args) => args, join: x => x } },
    '@/modules/cms/inserted-text-blocks': { CMS_INSERTED_TEXT_BLOCKS_KEY: 'inserted', CMS_DELETED_TEXT_SLOT_IDS_KEY: 'deleted', getCmsInsertedTextBlocks: () => [] },
    '@/modules/landing/config/landing-sections': { ensureLandingDefaults: x => ({ title: 'default', ...x }), getDefaultLandingTextMap: () => ({ title: 'default' }) },
    '@/modules/auth/server/auth-guards': { requirePermission: async () => {} },
    '@/modules/dashboard/server/cms-pages.repository': { discoverPagesGroupRoutes: async () => { if (state.failDiscover) throw new Error('discovery failed'); return [{ slug: '/page', isDynamic: false }]; } },
    '@/modules/cms/content-page-config': { getCmsImageSlotsBySlug: () => [{ key: 'hero' }] },
    '@/lib/env': { env: { CLOUDINARY_CLOUD_NAME: 'koru' } },
    'zod': { z: new Proxy({}, { get: () => (...args) => schema }) },
  };
  const schema = new Proxy({}, { get: (_, key) => key === 'safeParse' ? data => ({ success: true, data }) : () => schema });
  function load(name) {
    if (modules[name]) return modules[name];
    const path = `../../src/modules/cms/server/${name}.ts`;
    const output = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const loaded = { exports: {} };
    vm.runInNewContext(output, { module: loaded, exports: loaded.exports, require: id => {
      if (id in mocks) return mocks[id];
      if (id.startsWith('@/modules/cms/server/')) return load(id.split('/').at(-1));
      throw new Error(`Unexpected import ${id}`);
    } });
    modules[name] = loaded.exports;
    return loaded.exports;
  }
  return { state, load, nextRequest: () => { state.request++; }, setText: value => { text = value; }, setPage: value => { page = value; }, setImages: value => { images = value; } };
}

test('published text and images reuse concurrent/home-layout reads, with independent slug keys', async () => {
  const { load, state, nextRequest } = fixture();
  const text = load('cms-text.repository'), image = load('cms-image.repository');
  const [a, b] = await Promise.all([text.getCmsPublishedTextMap(), text.getCmsPublishedTextMapBySlug('/')]);
  assert.equal(a.title, 'public'); assert.deepEqual(a, b); assert.equal(state.textReads, 1);
  nextRequest(); await text.getCmsPublishedTextMap(); assert.equal(state.textReads, 1);
  await Promise.all([image.getCmsPublishedImageMapBySlug('/'), image.getCmsPublishedImageMapBySlug('/')]);
  assert.equal(state.imageReads, 1);
  await image.getCmsPublishedImageMapBySlug('/other'); assert.equal(state.imageReads, 2);
  await Promise.all([text.getCmsPublishedTextMapBySlug('/page'), text.getCmsPublishedTextMapBySlug('/page')]);
  assert.equal(state.pageReads, 1); assert.equal(state.textReads, 1);
});

test('draft text, page overrides and image values never enter published reads; previews stay live', async () => {
  const { load, setPage, state } = fixture();
  const text = load('cms-text.repository'), image = load('cms-image.repository');
  assert.equal((await text.getCmsPublishedTextMap())['draft-only'], undefined);
  assert.equal((await text.getCmsDraftTextMap())['draft-only'], 'secret');
  await text.getCmsDraftTextMap(); assert.equal(state.textReads, 3);
  const publicImage = (await image.getCmsPublishedImageMapBySlug('/')).hero;
  assert.equal(publicImage.url, 'public.jpg'); assert.equal(publicImage.cropX, 50);
  assert.equal(publicImage.zoom, 1); assert.equal(publicImage.fitMode, 'COVER');
  assert.equal((await image.getCmsDraftImageMapBySlug('/')).hero.url, 'secret');
  setPage({ status: 'DRAFT', blocks: [{ data: { cmsLandingDraftOverrides: { title: 'secret page' } } }] });
  assert.equal((await text.getCmsPublishedTextMapBySlug('/draft')).title, 'public');
  assert.equal((await text.getCmsDraftTextMapBySlug('/draft')).title, 'secret page');
  setPage({ status: 'PUBLISHED', blocks: [{ data: { cmsLandingDraftOverrides: { title: 'unpublished edit' } } }] });
  assert.equal((await text.getCmsPublishedTextMapBySlug('/legacy')).title, 'public');
});

test('successful publication immediately expires public reads; draft saves and failures do not invalidate', async () => {
  const { load, state, setText, setPage, setImages, nextRequest } = fixture();
  const text = load('cms-text.repository'), image = load('cms-image.repository');
  await text.getCmsPublishedTextMap();
  await text.getCmsPublishedTextMapBySlug('/page');
  await image.getCmsPublishedImageMapBySlug('/');
  setPage({ status: 'PUBLISHED', blocks: [{ data: { cmsLandingPublishedOverrides: { title: 'fresh page' } } }] });
  setImages([{ key: 'hero', publishedUrl: 'fresh.jpg', publishedPublicId: 'fresh' }]);
  setText([{ key: 'title', publishedValue: 'fresh', draftValue: 'private' }]);
  await text.saveCmsDraftTextMap({ title: 'draft' });
  assert.equal((await text.getCmsPublishedTextMap()).title, 'public');
  assert.equal(state.invalidations.length, 0);
  state.failWrite = true;
  await assert.rejects(text.publishCmsTextMap({ title: 'failed' }), /write failed/);
  assert.equal(state.invalidations.length, 0);
  state.failWrite = false;
  await text.publishCmsTextMap({ title: 'fresh' });
  nextRequest();
  assert.equal((await text.getCmsPublishedTextMapBySlug('/page')).title, 'fresh page');
  assert.equal((await image.getCmsPublishedImageMapBySlug('/')).hero.url, 'fresh.jpg');
  assert.equal((await text.getCmsPublishedTextMap()).title, 'fresh');
  assert.equal(state.invalidations[0][0], 'cms-published');
  assert.equal(state.invalidations[0][1].expire, 0);
  await text.publishCmsPageTextMap('/page', { title: 'page' });
  await image.publishCmsImageMap('/', {});
  await image.publishAllCmsDraftImages();
  assert.equal(state.invalidations.length, 4);
  state.failCommit = true;
  await assert.rejects(text.publishCmsPageTextMap('/page', {}), /commit failed/);
  await assert.rejects(image.publishCmsImageMap('/', {}), /commit failed/);
  assert.equal(state.invalidations.length, 4);
});

test('combined text/image publication invalidates only after commit, never within transaction helpers', async () => {
  const { load, state } = fixture();
  const action = load('cms-image.actions');
  const images = { hero: { url: 'published.jpg', publicId: 'published' } };
  state.failCommit = true;
  await assert.rejects(action.publishCmsPageContentAction('/', {}, images), /commit failed/);
  assert.equal(state.invalidations.length, 0);
  state.failCommit = false; state.failImage = true;
  await assert.rejects(action.publishCmsPageContentAction('/', {}, images), /image failed/);
  assert.equal(state.invalidations.length, 0);
  state.failImage = false;
  const result = await action.publishCmsPageContentAction('/', {}, images);
  assert.equal(result.ok, true); assert.equal(result.message, 'Contenido publicado.');
  assert.equal(state.invalidations.length, 1);
});

test('draft page and image saves preserve public values without invalidation; page publication uses published base', async () => {
  const { load, state } = fixture();
  const text = load('cms-text.repository'), image = load('cms-image.repository');
  await text.saveCmsPageDraftTextMap('/page', { title: 'private' });
  await image.saveCmsDraftImage('/', 'hero', { url: 'draft.jpg', publicId: 'draft' });
  assert.equal(state.invalidations.length, 0);
  assert.equal((await text.getCmsPublishedTextMapBySlug('/page')).title, 'public page');
  assert.equal((await image.getCmsPublishedImageMapBySlug('/')).hero.url, 'public.jpg');
  await text.publishCmsPageTextMap('/page', { title: 'private' });
  const published = state.blockWrites.at(-1).update.data;
  assert.equal(published.cmsLandingPublishedOverrides.title, 'private');
  assert.equal(published.cmsLandingDraftOverrides.title, 'private');
});

test('global publication invalidates committed stages even if later route discovery fails', async () => {
  const { load, state } = fixture();
  const action = load('cms-text.actions');
  state.failDiscover = true;
  await assert.rejects(action.publishAllCmsPagesAction(), /discovery failed/);
  assert.equal(state.invalidations.length, 2);
  state.failDiscover = false;
  const result = await action.publishAllCmsPagesAction();
  assert.equal(result.ok, true); assert.equal(result.message, 'Global publish completed.');
  assert.equal(state.invalidations.length, 5);
});

test('failed public reads recover instead of caching errors or defaults', async () => {
  const { load, state, nextRequest } = fixture();
  const text = load('cms-text.repository');
  state.failRead = true;
  await assert.rejects(text.getCmsPublishedTextMap(), /read failed/);
  state.failRead = false;
  nextRequest();
  assert.equal((await text.getCmsPublishedTextMap()).title, 'public');
  assert.equal(state.textReads, 2);
});
