// Actual public layout and footer in Chromium; navigation/session and Next routing are isolated.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium } from '../../.tmp-admissions-e2e/browser/node_modules/playwright/index.mjs';
const bundle = await build({
  stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {LandingPageLayout} from './src/modules/landing/views/landing-page-layout';import {getDefaultLandingTextMap} from './src/modules/landing/config/landing-sections';const root=createRoot(document.getElementById('root'));window.mount=(height=180,preview=false,hide=false)=>root.render(React.createElement(LandingPageLayout,{textMap:getDefaultLandingTextMap(),previewMode:preview,hideChrome:hide},React.createElement('main',{'data-test-content':'',style:{minHeight:height,boxSizing:'border-box',padding:'32px'}},React.createElement('h1',null,'Gracias por acercarse a Koru'),React.createElement('p',null,'Recibimos su cuestionario inicial.'))));`, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, format: 'iife', platform: 'browser', define: { 'process.env.NODE_ENV': '"test"' },
  plugins: [{ name: 'isolated-public-runtime', setup(builder) {
    builder.onResolve({ filter: /^next\/(navigation|image|link)$|public-navigation-session$/ }, args => ({ path: args.path, namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ resolveDir: process.cwd(), loader: 'js', contents:
      args.path.endsWith('navigation') ? `export const usePathname=()=>'/admisiones/cuestionario-inicial';export const useSearchParams=()=>new URLSearchParams();` :
      args.path.endsWith('public-navigation-session') ? `import React from 'react';export const PublicNavigationSession=({heightPx})=>React.createElement('nav',{style:{position:'fixed',height:heightPx,top:0},'aria-label':'Fixture navigation'},'Koru');` :
      args.path.endsWith('image') ? `import React from 'react';export default function Image({fill,priority,unoptimized,...props}){return React.createElement('img',props);}` : `import React from 'react';export default function Link(props){return React.createElement('a',props);}`,
    }));
  } }],
});
const css = (await postcss([tailwind()]).process(await readFile('src/app/globals.css', 'utf8'), { from: 'src/app/globals.css' })).css;
const server = createServer((req, res) => {
  if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles[0].text); }
  else if (req.url === '/style.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); }
  else { res.setHeader('Content-Type', 'text/html'); res.end('<html><head><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.request().url().startsWith(`http://127.0.0.1:${server.address().port}`) ? route.continue() : route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  for (const [width, height] of [[1915, 950], [1280, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    for (const contentHeight of [180, 1600]) {
      await page.evaluate(value => window.mount(value), contentHeight);
      const footer = page.locator('[data-preview-layout-section-id="layout-footer"]'); await footer.waitFor();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const geometry = await page.evaluate(() => {
        const footer = document.querySelector('[data-preview-layout-section-id="layout-footer"]');
        const content = document.querySelector('[data-test-content]');
        return { footerTop: footer.getBoundingClientRect().top, footerBottom: footer.getBoundingClientRect().bottom, contentBottom: content.getBoundingClientRect().bottom, viewport: innerHeight, pageHeight: document.documentElement.scrollHeight, scrollWidth: document.documentElement.scrollWidth, width: innerWidth, position: getComputedStyle(footer).position };
      });
      assert.ok(geometry.footerBottom >= geometry.viewport - 1, `footer must reach viewport bottom: ${JSON.stringify({ width, contentHeight, ...geometry })}`);
      assert.ok(geometry.footerTop >= geometry.contentBottom - 1, 'footer must never overlay page content');
      assert.ok(geometry.pageHeight <= Math.ceil(geometry.footerBottom) + 1, 'no empty page area after footer');
      assert.equal(geometry.position, 'static', 'footer stays in normal document flow');
      assert.ok(geometry.scrollWidth <= geometry.width, 'no horizontal overflow');
      if (contentHeight === 1600) assert.ok(geometry.footerTop >= 1600, 'long pages push footer after their full content');
      await mkdir('.tmp-appointments-e2e/evidence', { recursive: true });
      if (contentHeight === 180) await page.screenshot({ path: `.tmp-appointments-e2e/evidence/public-footer-${width}.png`, fullPage: true });
    }
  }
  await page.evaluate(() => window.mount(180, true));
  await page.getByRole('button', { name: 'Seleccionar footer del layout' }).count();
  assert.equal(await page.locator('[data-preview-layout-section-id="layout-footer"]').count(), 1, 'CMS preview retains footer');
  await page.evaluate(() => window.mount(180, false, true));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  assert.equal(await page.locator('[data-preview-layout-section-id="layout-footer"]').count(), 0, 'hidden chrome remains hidden');
  assert.deepEqual(errors, []);
  console.log('PASS public layout Chromium: short-page footer reaches viewport bottom at 1915/1280/390 widths; long content pushes footer without overlap, no bottom gap or horizontal overflow; CMS preview and hidden chrome preserved. Actual layout/footer, isolated session/routing.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
