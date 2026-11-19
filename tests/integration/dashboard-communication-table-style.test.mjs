import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);

// UI mocks keep the real DOM shape (tag, className, data-*) so the assertions
// below read the rendered tree instead of component internals.
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
  Tabs: mockEl("div"),
  TabsList: mockEl("div"),
  TabsTrigger: mockEl("button"),
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

const baseMocks = {
  react: { ...React },
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
  "@/components/ui/tabs": {
    Tabs: UI.Tabs,
    TabsList: UI.TabsList,
    TabsTrigger: UI.TabsTrigger,
  },
};

function loadSearchableTable() {
  const source = readFileSync(
    "src/modules/dashboard/components/dashboard-searchable-table.tsx",
    "utf8",
  );
  const output = ts.transpileModule(source, {
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
      require: (id) =>
        id === "react"
          ? { ...React, useState: (initial) => [initial, () => {}] }
          : baseMocks[id] ?? require(id),
    },
    { filename: "src/modules/dashboard/components/dashboard-searchable-table.tsx" },
  );
  return mod.exports.DashboardSearchableTable;
}

// The listing views now delegate to the shared searchable table, so the tree is
// expanded with the real component (hooks mocked) instead of bypassing it.
const SearchableTable = loadSearchableTable();
baseMocks["@/modules/dashboard/components/dashboard-searchable-table"] = {
  DashboardSearchableTable: SearchableTable,
};

function loadView(file, mocks) {
  const output = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const mod = { exports: {} };
  const registry = { ...baseMocks, ...mocks };
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

function findAll(predicate, node) {
  if (!React.isValidElement(node)) return [];
  if (node.type === SearchableTable) {
    return findAll(predicate, SearchableTable(node.props));
  }
  return [
    ...(predicate(node) ? [node] : []),
    ...React.Children.toArray(node.props.children).flatMap((child) =>
      findAll(predicate, child),
    ),
  ];
}

// Single traversal that records parents, because React.Children.toArray clones
// children and element identity cannot be compared across traversals.
function entries(node, parent = null, out = []) {
  if (!React.isValidElement(node)) return out;
  if (node.type === SearchableTable) {
    return entries(SearchableTable(node.props), parent, out);
  }
  out.push({ node, parent });
  for (const child of React.Children.toArray(node.props.children)) {
    entries(child, node, out);
  }
  return out;
}

function text(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!React.isValidElement(node)) return "";
  return React.Children.toArray(node.props.children).map(text).join("");
}

function headings(tree) {
  return findAll((node) => node.type === "h2", tree).map(text);
}

function assertHeadingsOutsideCards(tree) {
  for (const card of findAll((node) => node.type === UI.Card, tree)) {
    assert.equal(findAll((node) => node.type === "h2", card).length, 0);
  }
}

function tableSections(tree) {
  return findAll((node) => node.type === UI.Card, tree)
    .filter((card) => findAll((node) => node.type === UI.Table, card).length > 0)
    .map((card) => {
      const table = findAll((node) => node.type === UI.Table, card)[0];
      const header = findAll((node) => node.type === UI.TableHeader, card)[0];
      const body = findAll((node) => node.type === UI.TableBody, card)[0];
      return {
        card,
        table,
        columns: findAll((node) => node.type === UI.TableHead, header).map(text),
        rows: findAll((node) => node.type === UI.TableRow, body),
        badges: findAll((node) => node.type === UI.Badge, card),
      };
    });
}

function emptyCell(section) {
  const cell = findAll((node) => node.type === UI.TableCell, section.rows[0])[0];
  return { span: cell.props.colSpan, message: text(cell) };
}

function assertLiveSearch(tree, searchId, placeholder) {
  const all = entries(tree);
  const parentMap = new Map(all.map((entry) => [entry.node, entry.parent]));
  const input = all.find(
    (entry) => entry.node.type === UI.Input && entry.node.props.id === searchId,
  )?.node;
  assert.ok(input, `listing ${searchId} must render the shared searchable table`);
  assert.equal(input.props.type, "search");
  assert.equal(input.props.placeholder, placeholder);

  let wrapper = parentMap.get(input);
  while (wrapper && !entries(wrapper).some((entry) => entry.node.type === UI.Table)) {
    wrapper = parentMap.get(wrapper);
  }
  assert.ok(wrapper, "search must sit above the table it filters");
  const card = entries(wrapper).find((entry) => entry.node.type === UI.Card)?.node;
  assert.ok(card, "searchable table must keep its compact card");
  assert.equal(findAll((node) => node.type === UI.Input, card).length, 0);
  assert.equal(
    findAll(
      (node) =>
        node.type === "label" &&
        node.props.htmlFor === searchId &&
        node.props.children === "Buscar",
      wrapper,
    ).length,
    1,
  );
}

function contactsHarness() {
  const calls = [];
  const params = new URLSearchParams("source=contact&status=NEW");
  const snapshot = {
    query: "source=contact&status=NEW",
    search: "",
    resultQuery: "source=contact&status=NEW",
    page: {
      total: 12,
      page: 1,
      pageSize: 10,
      items: [
        {
          id: "one",
          source: "contact",
          name: "Ana",
          email: "ana@example.com",
          phone: null,
          receivedAt: "2026-01-01T12:00:00Z",
          status: "NEW",
        },
      ],
    },
    error: "",
    updating: false,
    stale: false,
  };
  class ContactsQuery {
    store = { getState: () => snapshot };
    start = (...args) => calls.push(["start", ...args]);
    pause = () => calls.push(["pause"]);
    sync = (...args) => calls.push(["sync", ...args]);
    filter = (...args) => calls.push(["filter", ...args]);
    search = (...args) => calls.push(["search", ...args]);
    paginate = (...args) => calls.push(["paginate", ...args]);
    retry = (...args) => calls.push(["retry", ...args]);
  }
  const exports = loadView("src/modules/contacts/views/contacts-list.tsx", {
    react: { ...React, useEffect: () => {} },
    zustand: { useStore: (store) => store.getState() },
    "./contacts-store-provider": { useContactsModel: () => new ContactsQuery() },
    "next/navigation": { useSearchParams: () => params, useRouter: () => ({}) },
    "../contacts.domain": {
      SOURCE_LABELS: { contact: "Formulario de contacto", admission: "Cuestionario inicial" },
      STATUS_LABELS: { NEW: "Nuevo", READ: "Leído", REPLIED: "Respondido" },
    },
  });
  return { tree: exports.ContactsList(), calls, snapshot };
}

test("contacts keep segmented filters with the sidebar blend (S3)", () => {
  const { tree } = contactsHarness();
  const tabLists = findAll((node) => node.type === UI.TabsList, tree);
  assert.equal(tabLists.length, 2);
  for (const list of tabLists) {
    assert.match(list.props.className, /var\(--brand-600\)_14%,white/);
    assert.doesNotMatch(list.props.className, /\bbg-muted\b/);
  }
  for (const trigger of findAll((node) => node.type === UI.TabsTrigger, tree)) {
    assert.match(trigger.props.className, /data-\[active\]:bg-background/);
  }
  const html = renderToStaticMarkup(tree);
  assert.match(
    html,
    /bg-\[color-mix\(in_srgb,var\(--brand-600\)_14%,white\)\]/,
  );
  assert.doesNotMatch(html, /\bbg-muted\b/);
});

test("contacts keep filter, search and pagination wiring (preserve)", () => {
  const { tree, calls } = contactsHarness();
  const tabs = findAll((node) => node.type === UI.Tabs, tree);
  assert.equal(tabs.length, 2);
  tabs[0].props.onValueChange("admission");
  tabs[1].props.onValueChange("");
  const input = findAll((node) => node.type === UI.Input, tree)[0];
  input.props.onChange({ target: { value: "Ana" } });
  const buttons = findAll((node) => node.type === UI.Button, tree);
  buttons.find((node) => text(node) === "Siguiente").props.onClick();
  assert.deepEqual(calls, [
    ["filter", "source", "admission"],
    ["filter", "status", ""],
    ["search", "Ana"],
    ["paginate", 2],
  ]);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /ana@example\.com/);
  assert.match(html, /Página 1 de 2/);
  assert.match(html, /rounded-xl border border-slate-200/);
});

function documentsHarness(fixture) {
  const exports = loadView(
    "src/modules/documents/components/dashboard-documents-view.tsx",
    {
      "@/modules/documents/components/copy-document-link-button": {
        CopyDocumentLinkButton: mockEl("button"),
      },
      "@/modules/documents/components/document-upload-form": {
        DocumentUploadForm: mockEl("form"),
      },
      "@/modules/documents/server/document.actions": {
        deleteDocumentAction: async () => {},
        setDocumentStatusAction: async () => {},
      },
      "@/modules/documents/server/document.repository": {
        listDocuments: async () => fixture.documents,
      },
    },
  );
  return () => exports.DashboardDocumentsView({});
}

test("documents render the listing title outside a compact table container", async () => {
  const fixture = {
    documents: [
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
    ],
  };
  const render = documentsHarness(fixture);
  const tree = await render();

  assert.deepEqual(headings(tree), ["Archivos cargados"]);
  assertHeadingsOutsideCards(tree);
  assertLiveSearch(tree, "documents-search", "Buscar por archivo o estado");
  const sections = tableSections(tree);
  assert.equal(sections.length, 1);
  const [section] = sections;
  assert.equal(section.card.props.size, "sm");
  assert.match(section.card.props.className, /min-w-0/);
  assert.equal(
    findAll((node) => node.type === UI.CardContent, section.card)[0].props.className,
    "min-w-0",
  );
  assert.deepEqual(section.columns, [
    "Archivo",
    "Estado",
    "Actualizado",
    "Enlace",
    "Acciones",
  ]);
  assert.match(section.table.props.className, /min-w-\[720px\]/);
  assert.deepEqual(
    section.badges.map((node) => [text(node), node.props.variant]),
    [
      ["Publicado", "success"],
      ["Borrador", "muted"],
    ],
  );

  const html = renderToStaticMarkup(tree);
  assert.match(html, /Reglamento/);
  assert.match(html, /reglamento\.pdf · 2\.0 MB/);
  assert.match(html, /\/documentos\/reglamento/);
  assert.match(html, /Despublicar/);
  assert.match(html, />\s*Publicar\s*</);
  assert.match(html, /aria-label="Eliminar Reglamento"/);
  assert.match(html, /Subir archivo/);
  assert.match(html, /data-size="sm"/);

  fixture.documents = [];
  const empty = await render();
  const [emptySection] = tableSections(empty);
  assert.deepEqual(emptyCell(emptySection), {
    span: 5,
    message: "Todavía no hay archivos.",
  });
  assert.match(renderToStaticMarkup(empty), /Subir archivo/);
});

function blogHarness(fixture) {
  const exports = loadView("src/modules/blog/views/dashboard-blog-view.tsx", {
    "@/modules/blog/components/blog-event-toast": {
      BlogEventToast: mockEl("div"),
    },
    "@/modules/blog/components/dashboard-blog-composer": {
      DashboardBlogComposer: mockEl("form"),
    },
    "@/modules/blog/server/blog.actions": {
      deleteBlogPostAction: async () => {},
    },
    "@/modules/blog/server/blog.repository": {
      getDashboardPosts: async () => fixture.posts,
      getBlogTagOptions: async () => [],
    },
  });
  return () => exports.DashboardBlogView({});
}

test("blog separates the posts title from the compact table container", async () => {
  const fixture = {
    posts: [
      {
        id: "p1",
        title: "Bienvenida",
        slug: "bienvenida",
        status: "PUBLISHED",
        visibility: "PUBLIC",
        tags: [{ tag: { id: "t1", name: "Novedades" } }],
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
    ],
  };
  const render = blogHarness(fixture);
  const tree = await render();

  assert.deepEqual(headings(tree), ["Posts cargados"]);
  assertHeadingsOutsideCards(tree);
  assertLiveSearch(tree, "blog-posts-search", "Buscar por título o etiqueta");
  const [section] = tableSections(tree);
  assert.equal(section.card.props.size, "sm");
  assert.match(section.card.props.className, /min-w-0/);
  assert.deepEqual(section.columns, [
    "Titulo",
    "Estado",
    "Audiencia",
    "Etiquetas",
    "Comentarios",
    "Publicado",
    "Acciones",
  ]);
  assert.match(section.table.props.className, /min-w-\[960px\]/);
  assert.deepEqual(
    section.badges.map((node) => [text(node), node.props.variant]),
    [
      ["Publicado", "success"],
      ["Publico", "info"],
      ["Borrador", "muted"],
      ["Miembros", "muted"],
    ],
  );

  const html = renderToStaticMarkup(tree);
  assert.match(html, /Bienvenida/);
  assert.match(html, /Novedades/);
  assert.match(html, /\/blog\/bienvenida/);
  assert.match(html, /\/dashboard\/blog\/p1\/edit/);
  assert.match(html, /aria-label="Eliminar Bienvenida"/);
  assert.equal(findAll((node) => node.type === "form", tree).length, 2);

  fixture.posts = [];
  const empty = await render();
  const [emptySection] = tableSections(empty);
  assert.deepEqual(emptyCell(emptySection), {
    span: 7,
    message: "Todavia no hay posts.",
  });
});

function usersHarness(fixture) {
  const exports = loadView("src/modules/users/views/dashboard-users-view.tsx", {
    "@/modules/users/server/user-invitations.actions": {
      listUsersForAdmin: async () => fixture.users,
      listUserInvitationsForAdmin: async () => fixture.invitations,
      listFamiliesForInvitationAdmin: async () => [],
      resendUserInvitationAction: async () => {},
      revokeUserInvitationAction: async () => {},
      updateUserRoleAction: async () => {},
    },
    "@/modules/users/components/create-user-invitation-form": {
      CreateUserInvitationForm: mockEl("form"),
    },
    "@/modules/users/components/user-delete-button": {
      UserDeleteButton: mockEl("button"),
    },
    "@/modules/roles/server/role.repository": {
      listAssignableRoles: async () => fixture.roles,
    },
  });
  return () =>
    exports.DashboardUsersView({
      currentAdminId: "u1",
      canManage: true,
      actorPermissions: ["users.manage"],
      currentRoleKey: "SUPERADMIN",
    });
}

test("users separate both listing titles from compact table containers", async () => {
  const fixture = {
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
  };
  const render = usersHarness(fixture);
  const tree = await render();

  assert.deepEqual(headings(tree), ["Usuarios creados", "Emails autorizados"]);
  assertHeadingsOutsideCards(tree);
  assertLiveSearch(tree, "users-search", "Buscar por nombre o email");
  assertLiveSearch(tree, "users-invitations-search", "Buscar por email o rol");
  const sections = tableSections(tree);
  assert.equal(sections.length, 2);
  for (const section of sections) {
    assert.equal(section.card.props.size, "sm");
    assert.match(section.card.props.className, /min-w-0/);
  }
  assert.deepEqual(sections[0].columns, [
    "Usuario",
    "Rol y alta",
    "Actualizar rol",
    "Acciones",
  ]);
  assert.deepEqual(sections[1].columns, [
    "Invitación",
    "Rol y estado",
    "Fechas",
    "Acción",
  ]);
  assert.match(sections[0].table.props.className, /min-w-\[720px\]/);
  assert.ok(
    sections[0].badges.some((node) => text(node) === "Docente" && node.props.variant === "info"),
  );
  assert.ok(
    sections[1].badges.some((node) => text(node) === "Pendiente" && node.props.variant === "warning"),
  );

  const html = renderToStaticMarkup(tree);
  assert.match(html, /ana@example\.com/);
  assert.match(html, /nueva@example\.com/);
  assert.match(html, /aria-label="Guardar rol de ana@example\.com"/);
  assert.match(html, />\s*Reenviar\s*</);
  assert.match(html, />\s*Revocar\s*</);
  assert.match(html, /Autorizar nuevo email/);

  fixture.users = [];
  fixture.invitations = [];
  const empty = await render();
  const emptySections = tableSections(empty);
  assert.deepEqual(emptyCell(emptySections[0]), {
    span: 4,
    message: "Todavia no hay usuarios creados.",
  });
  assert.deepEqual(emptyCell(emptySections[1]), {
    span: 4,
    message: "Todavia no hay emails autorizados.",
  });
});

function mailingHarness(fixture, canManage = true) {
  const exports = loadView("src/modules/mailing/views/dashboard-mailing-view.tsx", {
    "@/modules/mailing/server/mailing.actions": {
      listEmailMessagesForAdmin: async () => fixture.messages,
      listInvitationDeliveryJobsForAdmin: async () => fixture.jobs,
      sendInvitationDeliveryJobAction: async () => {},
    },
  });
  return () => exports.DashboardMailingView({ canManage });
}

test("mailing separates both subsections from compact table containers", async () => {
  const fixture = {
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
    ],
  };
  const render = mailingHarness(fixture);
  const tree = await render();

  assert.deepEqual(headings(tree), ["Entregas de invitaciones", "Historial de mailing"]);
  assertHeadingsOutsideCards(tree);
  assertLiveSearch(tree, "mailing-jobs-search", "Buscar por email o estado");
  assertLiveSearch(tree, "mailing-history-search", "Buscar por asunto o destinatario");
  const sections = tableSections(tree);
  assert.equal(sections.length, 2);
  for (const section of sections) {
    assert.equal(section.card.props.size, "sm");
    assert.match(section.card.props.className, /min-w-0/);
  }
  assert.deepEqual(sections[0].columns, [
    "Invitación",
    "Estado",
    "Intentos",
    "Próximo intento",
    "Detalle",
    "Acción",
  ]);
  assert.deepEqual(sections[1].columns, [
    "Tipo",
    "Asunto",
    "Destinatarios",
    "Estado",
    "Proveedor",
    "Creado",
    "Error",
  ]);
  assert.match(sections[0].table.props.className, /min-w-\[960px\]/);
  assert.match(sections[1].table.props.className, /min-w-\[1120px\]/);
  assert.ok(
    sections[0].badges.some((node) => text(node) === "Pendiente" && node.props.variant === "warning"),
  );
  assert.ok(
    sections[1].badges.some((node) => text(node) === "Enviado" && node.props.variant === "success"),
  );

  const html = renderToStaticMarkup(tree);
  assert.match(html, /Pendientes/);
  assert.match(html, /familia@example\.com/);
  assert.match(html, /Invitación Koru/);
  assert.match(html, />\s*Enviar\s*</);
  assert.equal(findAll((node) => node.type === "form", tree).length, 1);

  fixture.jobs = [];
  fixture.messages = [];
  const empty = await render();
  const emptySections = tableSections(empty);
  assert.deepEqual(emptyCell(emptySections[0]), {
    span: 6,
    message: "Todavía no hay entregas de invitaciones registradas.",
  });
  assert.deepEqual(emptyCell(emptySections[1]), {
    span: 7,
    message: "Todavía no hay emails registrados.",
  });
});
