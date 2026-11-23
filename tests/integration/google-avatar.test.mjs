import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { google } from "@better-auth/core/social-providers";

const require = createRequire(import.meta.url);
const photo = "https://lh3.googleusercontent.com/a/profile-photo";
function load(path, mocks = {}) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(output, { module: mod, exports: mod.exports, process, require(id) {
    if (id in mocks) return mocks[id];
    if (id === "react" || id === "react/jsx-runtime" || id === "@prisma/client") return require(id);
    throw new Error(`Unexpected import: ${id}`);
  } });
  return mod.exports;
}

test("Google supplies the profile photo and keeps profiles without a photo valid", async () => {
  const provider = google({ clientId: "test", clientSecret: "test" });
  for (const image of [photo, undefined]) {
    const payload = { sub: "google-user", name: "Test User", email: "test@example.com", email_verified: true, picture: image };
    const idToken = `e30.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;
    const result = await provider.getUserInfo({ idToken });
    assert.equal(result.user.image, image);
    assert.equal(result.user.email, payload.email);
    assert.equal(result.user.name, payload.name);
  }
});

function guardsHarness(image) {
  const selects = [];
  const record = { id: "user-1", name: "Test User", email: "test@example.com", image, role: "PARENT", familyId: "family-1", accessRoleId: null, accessRole: null };
  const guards = load("modules/auth/server/auth-guards.ts", {
    "server-only": {},
    react: { cache: (fn) => fn },
    "next/headers": { headers: async () => ({}), cookies: async () => ({ get: () => undefined }) },
    "next/navigation": { redirect: () => { throw new Error("Unexpected redirect"); } },
    "@/lib/auth": { auth: { api: { getSession: async () => ({ user: record }) } } },
    "@/lib/prisma": { prisma: { user: { findUnique: async ({ select }) => {
      selects.push(select);
      return Object.fromEntries(Object.entries(record).filter(([key]) => select[key]));
    } } } },
    "@/modules/calendar/lib/calendar-access": { isInternalCalendarRole: () => false },
    "@/modules/auth/permissions/permission-catalog": { legacyRolePermissions: { PARENT: ["family.view"] } },
    "@/modules/auth/roles": { isAdminRole: () => false },
  });
  return { guards, selects };
}

test("authenticated identity preserves the photo without changing permissions or family", async () => {
  for (const image of [photo, null]) {
    const { guards, selects } = guardsHarness(image);
    const user = await guards.getAuthenticatedUser();
    assert.equal(user.image, image);
    assert.equal(selects[0].image, true);
    assert.equal(user.familyId, "family-1");
    assert.deepEqual([...user.permissionKeys], ["family.view"]);
    assert.equal(user.email, "test@example.com");
  }
});

test("public navigation returns the photo privately and preserves anonymous navigation", async () => {
  for (const user of [{ name: "Test User", email: "test@example.com", image: photo, permissionKeys: ["dashboard.access"] }, null]) {
    const { GET } = load("app/api/public/navigation/route.ts", {
      "next/server": { NextResponse: { json: (body, options) => ({ body, ...options }) } },
      "@/modules/auth/server/auth-guards": { getAuthenticatedUser: async () => user },
    });
    const response = await GET();
    assert.equal(response.headers["Cache-Control"], "private, no-store, max-age=0");
    assert.equal(response.headers.Vary, "Cookie");
    if (user) {
      assert.equal(response.body.user.image, photo);
      assert.equal(response.body.user.canAccessDashboard, true);
      assert.equal(response.body.user.email, user.email);
    } else assert.equal(response.body.user, null);
  }
});

test("dashboard layouts provide the viewer photo without exposing session tokens", async () => {
  const Provider = () => null;
  const viewer = { image: photo };
  for (const path of ["app/(dashboard)/dashboard/layout.tsx", "app/(family-dashboard)/family-dashboard/layout.tsx"]) {
    const { default: Layout } = load(path, {
      "@/components/current-user-avatar": { CurrentUserAvatarProvider: Provider },
      "@/modules/auth/server/auth-guards": { requireDashboardUser: async () => viewer, getAuthenticatedUser: async () => viewer },
      "next/headers": { headers: async () => ({}) },
      "next/navigation": { redirect() { throw new Error("Unexpected redirect"); } },
      "@/lib/auth": { auth: { api: { getSession: async () => ({ user: viewer, session: { token: "private-token" } }) } } },
    });
    const tree = await Layout({ children: "content" });
    assert.equal(tree.props.children.type, Provider);
    assert.equal(tree.props.children.props.image, photo);
    assert.equal(tree.props.children.props.children, "content");
    assert.deepEqual(Object.keys(tree.props.children.props).sort(), ["children", "image"]);
  }
});

test("every navigation avatar retains its fallback next to the photo", () => {
  for (const [path, imageComponent, count] of [
    ["modules/landing/components/landing-nav.tsx", "AvatarImage", 4],
    ["modules/dashboard/components/dashboard-shell.tsx", "CurrentUserAvatarImage", 1],
    ["modules/dashboard/components/dashboard-shell-legacy.tsx", "CurrentUserAvatarImage", 1],
    ["modules/family-dashboard/components/family-sidebar.tsx", "CurrentUserAvatarImage", 2],
  ]) {
    const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), "utf8");
    const avatars = [...source.matchAll(/<Avatar\b[^>]*>([\s\S]*?)<\/Avatar>/g)];
    assert.equal(avatars.length, count, path);
    for (const [, body] of avatars) {
      assert.match(body, new RegExp(`<${imageComponent}\\b`), path);
      assert.match(body, /<AvatarFallback[\s>]/, path);
    }
  }
});

test("dashboard avatar inherits its photo and renders no image when absent", () => {
  const { CurrentUserAvatarProvider, CurrentUserAvatarImage } = load("components/current-user-avatar.tsx", {
    "@/components/ui/avatar": { AvatarImage: (props) => React.createElement("img", props) },
  });
  for (const image of [photo, null]) {
    const html = renderToStaticMarkup(React.createElement(CurrentUserAvatarProvider, { image },
      React.createElement(CurrentUserAvatarImage, { alt: "Test User" }),
    ));
    if (image) {
      assert.match(html, /src="https:\/\/lh3.googleusercontent.com\/a\/profile-photo"/);
      assert.match(html, /alt="Test User"/);
    } else assert.doesNotMatch(html, /<img/);
  }
});
