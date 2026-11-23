import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
const require = createRequire(import.meta.url);
export function harness(fetcher) {
  const cache = new Map(); const states = new Map(); const effects = [];
  let current; let index; let tree; let root;
  const hooks = { ...React,
    useState(initial) { const key = `${current}:${index++}`; if (!states.has(key)) states.set(key, typeof initial === 'function' ? initial() : initial); return [states.get(key), value => states.set(key, typeof value === 'function' ? value(states.get(key)) : value)]; },
    useRef(initial) { const [ref] = hooks.useState(() => ({ current: initial })); return ref; },
    useEffect(fn, deps) { const key = `${current}:effect:${index++}`; const old = states.get(key); if (!old || deps.some((x, i) => x !== old[i])) { states.set(key, deps); effects.push(fn); } },
  };
  function load(file) {
    file = file.replaceAll('\\', '/'); if (!/\.tsx?$/.test(file)) file += existsSync(`${file}.ts`) ? '.ts' : '.tsx';
    if (cache.has(file)) return cache.get(file);
    const mod = { exports: {} }; cache.set(file, mod.exports);
    vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, {
      module: mod, exports: mod.exports, fetch: fetcher, AbortController, Response, Request, URL, URLSearchParams, Date, Intl, Error, console,
      require(id) {
        if (id === 'react') return hooks;
        if (id === 'react/jsx-runtime') return require(id);
        if (id === 'next/navigation') return { useSearchParams: () => new URLSearchParams() };
        if (id === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
        if (id === 'lucide-react') return new Proxy({}, { get: () => () => null });
        if (id === '@/components/ui/button') return { Button: ({ children, ...props }) => React.createElement('button', props, children) };
        if (id === '@/components/ui/responsive-dialog') return new Proxy({}, { get: (_, name) => ({ children, open }) => name === 'ResponsiveDialog' && !open ? null : React.createElement('div', null, children) });
        if (id.startsWith('@/')) return load(`src/${id.slice(2)}`);
        if (id.startsWith('.')) return load(path.join(path.dirname(file), id));
        return require(id);
      },
    });
    cache.set(file, mod.exports); return mod.exports;
  }
  function expand(element, key = 'root') {
    if (!React.isValidElement(element)) return Array.isArray(element) ? element.map((x, i) => expand(x, `${key}.${i}`)) : element;
    if (typeof element.type === 'function') { current = key; index = 0; return expand(element.type(element.props), `${key}.render`); }
    return { type: element.type, props: element.props, children: React.Children.toArray(element.props.children).map((x, i) => expand(x, `${key}.${i}`)) };
  }
  const nodes = (n = tree) => !n || typeof n !== 'object' ? [] : Array.isArray(n) ? n.flatMap(x => nodes(x)) : [n, ...n.children.flatMap(x => nodes(x))];
  const text = (n = tree) => n == null || typeof n === 'boolean' ? '' : typeof n !== 'object' ? String(n) : Array.isArray(n) ? n.map(x => text(x)).join('') : n.children.map(x => text(x)).join('');
  const api = {
    load, nodes, text,
    mount(file, name, props) { root = React.createElement(load(file)[name], props); return api.render(); },
    render() { tree = expand(root); for (const effect of effects.splice(0)) effect(); return api; },
    async flush() { await new Promise(setImmediate); api.render(); await new Promise(setImmediate); api.render(); return api; },
    find(predicate) { return nodes().find(predicate); },
    button(label) { return nodes().find(n => n.type === 'button' && text(n) === label); },
    async click(label) { const b = api.button(label); assert.ok(b, `button ${label}`); assert.ok(!b.props.disabled, `button ${label} enabled`); await b.props.onClick?.({ preventDefault() {} }); api.render(); return api.flush(); },
    change(label, value) { const n = nodes().find(n => n.props?.['aria-label'] === label); assert.ok(n, `field ${label}`); n.props.onChange({ target: { value } }); api.render(); },
  };
  return api;
}
export const invitation = {
  id: 'invitation', status: 'PENDING', recipientName: 'Ana', recipientEmail: 'ana@example.test',
  expiresAt: '2099-12-03T12:00:00.000Z', sentAt: '2099-12-01T12:00:00.000Z', durationMinutes: 30,
  mode: 'IN_PERSON', location: 'Koru', message: null, confirmationEmailFailed: false,
  slots: [{ id: 'slot', startsAt: '2099-12-05T16:00:00.000Z', endsAt: '2099-12-05T16:30:00.000Z' }], selectedSlotId: null,
};
