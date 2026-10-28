import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
function load(path, mocks) {
  const loaded = { exports: {} };
  const output = ts.transpileModule(source(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(output, { module: loaded, exports: loaded.exports, AbortController, require: id => {
    if (!(id in mocks)) throw new Error(`Unexpected import ${id}`);
    return mocks[id];
  }, fetch: (...args) => mocks.fetch(...args) });
  return loaded.exports;
}
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };

test('public and blog chrome render without server authentication, retaining sign-out and Suspense', async () => {
  const signOut = () => {};
  const mocks = {
    'react/jsx-runtime': jsx, react: { Suspense: 'suspense' },
    '@/modules/auth/server/auth-actions': { signOutAction: signOut },
    '@/modules/auth/server/auth-guards': { getAuthenticatedUser: () => { throw new Error('public chrome must not authenticate'); } },
    '@/modules/cms/server/cms-text.repository': { getCmsPublishedTextMap: async () => ({ title: 'published' }) },
    '@/modules/cms/server/cms-image.repository': { getCmsPublishedImageMapBySlug: async () => ({}) },
    '@/modules/landing/config/landing-sections': { getDefaultLandingTextMap: () => ({}) },
    '@/modules/landing/views/landing-page-layout': { LandingPageLayout: 'layout' },
  };
  for (const path of ['src/app/(pages)/layout.tsx', 'src/app/blog/layout.tsx']) {
    let tree = await load(path, mocks).default({ children: 'content' });
    if (tree.type === 'suspense') tree = tree.props.children;
    assert.equal(tree.type, 'layout'); assert.equal(tree.props.children, 'content');
    assert.equal(tree.props.user, undefined); assert.equal(tree.props.onSignOut, signOut);
  }
  const layout = source('src/modules/landing/views/landing-page-layout.tsx');
  assert.match(layout, /<Suspense/);
  assert.match(layout, /cmsPreview/);
  assert.match(layout, /PublicNavigationSession/);
});

test('layout query previews suppress chrome while editor bindings and page children are preserved', () => {
  let query = '';
  const { LandingPageLayout } = load('src/modules/landing/views/landing-page-layout.tsx', {
    'react/jsx-runtime': jsx,
    react: { Suspense: 'suspense', useState: value => [value, () => {}], useRef: value => ({ current: value }), useEffect: () => {} },
    'next/image': { default: 'image' },
    'next/navigation': { usePathname: () => '/page', useSearchParams: () => new URLSearchParams(query) },
    '@/modules/landing/components/public-navigation-session': { PublicNavigationSession: 'navigation' },
    '@/modules/cms/site-chrome-content': { getSiteChromeNavLinks: () => [] },
    '@/modules/landing/components/site-footer': { SiteFooter: 'footer' },
    '@/modules/landing/config/landing-sections': { ensureLandingDefaults: x => x, landingLayoutContainerRules: { footer: { defaultArrangement: 'block', allowedArrangements: ['block'] } } },
    '@/modules/landing/types/landing-text': { createResponsiveScopedTextMap: x => x },
  });
  function flatten(tree) {
    if (Array.isArray(tree)) return tree.flatMap(flatten);
    if (!tree || typeof tree !== 'object') return [tree];
    return [tree, ...flatten(tree.props?.children)];
  }
  const props = { textMap: { title: 'draft preview' }, children: 'page content', previewMode: true, selectedContentSlotId: 'title', onSelectContentSlot: () => {} };
  let wrapper = LandingPageLayout(props);
  assert.equal(wrapper.type, 'suspense'); assert.equal(wrapper.props.fallback, 'page content');
  let tree = wrapper.props.children.type(wrapper.props.children.props);
  const navigation = flatten(tree).find(node => node?.type === 'navigation');
  assert.equal(navigation.props.previewMode, true); assert.equal(navigation.props.textMap.title, 'draft preview');
  assert.equal(navigation.props.onSelectContentSlot, props.onSelectContentSlot);
  query = 'cmsPreview=1'; wrapper = LandingPageLayout(props); tree = wrapper.props.children.type(wrapper.props.children.props);
  assert.equal(flatten(tree).some(node => node?.type === 'navigation' || node?.type === 'footer'), false);
  assert.equal(flatten(tree).includes('page content'), true);
});

test('navigation endpoint is private/no-store and returns only each requesting identity, never CMS', async () => {
  let actor = null, calls = 0;
  const route = load('src/app/api/public/navigation/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => ({ body, status: init.status ?? 200, headers: init.headers }) } },
    '@/modules/auth/server/auth-guards': { getAuthenticatedUser: async () => { calls++; if (actor instanceof Error) throw actor; return actor; } },
  });
  assert.equal(route.dynamic, 'force-dynamic');
  let response = await route.GET();
  assert.equal(response.status, 200); assert.equal(response.body.user, null);
  assert.match(response.headers['Cache-Control'], /private/); assert.match(response.headers['Cache-Control'], /no-store/);
  assert.equal(response.headers.Vary, 'Cookie');
  actor = { id: 'private-id', name: ' Ana ', email: 'ana@example.test', permissionKeys: ['dashboard.access', 'content.manage'] };
  response = await route.GET();
  assert.deepEqual(JSON.parse(JSON.stringify(response.body)), { user: { name: 'Ana', email: 'ana@example.test', canAccessDashboard: true } });
  actor = { name: '', email: 'other@example.test', permissionKeys: [] };
  response = await route.GET(); assert.equal(response.body.user.name, 'Usuario'); assert.equal(response.body.user.canAccessDashboard, false);
  actor = null; assert.equal((await route.GET()).body.user, null);
  actor = new Error('auth unavailable'); response = await route.GET();
  assert.equal(response.status, 503); assert.equal(response.body.user, null); assert.match(response.headers['Cache-Control'], /no-store/);
  assert.equal(calls, 5);
});

function navigationFixture({ user, previewMode, reject = false } = {}) {
  let value = null, effect, cleanup;
  const requests = [];
  const props = { user, previewMode, links: [], onSignOut: () => {} };
  const { PublicNavigationSession } = load('src/modules/landing/components/public-navigation-session.tsx', {
    'react/jsx-runtime': jsx,
    react: { useState: () => [value, next => { value = next; }], useEffect: fn => { effect = fn; } },
    '@/modules/landing/components/landing-nav': { LandingNav: 'nav' },
    fetch: async (url, options) => { requests.push([url, options]); if (reject) throw new Error('offline'); return { ok: true, json: async () => ({ user: { name: 'Ana', email: 'ana@example.test', canAccessDashboard: true } }) }; },
  });
  return { render: () => PublicNavigationSession(props), start: () => { cleanup = effect(); }, stop: () => cleanup?.(), requests };
}

test('client loads navigation once with private fetch, retains controls, and does not poll or leak across mounts', async () => {
  const first = navigationFixture();
  assert.equal(first.render().props.user, null);
  first.start(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(first.render().props.user.name, 'Ana');
  assert.equal(first.requests.length, 1);
  assert.equal(first.requests[0][0], '/api/public/navigation');
  assert.equal(first.requests[0][1].cache, 'no-store'); assert.equal(first.requests[0][1].credentials, 'same-origin');
  first.stop();
  const second = navigationFixture({ reject: true });
  assert.equal(second.render().props.user, null); second.start();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(second.render().props.user, null); assert.equal(second.requests.length, 1);
  const cancelled = navigationFixture(); cancelled.render(); cancelled.start(); cancelled.stop();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(cancelled.render().props.user, null);
});

test('editor previews and explicit navigation identity retain existing props without identity requests', () => {
  for (const options of [{ previewMode: true }, { user: { name: 'Editor', email: 'editor@example.test', canAccessDashboard: true } }, { user: null }]) {
    const fixture = navigationFixture(options), tree = fixture.render(); fixture.start();
    assert.equal(tree.props.previewMode, options.previewMode);
    assert.equal(tree.props.user, options.user ?? null); assert.equal(typeof tree.props.onSignOut, 'function');
    assert.equal(fixture.requests.length, 0);
  }
});
