import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path) {
  const source = readFileSync(new URL(`../../src/${path}.tsx`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, {
    module: mod, exports: mod.exports,
    require(id) {
      if (id === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
      if (id === "next/image") return { __esModule: true, default: ({ priority, ...props }) => {
        void priority;
        return React.createElement("img", props);
      } };
      if (id === "@/components/fern-shape") return load("components/fern-shape");
      if (id === "@/lib/utils") return { cn: (...values) => values.filter(Boolean).join(" ") };
      return require(id);
    },
  });
  return mod.exports;
}
function render(firstName = "Clara", lastName = "García", groupName = "Exploradores") {
  const { KoruIdCard } = load("modules/family-dashboard/components/koru-id-card");
  return renderToStaticMarkup(React.createElement(KoruIdCard, { studentId: "student-123", firstName, lastName, groupName }));
}

test("the entire credential links to the selected child's record with keyboard focus", () => {
  const html = render();
  assert.match(html, /<a[^>]*href="\/family-dashboard\/expediente#alumno-student-123"/);
  assert.match(html, /aria-label="Ver expediente de Clara García"/);
  assert.match(html, /focus-visible:ring-2/);
  const page = readFileSync(new URL("../../src/app/(family-dashboard)/family-dashboard/expediente/page.tsx", import.meta.url), "utf8");
  assert.match(page, /id=\{`alumno-\$\{student.id\}`\}/);
  const portal = readFileSync(new URL("../../src/modules/family-dashboard/views/family-student-onboarding.tsx", import.meta.url), "utf8");
  assert.match(portal, /<KoruIdCard studentId=\{student.id\}/);
});

test("the credential has hover lift, a light sweep and press feedback with reduced-motion support", () => {
  const html = render();
  assert.match(html, /motion-safe:hover:-translate-y-1/);
  assert.match(html, /motion-safe:hover:-rotate-1/);
  assert.match(html, /motion-safe:active:scale-\[0\.97\]/);
  assert.match(html, /active:shadow-sm/);
  assert.match(html, /motion-safe:group-hover:translate-x-\[350%\]/);
  assert.match(html, /pointer-events-none absolute inset-y-0/);
  assert.match(html, /motion-reduce:transition-none/);
  assert.match(html, /href="\/family-dashboard\/expediente#alumno-student-123"/);
});

test("Koru ID shows the white brand logo and the student's name and group", () => {
  const html = render();
  assert.match(html, /src="\/branding\/koru-logo-white.png"/);
  assert.match(html, /alt="Koru"/);
  assert.match(html, /Clara García/);
  assert.match(html, /Exploradores/);
  assert.match(html, /Koru ID/);
});

test("Koru ID uses a neutral avatar instead of a student's photo", () => {
  const html = render();
  assert.match(html, /aria-label="Avatar del alumno"/);
  assert.equal((html.match(/<img\b/g) ?? []).length, 1);
});

test("the white panel contains fewer, scattered decorative ferns using only Koru colors", () => {
  const html = render();
  assert.match(html, /bg-white/);
  assert.equal((html.match(/viewBox="0 0 175 225"/g) ?? []).length, 9);
  assert.doesNotMatch(html, /grid-cols-4|grid-rows-7/);
  assert.match(html, /left:8%;top:5%/);
  assert.match(html, /left:72%;top:84%/);
  for (const token of ["brand-500", "complement-700", "orange-500"]) {
    assert.match(html, new RegExp(`fill="var\\(--${token}\\)"`));
  }
  assert.match(html, /aria-hidden="true"/);
});

test("credentials have a compact maximum width and retain their proportions", () => {
  assert.match(render(), /w-full max-w-\[360px\]/);
  assert.match(render(), /min-h-\[57cqw\]/);
  const source = readFileSync(new URL("../../src/modules/family-dashboard/views/family-student-onboarding.tsx", import.meta.url), "utf8");
  assert.match(source, /flex flex-wrap items-start gap-5/);
  assert.match(source, /w-full max-w-\[360px\] space-y-2/);
});

test("names remain full text, including long names and escaped characters", () => {
  const html = render("María Josefina de los Ángeles", "Pérez & López", "Grupo <A>");
  assert.match(html, /María Josefina de los Ángeles Pérez &amp; López/);
  assert.match(html, /Grupo &lt;A&gt;/);
  assert.doesNotMatch(html, /truncate|line-clamp/);
});

test("family portal keeps record status feedback and address actions alongside the credential", () => {
  const source = readFileSync(new URL("../../src/modules/family-dashboard/views/family-student-onboarding.tsx", import.meta.url), "utf8");
  assert.match(source, /<KoruIdCard/);
  assert.match(source, /statusLabels\[student.recordStatus\]/);
  assert.match(source, /student.recordStatus === "NEEDS_CHANGES" \? "destructive" : "secondary"/);
  assert.match(source, /Editar domicilio/);
  assert.match(source, /Agregar domicilio/);
  assert.match(source, /\{dashboardContent\}/);
});
