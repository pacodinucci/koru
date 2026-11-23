import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/modules/landing/components/landing-nav.tsx", "utf8");
const userMenu = source.slice(source.indexOf("function renderUserDropdown("), source.indexOf("  return (\n    <header"));

test("user menu actions have pointer cursors and visible hover feedback", () => {
  const actions = [...userMenu.matchAll(/<(DropdownMenuItem|Link|button)\b[\s\S]*?className="([^"]+)"/g)]
    .filter(([, , classes]) => classes.includes("h-12"));
  assert.equal(actions.length, 6);
  for (const [, tag, classes] of actions) {
    assert.match(classes, /\bcursor-pointer\b/, `${tag} needs a pointer cursor`);
    assert.match(classes, /\bhover:bg-slate-(50|100)\b/, `${tag} needs hover feedback`);
  }
});

test("dashboard destinations and sign-out actions remain intact", () => {
  assert.equal((userMenu.match(/href="\/family-dashboard"/g) ?? []).length, 2);
  assert.equal((userMenu.match(/href="\/dashboard"/g) ?? []).length, 2);
  assert.equal((userMenu.match(/action=\{onSignOut\}/g) ?? []).length, 2);
  assert.equal((userMenu.match(/type="submit"/g) ?? []).length, 2);
});
