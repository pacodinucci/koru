import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);

// UI mocks keep the real DOM shape (tag, className, data-*) so assertions read
// the rendered tree instead of component internals.
const DOM_PROPS = new Set([
  "className",
  "id",
  "href",
  "type",
  "name",
  "value",
  "placeholder",
  "maxLength",
  "role",
  "title",
  "target",
  "scope",
  "colSpan",
  "disabled",
  "defaultValue",
  "onChange",
]);

function mockEl(tag) {
  function MockEl(props) {
    const dom = {};
    for (const [key, value] of Object.entries(props)) {
      if (key === "children" || key === "render") continue;
      if (key.startsWith("aria-") || key.startsWith("data-") || DOM_PROPS.has(key)) {
        dom[key] = value;
      }
    }
    if (props.variant) dom["data-variant"] = props.variant;
    if (props.size) dom["data-size"] = props.size;
    return React.createElement(tag, dom, props.children);
  }
  return MockEl;
}

const UI = {
  Card: mockEl("div"),
  CardHeader: mockEl("div"),
  CardTitle: mockEl("div"),
  CardContent: mockEl("div"),
  Table: mockEl("table"),
  TableHeader: mockEl("thead"),
  TableBody: mockEl("tbody"),
  TableRow: mockEl("tr"),
  TableHead: mockEl("th"),
  TableCell: mockEl("td"),
  Badge: mockEl("span"),
  Button: mockEl("button"),
  Input: mockEl("input"),
};

const icon = mockEl("svg");

const prismaEnums = {
  DocumentStatus: { PUBLISHED: "PUBLISHED", DRAFT: "DRAFT" },
  BlogPostStatus: { PUBLISHED: "PUBLISHED", DRAFT: "DRAFT" },
  BlogPostVisibility: { PUBLIC: "PUBLIC", MEMBERS: "MEMBERS" },
  InvitationStatus: { PENDING: "PENDING", ACCEPTED: "ACCEPTED", REVOKED: "REVOKED" },
  EmailDeliveryStatus: { PENDING: "PENDING", SENT: "SENT", FAILED: "FAILED" },
  EmailMessageType: {
    USER_INVITATION: "USER_INVITATION",
    CALENDAR_EVENT: "CALENDAR_EVENT",
    BLOG_POST: "BLOG_POST",
    MANUAL: "MANUAL",
  },
  InvitationDeliveryJobStatus: {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    RETRY_SCHEDULED: "RETRY_SCHEDULED",
    SENT: "SENT",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
  },
};

// Server actions and permission gates are shared identities: the row slots must
// keep pointing at the exact same functions the view imported.
const ACTIONS = {
  documents: {
    deleteDocumentAction: function deleteDocumentAction() {},
    setDocumentStatusAction: function setDocumentStatusAction() {},
  },
  blog: { deleteBlogPostAction: function deleteBlogPostAction() {} },
  users: {
    resendUserInvitationAction: function resendUserInvitationAction() {},
    revokeUserInvitationAction: function revokeUserInvitationAction() {},
    updateUserRoleAction: function updateUserRoleAction() {},
  },
  mailing: { sendInvitationDeliveryJobAction: function sendInvitationDeliveryJobAction() {} },
};

function loadModule(file, registry) {
  const output = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(
    output,
    {
      module: mod,
      exports: mod.exports,
      URLSearchParams,
      FormData: class {},
      AbortController,
      Date,
      console,
      require: (id) => (registry[id] ? registry[id] : require(id)),
    },
    { filename: file },
  );
  return mod.exports;
}

// Real DashboardSearchableTable loaded with a per-instance useState shim, so live
// typing, filtering and reset run through the shipped component and not a stub.
function createRuntime() {
  const tableState = new Map();
  let activeInstance = null;
  const react = {
    ...React,
    useState: (initial) => {
      const key = activeInstance ?? "root";
      const entry = tableState.get(key) ?? { values: [], cursor: 0 };
      tableState.set(key, entry);
      const index = entry.cursor++;
      if (!(index in entry.values)) entry.values[index] = initial;
      return [
        entry.values[index],
        (next) => {
          entry.values[index] = typeof next === "function" ? next(entry.values[index]) : next;
        },
      ];
    },
  };
  const registry = {
    react,
    "next/link": { __esModule: true, default: mockEl("a") },
    "lucide-react": {
      FileText: icon,
      Download: icon,
      Trash2: icon,
      Trash2Icon: icon,
      EyeIcon: icon,
      PencilIcon: icon,
      SaveIcon: icon,
    },
    "@prisma/client": prismaEnums,
    "@/components/ui/card": {
      Card: UI.Card,
      CardHeader: UI.CardHeader,
      CardTitle: UI.CardTitle,
      CardContent: UI.CardContent,
    },
    "@/components/ui/table": {
      Table: UI.Table,
      TableHeader: UI.TableHeader,
      TableBody: UI.TableBody,
      TableRow: UI.TableRow,
      TableHead: UI.TableHead,
      TableCell: UI.TableCell,
    },
    "@/components/ui/badge": { Badge: UI.Badge },
    "@/components/ui/button": { Button: UI.Button },
    "@/components/ui/input": { Input: UI.Input },
  };

  const realSearchableTable = loadModule(
    "src/modules/dashboard/components/dashboard-searchable-table.tsx",
    registry,
  ).DashboardSearchableTable;
  assert.equal(
    typeof realSearchableTable,
    "function",
    "the shared searchable table component must exist",
  );
  const SearchableTable = (props) => {
    activeInstance = props.searchId;
    const entry = tableState.get(props.searchId);
    if (entry) entry.cursor = 0;
    try {
      return realSearchableTable(props);
    } finally {
      activeInstance = null;
    }
  };
  registry["@/modules/dashboard/components/dashboard-searchable-table"] = {
    DashboardSearchableTable: SearchableTable,
  };

  function entries(tree) {
    const out = [];
    (function walk(node, parent) {
      if (!React.isValidElement(node)) return;
      if (node.type === SearchableTable) {
        walk(SearchableTable(node.props), parent);
        return;
      }
      out.push({ node, parent });
      for (const child of React.Children.toArray(node.props.children)) walk(child, node);
    })(tree, null);
    return out;
  }

  function findAll(predicate, tree) {
    return entries(tree)
      .filter((entry) => predicate(entry.node))
      .map((entry) => entry.node);
  }

  function expand(node) {
    if (Array.isArray(node)) return node.map(expand);
    if (!React.isValidElement(node)) return node;
    if (node.type === SearchableTable) return expand(SearchableTable(node.props));
    const children = React.Children.toArray(node.props.children);
    if (children.length === 0) return node;
    return React.cloneElement(node, node.props, ...children.map(expand));
  }

  return {
    SearchableTable,
    findAll,
    entries,
    registry,
    load: (file, extra = {}) => loadModule(file, { ...registry, ...extra }),
    // Each render re-runs the hook chain of every table instance from scratch.
    render: (view) => view(),
    markup: (tree) => renderToStaticMarkup(expand(tree)),
  };
}

function text(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!React.isValidElement(node)) return "";
  return React.Children.toArray(node.props.children).map(text).join("");
}

function tableScope(rt, tree, searchId) {
  const all = rt.entries(tree);
  const parentMap = new Map(all.map((entry) => [entry.node, entry.parent]));
  const input = all.find(
    (entry) => entry.node.type === UI.Input && entry.node.props.id === searchId,
  )?.node;
  if (!input) return null;

  let wrapper = parentMap.get(input);
  while (wrapper && !rt.findAll((node) => node.type === UI.Table, wrapper).length) {
    wrapper = parentMap.get(wrapper);
  }
  if (!wrapper) return null;

  const nodes = rt.findAll(() => true, wrapper);
  const card = nodes.find((node) => node.type === UI.Card);
  const header = nodes.find((node) => node.type === UI.TableHeader);
  const body = nodes.find((node) => node.type === UI.TableBody);
  return {
    wrapper,
    card,
    input,
    header,
    body,
    inputs: nodes.filter((node) => node.type === UI.Input),
    columns: rt.findAll((node) => node.type === UI.TableHead, header).map(text),
    rows: rt.findAll((node) => node.type === UI.TableRow, body),
  };
}

function searchScope(rt, tree, searchId) {
  const scope = tableScope(rt, tree, searchId);
  assert.ok(scope, `listing with search id "${searchId}" must render a searchable table`);
  return scope;
}

function type(rt, tree, searchId, value) {
  const scope = searchScope(rt, tree, searchId);
  scope.input.props.onChange({ target: { value } });
  return scope;
}

function emptyCell(rt, scope) {
  const cell = rt.findAll((node) => node.type === UI.TableCell, scope.rows[0])[0];
  return { span: cell.props.colSpan, message: text(cell) };
}

const NO_RESULTS = "No encontramos resultados para esta búsqueda.";

const documentFixtures = () => [
  {
    id: "d1",
    title: "Reglamento",
    slug: "reglamento",
    originalFileName: "reglamento.pdf",
    sizeBytes: 2 * 1024 * 1024,
    status: "PUBLISHED",
    updatedAt: new Date("2026-01-02T12:00:00Z"),
  },
  {
    id: "d2",
    title: "Notas internas",
    slug: "notas-internas",
    originalFileName: "notas.pdf",
    sizeBytes: 1024,
    status: "DRAFT",
    updatedAt: new Date("2026-01-03T12:00:00Z"),
  },
];

function documentsHarness(documents) {
  const rt = createRuntime();
  const fixtures = { documents };
  const exports = rt.load("src/modules/documents/components/dashboard-documents-view.tsx", {
    "@/modules/documents/components/copy-document-link-button": {
      CopyDocumentLinkButton: mockEl("button"),
    },
    "@/modules/documents/components/document-upload-form": {
      DocumentUploadForm: mockEl("form"),
    },
    "@/modules/documents/server/document.actions": ACTIONS.documents,
    "@/modules/documents/server/document.repository": {
      listDocuments: async () => fixtures.documents,
    },
  });
  return { rt, fixtures, view: () => exports.DashboardDocumentsView({}) };
}

test("documents listing exposes an Alumnos-style live search above a white table", async () => {
  const h = documentsHarness(documentFixtures());
  const tree = await h.rt.render(h.view);
  const scope = searchScope(h.rt, tree, "documents-search");

  assert.equal(scope.input.props.type, "search");
  assert.equal(scope.input.props.placeholder, "Buscar por archivo o estado");
  assert.equal(
    h.rt.findAll(
      (node) => node.type === "label" && node.props.htmlFor === "documents-search" && node.props.children === "Buscar",
      tree,
    ).length,
    1,
  );
  assert.equal(h.rt.findAll((node) => node.type === UI.Input, scope.card).length, 0);
  assert.equal(scope.card.props.size, "sm");
  assert.match(scope.card.props.className, /bg-white/);
  assert.deepEqual(h.rt.findAll((node) => node.type === "h2", tree).map(text), ["Archivos cargados"]);
  assert.equal(h.rt.findAll((node) => node.type === "h2", scope.card).length, 0);
});

test("documents search filters visible rows, reports no match and resets while keeping server actions", async () => {
  const h = documentsHarness(documentFixtures());
  let tree = await h.rt.render(h.view);
  assert.equal(searchScope(h.rt, tree, "documents-search").rows.length, 2);

  type(h.rt, tree, "documents-search", " REGLAMENTO ");
  tree = await h.rt.render(h.view);
  let scope = searchScope(h.rt, tree, "documents-search");
  assert.equal(scope.rows.length, 1);
  const html = h.rt.markup(tree);
  assert.match(html, /Reglamento/);
  assert.doesNotMatch(html, /Notas internas/);
  assert.deepEqual(
    h.rt.findAll((node) => node.type === "form", scope.rows[0]).map((form) => form.props.action),
    [ACTIONS.documents.setDocumentStatusAction, ACTIONS.documents.deleteDocumentAction],
  );

  type(h.rt, tree, "documents-search", "no-existe");
  tree = await h.rt.render(h.view);
  scope = searchScope(h.rt, tree, "documents-search");
  assert.equal(scope.rows.length, 1);
  assert.deepEqual(emptyCell(h.rt, scope), { span: 5, message: NO_RESULTS });
  assert.equal(h.rt.findAll((node) => node.type === "form", scope.rows[0]).length, 0);
  assert.match(h.rt.markup(tree), /Subir archivo/);

  type(h.rt, tree, "documents-search", "");
  tree = await h.rt.render(h.view);
  assert.equal(searchScope(h.rt, tree, "documents-search").rows.length, 2);
});

test("documents keep the live search and the empty message when there is no data", async () => {
  const h = documentsHarness([]);
  const tree = await h.rt.render(h.view);
  const scope = searchScope(h.rt, tree, "documents-search");
  assert.deepEqual(emptyCell(h.rt, scope), { span: 5, message: "Todavía no hay archivos." });
  assert.match(h.rt.markup(tree), /Subir archivo/);
});

const blogFixtures = () => [
  {
    id: "p1",
    title: "Bienvenida",
    slug: "bienvenida",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    tags: [
      { tag: { id: "t1", name: "Novedades" } },
      { tag: { id: "t2", name: "Actividades" } },
      { tag: { id: "t3", name: "Salidas" } },
      { tag: { id: "t4", name: "Etiqueta oculta" } },
    ],
    _count: { comments: 3 },
    publishedAt: new Date("2026-02-01T12:00:00Z"),
  },
  {
    id: "p2",
    title: "Borrador interno",
    slug: "borrador",
    status: "DRAFT",
    visibility: "MEMBERS",
    tags: [],
    _count: { comments: 0 },
    publishedAt: null,
  },
];

function blogHarness(posts) {
  const rt = createRuntime();
  const fixtures = { posts };
  const exports = rt.load("src/modules/blog/views/dashboard-blog-view.tsx", {
    "@/modules/blog/components/blog-event-toast": { BlogEventToast: mockEl("div") },
    "@/modules/blog/components/dashboard-blog-composer": { DashboardBlogComposer: mockEl("form") },
    "@/modules/blog/server/blog.actions": ACTIONS.blog,
    "@/modules/blog/server/blog.repository": {
      getDashboardPosts: async () => fixtures.posts,
      getBlogTagOptions: async () => [],
    },
  });
  return { rt, fixtures, view: () => exports.DashboardBlogView({}) };
}

test("blog listing exposes an Alumnos-style live search above a white table", async () => {
  const h = blogHarness(blogFixtures());
  const tree = await h.rt.render(h.view);
  const scope = searchScope(h.rt, tree, "blog-posts-search");
  assert.equal(scope.input.props.type, "search");
  assert.equal(scope.input.props.placeholder, "Buscar por título o etiqueta");
  assert.equal(
    h.rt.findAll(
      (node) => node.type === "label" && node.props.htmlFor === "blog-posts-search" && node.props.children === "Buscar",
      tree,
    ).length,
    1,
  );
  assert.equal(h.rt.findAll((node) => node.type === UI.Input, scope.card).length, 0);
  assert.match(scope.card.props.className, /bg-white/);
  assert.deepEqual(h.rt.findAll((node) => node.type === "h2", tree).map(text), ["Posts cargados"]);
  assert.equal(h.rt.findAll((node) => node.type === "h2", scope.card).length, 0);
});

test("blog search filters visible rows only, reports no match and resets", async () => {
  const h = blogHarness(blogFixtures());
  let tree = await h.rt.render(h.view);
  assert.equal(searchScope(h.rt, tree, "blog-posts-search").rows.length, 2);

  type(h.rt, tree, "blog-posts-search", "novedades");
  tree = await h.rt.render(h.view);
  let scope = searchScope(h.rt, tree, "blog-posts-search");
  assert.equal(scope.rows.length, 1);
  assert.equal(
    h.rt.findAll((node) => node.type === "form", scope.rows[0])[0].props.action,
    ACTIONS.blog.deleteBlogPostAction,
  );
  assert.doesNotMatch(h.rt.markup(tree), /Borrador interno/);

  // A tag rendered only as "+1" is not visible text, so it must not be searchable.
  type(h.rt, tree, "blog-posts-search", "etiqueta oculta");
  tree = await h.rt.render(h.view);
  assert.deepEqual(emptyCell(h.rt, searchScope(h.rt, tree, "blog-posts-search")), {
    span: 7,
    message: NO_RESULTS,
  });

  type(h.rt, tree, "blog-posts-search", "");
  tree = await h.rt.render(h.view);
  assert.equal(searchScope(h.rt, tree, "blog-posts-search").rows.length, 2);
  assert.match(h.rt.markup(tree), /Borrador interno/);
});

const usersFixture = () => ({
  users: [
    {
      id: "u2",
      name: "Ana Pérez",
      email: "ana@example.com",
      role: "TEACHER",
      accessRoleId: "r1",
      accessRole: { name: "Docente", baseRole: "TEACHER" },
      createdAt: new Date("2026-01-05T12:00:00Z"),
    },
  ],
  invitations: [
    {
      id: "i1",
      email: "nueva@example.com",
      role: "FAMILY",
      status: "PENDING",
      accessRole: { name: "Familia" },
      family: null,
      createdAt: new Date("2026-01-06T12:00:00Z"),
      expiresAt: new Date("2026-01-10T12:00:00Z"),
      acceptedAt: null,
      invitedBy: { email: "admin@example.com" },
    },
  ],
  roles: [{ id: "r1", name: "Docente", baseRole: "TEACHER", permissions: [] }],
});

function usersHarness(fixture, canManage = true) {
  const rt = createRuntime();
  const userDelete = mockEl("button");
  const exports = rt.load("src/modules/users/views/dashboard-users-view.tsx", {
    "@/modules/users/server/user-invitations.actions": {
      ...ACTIONS.users,
      listUsersForAdmin: async () => fixture.users,
      listUserInvitationsForAdmin: async () => fixture.invitations,
      listFamiliesForInvitationAdmin: async () => [],
    },
    "@/modules/users/components/create-user-invitation-form": {
      CreateUserInvitationForm: mockEl("form"),
    },
    "@/modules/users/components/user-delete-button": { UserDeleteButton: userDelete },
    "@/modules/roles/server/role.repository": {
      listAssignableRoles: async () => fixture.roles,
    },
  });
  return {
    rt,
    fixture,
    userDelete,
    view: () =>
      exports.DashboardUsersView({
        currentAdminId: "u2",
        canManage,
        actorPermissions: ["users.manage"],
        currentRoleKey: "SUPERADMIN",
      }),
  };
}

test("users and invitations each expose an Alumnos-style live search above a white table", async () => {
  const h = usersHarness(usersFixture());
  const tree = await h.rt.render(h.view);
  const users = searchScope(h.rt, tree, "users-search");
  const invitations = searchScope(h.rt, tree, "users-invitations-search");
  assert.equal(users.input.props.placeholder, "Buscar por nombre o email");
  assert.equal(invitations.input.props.placeholder, "Buscar por email o rol");
  assert.deepEqual(h.rt.findAll((node) => node.type === "h2", tree).map(text), [
    "Usuarios creados",
    "Emails autorizados",
  ]);
  for (const scope of [users, invitations]) {
    assert.equal(scope.input.props.type, "search");
    assert.equal(scope.card.props.size, "sm");
    assert.match(scope.card.props.className, /bg-white/);
    assert.equal(h.rt.findAll((node) => node.type === UI.Input, scope.card).length, 0);
    assert.equal(h.rt.findAll((node) => node.type === "h2", scope.card).length, 0);
  }
});

test("users search filters accounts and invitations independently and keeps role gates", async () => {
  const h = usersHarness(usersFixture());
  let tree = await h.rt.render(h.view);
  assert.equal(searchScope(h.rt, tree, "users-search").rows.length, 1);
  assert.equal(searchScope(h.rt, tree, "users-invitations-search").rows.length, 1);

  type(h.rt, tree, "users-search", "nadie");
  tree = await h.rt.render(h.view);
  assert.deepEqual(emptyCell(h.rt, searchScope(h.rt, tree, "users-search")), {
    span: 4,
    message: NO_RESULTS,
  });
  assert.equal(searchScope(h.rt, tree, "users-invitations-search").rows.length, 1);

  type(h.rt, tree, "users-invitations-search", "admin@example.com");
  tree = await h.rt.render(h.view);
  assert.equal(searchScope(h.rt, tree, "users-invitations-search").rows.length, 1);
  assert.deepEqual(
    h.rt.findAll((node) => node.type === "form", tree).map((form) => form.props.action),
    [ACTIONS.users.resendUserInvitationAction, ACTIONS.users.revokeUserInvitationAction],
  );

  type(h.rt, tree, "users-search", "ana@example.com");
  tree = await h.rt.render(h.view);
  const users = searchScope(h.rt, tree, "users-search");
  assert.equal(users.rows.length, 1);
  assert.deepEqual(
    h.rt.findAll((node) => node.type === "form", users.rows[0]).map((form) => form.props.action),
    [ACTIONS.users.updateUserRoleAction],
  );
  assert.equal(h.rt.findAll((node) => node.type === UI.Button, users.rows[0])[0].props.disabled, false);
  assert.equal(h.rt.findAll((node) => node.type === h.userDelete, users.rows[0])[0].props.disabled, true);
});

test("users search still works when the actor cannot manage accounts", async () => {
  const h = usersHarness(usersFixture(), false);
  let tree = await h.rt.render(h.view);
  const users = searchScope(h.rt, tree, "users-search");
  assert.equal(h.rt.findAll((node) => node.type === UI.Button, users.rows[0])[0].props.disabled, true);
  const invitations = searchScope(h.rt, tree, "users-invitations-search");
  assert.equal(h.rt.findAll((node) => node.type === "form", invitations.rows[0]).length, 0);
  assert.match(text(invitations.rows[0]), /-/);

  type(h.rt, tree, "users-search", "ana");
  tree = await h.rt.render(h.view);
  assert.equal(searchScope(h.rt, tree, "users-search").rows.length, 1);
});

const mailingFixture = () => ({
  jobs: [
    {
      id: "j1",
      status: "PENDING",
      attemptCount: 2,
      nextAttemptAt: new Date("2026-03-01T12:00:00Z"),
      lastError: null,
      lastErrorCode: null,
      providerMessageId: null,
      tokenVersion: 3,
      invitation: { email: "familia@example.com", family: { name: "Gómez" } },
    },
    {
      id: "j2",
      status: "SENT",
      attemptCount: 1,
      nextAttemptAt: null,
      lastError: "rebotó",
      lastErrorCode: null,
      providerMessageId: "m-1",
      tokenVersion: 1,
      invitation: { email: "otra@example.com", family: null },
    },
  ],
  messages: [
    {
      id: "m1",
      type: "USER_INVITATION",
      subject: "Invitación Koru",
      recipients: [{ email: "familia@example.com" }],
      status: "SENT",
      provider: "smtp",
      providerMessageId: null,
      createdAt: new Date("2026-03-02T12:00:00Z"),
      error: null,
    },
    {
      id: "m2",
      type: "BLOG_POST",
      subject: "Nueva nota",
      recipients: [{ email: "familias@example.com" }],
      status: "FAILED",
      provider: "smtp",
      providerMessageId: null,
      createdAt: new Date("2026-03-03T12:00:00Z"),
      error: "sin conexión",
    },
  ],
});

function mailingHarness(fixture, canManage = true) {
  const rt = createRuntime();
  const exports = rt.load("src/modules/mailing/views/dashboard-mailing-view.tsx", {
    "@/modules/mailing/server/mailing.actions": {
      ...ACTIONS.mailing,
      listEmailMessagesForAdmin: async () => fixture.messages,
      listInvitationDeliveryJobsForAdmin: async () => fixture.jobs,
    },
  });
  return { rt, fixture, view: () => exports.DashboardMailingView({ canManage }) };
}

test("mailing jobs and history each expose an Alumnos-style live search above a white table", async () => {
  const h = mailingHarness(mailingFixture());
  const tree = await h.rt.render(h.view);
  const jobs = searchScope(h.rt, tree, "mailing-jobs-search");
  const history = searchScope(h.rt, tree, "mailing-history-search");
  assert.equal(jobs.input.props.placeholder, "Buscar por email o estado");
  assert.equal(history.input.props.placeholder, "Buscar por asunto o destinatario");
  assert.deepEqual(h.rt.findAll((node) => node.type === "h2", tree).map(text), [
    "Entregas de invitaciones",
    "Historial de mailing",
  ]);
  for (const scope of [jobs, history]) {
    assert.equal(scope.input.props.type, "search");
    assert.match(scope.card.props.className, /bg-white/);
    assert.equal(h.rt.findAll((node) => node.type === UI.Input, scope.card).length, 0);
    assert.equal(h.rt.findAll((node) => node.type === "h2", scope.card).length, 0);
  }
  assert.equal(h.rt.findAll((node) => node.type === "h2", jobs.card).length, 0);
  assert.match(h.rt.markup(tree), /Pendientes/);
});

test("mailing search filters jobs and history independently and keeps send gates", async () => {
  const h = mailingHarness(mailingFixture());
  let tree = await h.rt.render(h.view);
  assert.equal(searchScope(h.rt, tree, "mailing-jobs-search").rows.length, 2);
  assert.equal(searchScope(h.rt, tree, "mailing-history-search").rows.length, 2);

  type(h.rt, tree, "mailing-jobs-search", "familia@example.com");
  tree = await h.rt.render(h.view);
  let jobs = searchScope(h.rt, tree, "mailing-jobs-search");
  assert.equal(jobs.rows.length, 1);
  assert.deepEqual(
    h.rt.findAll((node) => node.type === "form", jobs.rows[0]).map((form) => form.props.action),
    [ACTIONS.mailing.sendInvitationDeliveryJobAction],
  );
  assert.equal(searchScope(h.rt, tree, "mailing-history-search").rows.length, 2);

  type(h.rt, tree, "mailing-history-search", "sin conexión");
  tree = await h.rt.render(h.view);
  const history = searchScope(h.rt, tree, "mailing-history-search");
  assert.equal(history.rows.length, 1);
  assert.match(text(history.rows[0]), /Nueva nota/);

  type(h.rt, tree, "mailing-history-search", "nadie");
  tree = await h.rt.render(h.view);
  assert.deepEqual(emptyCell(h.rt, searchScope(h.rt, tree, "mailing-history-search")), {
    span: 7,
    message: NO_RESULTS,
  });

  type(h.rt, tree, "mailing-history-search", "");
  tree = await h.rt.render(h.view);
  assert.equal(searchScope(h.rt, tree, "mailing-history-search").rows.length, 2);
});

test("mailing search still works when the actor cannot send deliveries", async () => {
  const h = mailingHarness(mailingFixture(), false);
  let tree = await h.rt.render(h.view);
  const jobs = searchScope(h.rt, tree, "mailing-jobs-search");
  assert.equal(h.rt.findAll((node) => node.type === "form", jobs.rows[0]).length, 0);
  type(h.rt, tree, "mailing-jobs-search", "otra");
  tree = await h.rt.render(h.view);
  const filtered = searchScope(h.rt, tree, "mailing-jobs-search");
  assert.equal(filtered.rows.length, 1);
  assert.match(text(filtered.rows[0]), /otra@example\.com/);
  assert.equal(h.rt.findAll((node) => node.type === "form", filtered.rows[0]).length, 0);
});
