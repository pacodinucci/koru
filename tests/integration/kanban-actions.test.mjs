import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, mocks) {
  const module = { exports: {} };
  const source = readFileSync(new URL(`../../src/${path}.ts`, import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(output, { module, exports: module.exports, Date, Set, require: (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === "server-only") return {};
    if (id === "zod") return require(id);
    if (id.startsWith("@/modules/kanban/") || id === "@/modules/auth/permissions/permission-catalog") return load(id.slice(2), mocks);
    throw Error(`Unexpected dependency ${id}`);
  } });
  return module.exports;
}
const plain = (value) => JSON.parse(JSON.stringify(value));

// Transactional Prisma double: only the production row-lock query serializes callers.
// No real PostgreSQL, FK enforcement or lock scheduler is claimed by this suite.
function app() {
  let data = { kanbanBoard: [], kanbanStatus: [], kanbanCard: [], kanbanStatusWatch: [], kanbanNotification: [], user: [
    { id: "teacher", name: "Docente", role: "TEACHER", accessRoleId: null, accessRole: null },
    { id: "parent", name: "Familia", role: "PARENT", accessRoleId: null, accessRole: null },
    { id: "custom", name: "Interno", role: "PARENT", accessRoleId: "r1", accessRole: { isActive: true, permissions: [{ permission: { key: "dashboard.access" } }] } },
    { id: "disabled", name: "Inactivo", role: "ADMIN", accessRoleId: "r2", accessRole: { isActive: false, permissions: [{ permission: { key: "dashboard.access" } }] } },
    { id: "no-access", name: "Sin acceso", role: "ADMIN", accessRoleId: "r3", accessRole: { isActive: true, permissions: [] } },
  ] };
  let nextId = 0, denied = false, cardUpdatesUntilFailure = -1, failStatusCreate = false, actor = "teacher";
  let notificationsUntilFailure = -1, failDeletion = false;
  let lockTail = Promise.resolve();
  const effects = { guards: 0, reads: 0, writes: 0, refreshes: 0, locks: 0 };
  const matches = (row, where = {}) => Object.entries(where).every(([key, value]) => {
    if (key === "OR") return value.some((clause) => matches(row, clause));
    if (key === "AND") return value.every((clause) => matches(row, clause));
    if (value && typeof value === "object") {
      if ("in" in value) return value.in.includes(row[key]);
      if ("not" in value) return row[key] !== value.not;
    }
    return row[key] === value;
  });
  function client(state) {
    const db = {};
    function decorate(model, row, args = {}) {
      if (!row) return null;
      const result = { ...row };
      if (args.include?.statuses) result.statuses = db.kanbanStatus.findManySync({ ...args.include.statuses, where: { boardId: row.id } });
      if (args.include?.cards) result.cards = db.kanbanCard.findManySync({ ...args.include.cards, where: { statusId: row.id } });
      if (args.include?.watches) result.watches = db.kanbanStatusWatch.findManySync({ ...args.include.watches, where: { statusId: row.id } });
      if (args.include?.user) result.user = { ...state.user.find((u) => u.id === row.userId) };
      if (args.include?._count) result._count = { cards: state.kanbanCard.filter((c) => c.boardId === row.id).length };
      return result;
    }
    for (const model of Object.keys(state)) {
      const many = (args = {}) => {
        let rows = state[model].filter((row) => matches(row, args.where));
        const order = args.orderBy ? (Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]) : [];
        rows = [...rows].sort((a, b) => {
          for (const clause of order) for (const [key, direction] of Object.entries(clause)) {
            const cmp = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
            if (cmp) return direction === "desc" ? -cmp : cmp;
          }
          return 0;
        });
        return rows.map((row) => decorate(model, row, args));
      };
      db[model] = {
        findManySync: many, findMany: async (args) => { effects.reads++; return many(args); },
        findUnique: async (args) => { effects.reads++; return decorate(model, state[model].find((row) => matches(row, args.where)), args); },
        findFirst: async (args) => { effects.reads++; return many(args)[0] ?? null; },
        count: async (args) => { effects.reads++; return many(args).length; },
        create: async ({ data: input }) => {
          if (model === "kanbanStatus" && failStatusCreate && input.position === 1) throw Error("fallo simulado");
          effects.writes++;
          if (model === "kanbanNotification") {
            if (notificationsUntilFailure === 0) throw Error("fallo de aviso");
            if (notificationsUntilFailure > 0) notificationsUntilFailure--;
          }
          const defaults = model === "kanbanStatus" ? { archivedAt: null, trashedAt: null, holdEnabled: false }
            : model === "kanbanCard" ? { onHold: false } : model === "kanbanNotification" ? { createdAt: new Date(), readAt: null, cardId: null } : {};
          const row = { id: `id-${++nextId}`, description: null, assigneeId: null, dueDate: null, ...defaults, ...input };
          state[model].push(row); return { ...row };
        },
        update: async ({ where, data: changes }) => {
          if (model === "kanbanCard") {
            if (cardUpdatesUntilFailure === 0) throw Error("fallo simulado");
            if (cardUpdatesUntilFailure > 0) cardUpdatesUntilFailure--;
          }
          const row = state[model].find((row) => matches(row, where));
          assert.ok(row, `${model} update target exists`); effects.writes++; Object.assign(row, changes); return { ...row };
        },
        delete: async ({ where }) => {
          if (model === "kanbanStatus" && failDeletion) throw Error("fallo de eliminación");
          const index = state[model].findIndex((row) => matches(row, where));
          assert.notEqual(index, -1); effects.writes++; return state[model].splice(index, 1)[0];
        },
        deleteMany: async ({ where }) => {
          const old = state[model].length; state[model] = state[model].filter((row) => !matches(row, where));
          effects.writes += old - state[model].length; return { count: old - state[model].length };
        },
      };
    }
    return db;
  }
  const prisma = { ...client(data), $transaction: async (callback, options) => {
    assert.equal(options?.isolationLevel, "ReadCommitted");
    let state = structuredClone(data), release, initialWrites = effects.writes;
    const tx = { $queryRaw: async (strings, id) => {
      assert.match(strings.join("?"), /SELECT.*KanbanBoard.*FOR UPDATE/s);
      assert.equal(typeof id, "string");
      const before = lockTail; lockTail = new Promise((resolve) => { release = resolve; });
      await before; effects.locks++; state = structuredClone(data); initialWrites = effects.writes;
      Object.assign(tx, client(state));
      return state.kanbanBoard.filter((b) => b.id === id).map(({ id }) => ({ id }));
    } };
    // Board creation has no existing board row to lock.
    Object.assign(tx, client(state));
    try {
      const result = await callback(tx);
      for (const key of Object.keys(data)) data[key] = state[key];
      return result;
    } catch (error) {
      effects.writes = initialWrites;
      throw error;
    } finally { release?.(); }
  } };
  const api = load("modules/kanban/server/kanban.actions", {
    "@/lib/prisma": { prisma },
    "@/modules/auth/server/auth-guards": { requireDashboardUser: async () => { effects.guards++; if (denied) throw Error("Acceso denegado."); return { id: actor }; } },
    "next/cache": { revalidatePath: (path) => { assert.equal(path, "/dashboard/kanban"); effects.refreshes++; } },
  });
  return { api, effects, deny: (value) => { denied = value; }, fail: (value) => { cardUpdatesUntilFailure = typeof value === "number" ? value : value ? 0 : -1; }, failDefaults: (value) => { failStatusCreate = value; }, actor: (value) => { actor = value; }, failNotifications: (value) => { notificationsUntilFailure = typeof value === "number" ? value : value ? 0 : -1; }, failDeletion: (value) => { failDeletion = value; }, snapshot: () => JSON.stringify(data) };
}
async function board(ctx, name = "Trabajo") {
  const { id } = await ctx.api.createBoardAction({ name });
  return plain(await ctx.api.getBoardAction(id));
}
async function reject(ctx, action, message) {
  const before = ctx.snapshot(), refreshes = ctx.effects.refreshes, writes = ctx.effects.writes;
  await assert.rejects(action, { message });
  assert.equal(ctx.snapshot(), before, "rejection leaves all stored board/status/card data unchanged");
  assert.equal(ctx.effects.writes, writes, "rejection leaves committed write counters unchanged");
  assert.equal(ctx.effects.refreshes, refreshes, "rejection does not announce persistence");
}

test("S1-S4 every L5 action checks dashboard access before reads or writes", async () => {
  const ctx = app(); ctx.deny(true);
  const calls = [() => ctx.api.listBoardsAction(), () => ctx.api.getBoardAction("b"), () => ctx.api.listAssigneesAction(), () => ctx.api.listKanbanNotificationsAction(),
    ...["createBoard", "updateBoard", "deleteBoard", "createStatus", "updateStatus", "reorderStatuses", "deleteStatus", "createCard", "updateCard", "deleteCard", "moveCard", "setStatusWatching", "setStatusHoldEnabled", "setCardOnHold", "setStatusLifecycle", "permanentlyDeleteStatus", "markKanbanNotificationRead"].map((name) => () => ctx.api[`${name}Action`]({}))];
  for (const call of calls) await reject(ctx, call, "Acceso denegado.");
  assert.equal(ctx.effects.guards, 21); assert.equal(ctx.effects.writes, 0); assert.equal(ctx.effects.locks, 0); assert.equal(ctx.effects.reads, 0);
});

test("S1-S4 shared board lifecycle, default editable columns and summaries", async () => {
  const ctx = app(); assert.deepEqual(plain(await ctx.api.listBoardsAction()), []);
  const b = await board(ctx, "  Equipo  ");
  assert.equal(b.name, "Equipo"); assert.equal(b.description, null);
  assert.deepEqual(b.statuses.map((s) => [s.name, s.position, s.cards.length]), [["Pendiente", 0, 0], ["En curso", 1, 0], ["Hecho", 2, 0]]);
  ctx.actor("custom"); // A different authorized internal user can manage the same board.
  await ctx.api.updateBoardAction({ id: b.id, name: "Nuevo", description: " Descripción " });
  await ctx.api.updateStatusAction({ boardId: b.id, id: b.statuses[0].id, name: "Por hacer", color: "#123abc" });
  assert.deepEqual(plain(await ctx.api.listBoardsAction()), [{ id: b.id, name: "Nuevo", description: "Descripción", cardCount: 0 }]);
  const changed = plain(await ctx.api.getBoardAction(b.id)); assert.equal(changed.statuses[0].name, "Por hacer"); assert.equal(changed.statuses[0].color, "#123abc");
  await ctx.api.createCardAction({ boardId: b.id, statusId: b.statuses[0].id, title: "Tarea" });
  assert.equal((await ctx.api.listBoardsAction())[0].cardCount, 1);
  await ctx.api.deleteBoardAction({ id: b.id }); assert.equal(await ctx.api.getBoardAction(b.id), null); assert.deepEqual(plain(await ctx.api.listBoardsAction()), []);
});

test("S2 board creation rolls back the board and default columns on failure", async () => {
  const ctx = app(); ctx.failDefaults(true);
  await reject(ctx, () => ctx.api.createBoardAction({ name: "Sin creación parcial" }), "fallo simulado");
  assert.deepEqual(plain(await ctx.api.listBoardsAction()), []);
});

test("S2 status creation/reorder requires a full unique permutation and board-local ids", async () => {
  const ctx = app(), b = await board(ctx), other = await board(ctx, "Otro");
  await ctx.api.createStatusAction({ boardId: b.id, name: "Revisión", color: "#abcdef" });
  let current = plain(await ctx.api.getBoardAction(b.id)); assert.equal(current.statuses[3].position, 3);
  const ids = current.statuses.map((s) => s.id).reverse();
  await ctx.api.reorderStatusesAction({ boardId: b.id, statusIds: ids });
  current = plain(await ctx.api.getBoardAction(b.id)); assert.deepEqual(current.statuses.map((s) => s.id), ids); assert.deepEqual(current.statuses.map((s) => s.position), [0, 1, 2, 3]);
  for (const statusIds of [ids.slice(1), [ids[0], ...ids.slice(0, 3)], [...ids.slice(0, 3), other.statuses[0].id]]) await reject(ctx, () => ctx.api.reorderStatusesAction({ boardId: b.id, statusIds }), "Incluí todos los estados del tablero una sola vez.");
  await reject(ctx, () => ctx.api.updateStatusAction({ boardId: b.id, id: other.statuses[0].id, name: "Ajeno", color: "#ffffff" }), "El estado no pertenece a este tablero.");
});

test("S2 nonempty column deletion requires same-board destination, relocates atomically, protects last column", async () => {
  const ctx = app(), b = await board(ctx), other = await board(ctx, "Otro");
  const [source, target, empty] = b.statuses;
  await ctx.api.createCardAction({ boardId: b.id, statusId: source.id, title: "Uno" });
  await ctx.api.createCardAction({ boardId: b.id, statusId: source.id, title: "Dos" });
  await ctx.api.createCardAction({ boardId: b.id, statusId: target.id, title: "Previo" });
  const base = { boardId: b.id, id: source.id };
  await reject(ctx, () => ctx.api.deleteStatusAction(base), "Elegí un estado de destino para las tarjetas.");
  for (const destinationStatusId of [source.id, other.statuses[0].id, "missing"]) await reject(ctx, () => ctx.api.deleteStatusAction({ ...base, destinationStatusId }), "Elegí otro estado del mismo tablero como destino.");
  ctx.fail(1); await reject(ctx, () => ctx.api.deleteStatusAction({ ...base, destinationStatusId: target.id }), "fallo simulado"); ctx.fail(false);
  await ctx.api.deleteStatusAction({ ...base, destinationStatusId: target.id });
  let current = plain(await ctx.api.getBoardAction(b.id));
  assert.deepEqual(current.statuses[0].cards.map((c) => [c.title, c.position]), [["Previo", 0], ["Uno", 1], ["Dos", 2]]);
  assert.deepEqual(current.statuses.map((s) => s.position), [0, 1]);
  await ctx.api.deleteStatusAction({ boardId: b.id, id: empty.id });
  await reject(ctx, () => ctx.api.deleteStatusAction({ boardId: b.id, id: target.id }), "El tablero debe conservar al menos un estado.");
});

test("S1-S4 card lifecycle, internal responsible users, ISO dates and null clearing", async () => {
  const ctx = app(), b = await board(ctx), statusId = b.statuses[0].id;
  assert.deepEqual(plain(await ctx.api.listAssigneesAction()).map((u) => u.id).sort(), ["custom", "teacher"]);
  await ctx.api.createCardAction({ boardId: b.id, statusId, title: "  Tarea  ", description: " Detalle ", assigneeId: "teacher", dueDate: "2024-02-29" });
  let card = (await ctx.api.getBoardAction(b.id)).statuses[0].cards[0];
  assert.deepEqual(plain(card), { id: card.id, title: "Tarea", description: "Detalle", assigneeId: "teacher", dueDate: "2024-02-29T00:00:00.000Z", position: 0, onHold: false });
  await ctx.api.updateCardAction({ boardId: b.id, id: card.id, title: "Cambio", assigneeId: "custom", dueDate: "2026-10-20T12:30:00.000Z" });
  card = (await ctx.api.getBoardAction(b.id)).statuses[0].cards[0]; assert.equal(card.description, null); assert.equal(card.assigneeId, "custom"); assert.equal(card.dueDate, "2026-10-20T12:30:00.000Z");
  for (const assigneeId of ["parent", "disabled", "no-access", "missing"]) await reject(ctx, () => ctx.api.updateCardAction({ boardId: b.id, id: card.id, title: "Cambio", assigneeId }), "La persona responsable debe tener acceso al dashboard.");
  for (const dueDate of ["2025-02-29", "2024-02-30", "2024-13-01", "ayer", "2024-02-30T00:00:00Z", "2024-01-01T25:00:00Z"]) await reject(ctx, () => ctx.api.updateCardAction({ boardId: b.id, id: card.id, title: "Cambio", dueDate }), "Indicá una fecha de vencimiento válida.");
  await ctx.api.updateCardAction({ boardId: b.id, id: card.id, title: "Sin fecha", assigneeId: null, dueDate: null });
  card = (await ctx.api.getBoardAction(b.id)).statuses[0].cards[0]; assert.equal(card.assigneeId, null); assert.equal(card.dueDate, null);
  await ctx.api.deleteCardAction({ boardId: b.id, id: card.id }); assert.equal((await ctx.api.listBoardsAction())[0].cardCount, 0);
});

test("S1-S4 rejects invalid data and cross-board card/status mutations without effects", async () => {
  const ctx = app(), b = await board(ctx), other = await board(ctx, "Otro");
  await reject(ctx, () => ctx.api.getBoardAction(` ${b.id} `), "Identificador inválido.");
  for (const [name, message] of [["deleteBoard", "Identificador inválido."], ["deleteStatus", "Identificador inválido."], ["deleteCard", "Identificador inválido."], ["reorderStatuses", "Incluí todos los estados del tablero una sola vez."], ["moveCard", "Indicá una posición válida para la tarjeta."]]) await reject(ctx, () => ctx.api[`${name}Action`](null), message);
  await reject(ctx, () => ctx.api.createBoardAction({ name: " " }), "Revisá el nombre y la descripción del tablero.");
  await reject(ctx, () => ctx.api.updateBoardAction({ id: b.id, name: "x".repeat(121) }), "Revisá el nombre y la descripción del tablero.");
  await reject(ctx, () => ctx.api.createStatusAction({ boardId: b.id, name: "X", color: "red" }), "Revisá el nombre y el color del estado.");
  await reject(ctx, () => ctx.api.createCardAction({ boardId: b.id, statusId: b.statuses[0].id, title: " " }), "Revisá el título y la descripción de la tarjeta.");
  await reject(ctx, () => ctx.api.createCardAction({ boardId: b.id, statusId: other.statuses[0].id, title: "Ajena" }), "El estado no pertenece a este tablero.");
  await ctx.api.createCardAction({ boardId: other.id, statusId: other.statuses[0].id, title: "Privada del tablero" });
  const card = (await ctx.api.getBoardAction(other.id)).statuses[0].cards[0];
  for (const call of [() => ctx.api.updateCardAction({ boardId: b.id, id: card.id, title: "Cambio" }), () => ctx.api.deleteCardAction({ boardId: b.id, id: card.id }), () => ctx.api.moveCardAction({ boardId: b.id, id: card.id, statusId: b.statuses[0].id, position: 0 })]) await reject(ctx, call, "La tarjeta no pertenece a este tablero.");
  await reject(ctx, () => ctx.api.createStatusAction({ boardId: "missing", name: "X", color: "#123abc" }), "El tablero no existe.");
});

test("S2 cards move across/within columns with contiguous order; reject invalid positions/destinations", async () => {
  const ctx = app(), b = await board(ctx), other = await board(ctx, "Otro"), [source, target] = b.statuses;
  for (const title of ["A", "B", "C"]) await ctx.api.createCardAction({ boardId: b.id, statusId: source.id, title });
  let cards = (await ctx.api.getBoardAction(b.id)).statuses[0].cards;
  await ctx.api.moveCardAction({ boardId: b.id, id: cards[2].id, statusId: source.id, position: 0 });
  cards = (await ctx.api.getBoardAction(b.id)).statuses[0].cards; assert.deepEqual(plain(cards.map((c) => [c.title, c.position])), [["C", 0], ["A", 1], ["B", 2]]);
  for (const position of [-1, 1.5, NaN, Infinity, 3]) await reject(ctx, () => ctx.api.moveCardAction({ boardId: b.id, id: cards[0].id, statusId: target.id, position }), "Indicá una posición válida para la tarjeta.");
  await reject(ctx, () => ctx.api.moveCardAction({ boardId: b.id, id: cards[0].id, statusId: other.statuses[0].id, position: 0 }), "El estado no pertenece a este tablero.");
  await ctx.api.moveCardAction({ boardId: b.id, id: cards[0].id, statusId: target.id, position: 0 });
  let current = plain(await ctx.api.getBoardAction(b.id)); assert.deepEqual(current.statuses[0].cards.map((c) => [c.title, c.position]), [["A", 0], ["B", 1]]); assert.equal(current.statuses[1].cards[0].title, "C");
  await ctx.api.deleteCardAction({ boardId: b.id, id: cards[1].id }); current = plain(await ctx.api.getBoardAction(b.id)); assert.deepEqual(current.statuses[0].cards.map((c) => [c.title, c.position]), [["B", 0]]);
});

test("S2 serialization prevents duplicate append positions and stale move/delete outcomes", async () => {
  const ctx = app(), b = await board(ctx), [source, target] = b.statuses;
  await Promise.all(["A", "B", "C"].map((title) => ctx.api.createCardAction({ boardId: b.id, statusId: source.id, title })));
  let current = plain(await ctx.api.getBoardAction(b.id)); assert.deepEqual(current.statuses[0].cards.map((c) => c.position), [0, 1, 2]);
  const [a, bb] = current.statuses[0].cards;
  await Promise.all([ctx.api.moveCardAction({ boardId: b.id, id: a.id, statusId: target.id, position: 0 }), ctx.api.moveCardAction({ boardId: b.id, id: bb.id, statusId: target.id, position: 0 })]);
  current = plain(await ctx.api.getBoardAction(b.id)); assert.deepEqual(current.statuses[1].cards.map((c) => [c.title, c.position]), [["B", 0], ["A", 1]]);
  const results = await Promise.allSettled([ctx.api.deleteStatusAction({ boardId: b.id, id: target.id, destinationStatusId: source.id }), ctx.api.moveCardAction({ boardId: b.id, id: a.id, statusId: target.id, position: 0 })]);
  assert.equal(results[0].status, "fulfilled"); assert.equal(results[1].status, "rejected"); assert.equal(results[1].reason.message, "El estado no pertenece a este tablero.");
  current = plain(await ctx.api.getBoardAction(b.id)); assert.deepEqual(current.statuses[0].cards.map((c) => c.position), [0, 1, 2]); assert.equal((await ctx.api.listBoardsAction())[0].cardCount, 3);
  await Promise.all([ctx.api.createStatusAction({ boardId: b.id, name: "X", color: "#000000" }), ctx.api.createStatusAction({ boardId: b.id, name: "Y", color: "#ffffff" })]);
  current = plain(await ctx.api.getBoardAction(b.id)); assert.deepEqual(current.statuses.map((s) => s.position), [0, 1, 2, 3]);
});

test("S2 concurrent deletions retain the last column and board deletion excludes stale writers", async () => {
  const ctx = app(), b = await board(ctx);
  await ctx.api.deleteStatusAction({ boardId: b.id, id: b.statuses[2].id });
  const outcomes = await Promise.allSettled(b.statuses.slice(0, 2).map((status) => ctx.api.deleteStatusAction({ boardId: b.id, id: status.id })));
  assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(outcomes.find((r) => r.status === "rejected").reason.message, "El tablero debe conservar al menos un estado.");
  const current = plain(await ctx.api.getBoardAction(b.id)); assert.equal(current.statuses.length, 1);
  const statusId = current.statuses[0].id;
  await ctx.api.createCardAction({ boardId: b.id, statusId, title: "Existente" });
  const card = (await ctx.api.getBoardAction(b.id)).statuses[0].cards[0];
  const results = await Promise.allSettled([
    ctx.api.deleteBoardAction({ id: b.id }),
    ctx.api.createCardAction({ boardId: b.id, statusId, title: "Tardía" }),
    ctx.api.moveCardAction({ boardId: b.id, id: card.id, statusId, position: 0 }),
  ]);
  assert.equal(results[0].status, "fulfilled");
  for (const result of results.slice(1)) { assert.equal(result.status, "rejected"); assert.equal(result.reason.message, "El tablero no existe."); }
  assert.equal(await ctx.api.getBoardAction(b.id), null); assert.deepEqual(plain(await ctx.api.listBoardsAction()), []);
});

const currentStatus = async (ctx, boardId, id) => plain((await ctx.api.getBoardAction(boardId)).statuses.find((s) => s.id === id));
const watch = (ctx, boardId, id, watching = true) => ctx.api.setStatusWatchingAction({ boardId, id, watching });
const lifecycle = (ctx, boardId, id, state) => ctx.api.setStatusLifecycleAction({ boardId, id, state });

test("S1-S3/S5 column defaults, no-color rename and personal idempotent followers use the actor", async () => {
  const ctx = app(), b = await board(ctx), [s] = b.statuses;
  assert.deepEqual([s.archivedAt, s.trashedAt, s.holdEnabled, s.watching, s.watchers], [null, null, false, false, []]);
  const locks = ctx.effects.locks;
  await watch(ctx, b.id, s.id); await watch(ctx, b.id, s.id);
  assert.equal(ctx.effects.locks, locks + 2);
  let status = await currentStatus(ctx, b.id, s.id);
  assert.equal(status.watching, true); assert.deepEqual(status.watchers, [{ id: "teacher", name: "Docente" }]);
  ctx.actor("custom"); status = await currentStatus(ctx, b.id, s.id); assert.equal(status.watching, false);
  await ctx.api.setStatusWatchingAction({ boardId: b.id, id: s.id, watching: true, userId: "parent" });
  await watch(ctx, b.id, s.id, false); await watch(ctx, b.id, s.id, false);
  assert.deepEqual((await currentStatus(ctx, b.id, s.id)).watchers, [{ id: "teacher", name: "Docente" }]);
  await ctx.api.setStatusHoldEnabledAction({ boardId: b.id, id: s.id, enabled: true });
  await ctx.api.createCardAction({ boardId: b.id, statusId: s.id, title: "Preservar" });
  const beforeRename = await currentStatus(ctx, b.id, s.id);
  await ctx.api.updateStatusAction({ boardId: b.id, id: s.id, name: "Sin color", color: "" });
  status = await currentStatus(ctx, b.id, s.id);
  assert.deepEqual(status, { ...beforeRename, name: "Sin color", color: "" }); assert.equal(status.color, ""); assert.equal(status.name, "Sin color"); assert.equal(status.position, s.position); assert.equal(status.watchers.length, 1);
  await reject(ctx, () => ctx.api.setStatusWatchingAction({ boardId: b.id, id: s.id, watching: "true" }), "Indica si quieres seguir la columna.");
  const other = await board(ctx, "Otro");
  await reject(ctx, () => watch(ctx, b.id, other.statuses[0].id), "El estado no pertenece a este tablero.");
});

test("S2 hold opt-in is per card, reversible and preserves metadata and column settings", async () => {
  const ctx = app(), b = await board(ctx), [s] = b.statuses;
  await ctx.api.createCardAction({ boardId: b.id, statusId: s.id, title: "Conservar", description: "Detalle", assigneeId: "teacher", dueDate: "2026-10-20" });
  const original = (await currentStatus(ctx, b.id, s.id)).cards[0];
  await reject(ctx, () => ctx.api.setCardOnHoldAction({ boardId: b.id, id: original.id, onHold: true }), "Primero habilita las tareas en espera en esta columna.");
  await ctx.api.setStatusHoldEnabledAction({ boardId: b.id, id: s.id, enabled: true });
  assert.deepEqual((await currentStatus(ctx, b.id, s.id)).cards[0], original);
  await ctx.api.setCardOnHoldAction({ boardId: b.id, id: original.id, onHold: true });
  assert.deepEqual((await currentStatus(ctx, b.id, s.id)).cards[0], { ...original, onHold: true });
  await ctx.api.setStatusHoldEnabledAction({ boardId: b.id, id: s.id, enabled: false });
  assert.equal((await currentStatus(ctx, b.id, s.id)).cards[0].onHold, true);
  await ctx.api.setCardOnHoldAction({ boardId: b.id, id: original.id, onHold: false });
  assert.deepEqual((await currentStatus(ctx, b.id, s.id)).cards[0], original);
  await reject(ctx, () => ctx.api.setStatusHoldEnabledAction({ boardId: b.id, id: s.id, enabled: 1 }), "Indica si quieres habilitar las tareas en espera.");
  await reject(ctx, () => ctx.api.setCardOnHoldAction({ boardId: b.id, id: original.id, onHold: "false" }), "Indica si la tarjeta está en espera.");
});

test("S2 archive/trash restore exact cards/settings, reject normal edits and inactive moves", async () => {
  const ctx = app(), b = await board(ctx), [s, target] = b.statuses;
  await watch(ctx, b.id, s.id); await ctx.api.setStatusHoldEnabledAction({ boardId: b.id, id: s.id, enabled: true });
  await ctx.api.createCardAction({ boardId: b.id, statusId: s.id, title: "Historial", assigneeId: "teacher", dueDate: "2026-10-20" });
  let original = await currentStatus(ctx, b.id, s.id); const card = original.cards[0];
  await ctx.api.setCardOnHoldAction({ boardId: b.id, id: card.id, onHold: true }); original = await currentStatus(ctx, b.id, s.id);
  await ctx.api.createCardAction({ boardId: b.id, statusId: target.id, title: "Activa" });
  const activeCard = (await currentStatus(ctx, b.id, target.id)).cards[0];
  for (const state of ["archived", "trashed"]) {
    await lifecycle(ctx, b.id, s.id, state);
    const inactive = await currentStatus(ctx, b.id, s.id);
    assert.equal(Boolean(inactive.archivedAt), state === "archived"); assert.equal(Boolean(inactive.trashedAt), state === "trashed");
    assert.deepEqual(inactive.cards, original.cards); assert.deepEqual(inactive.watchers, original.watchers);
    for (const action of [
      () => ctx.api.updateStatusAction({ boardId: b.id, id: s.id, name: "No", color: "" }),
      () => watch(ctx, b.id, s.id, false),
      () => ctx.api.setStatusHoldEnabledAction({ boardId: b.id, id: s.id, enabled: false }),
      () => ctx.api.createCardAction({ boardId: b.id, statusId: s.id, title: "No" }),
      () => ctx.api.updateCardAction({ boardId: b.id, id: card.id, title: "No" }),
      () => ctx.api.deleteCardAction({ boardId: b.id, id: card.id }),
      () => ctx.api.setCardOnHoldAction({ boardId: b.id, id: card.id, onHold: false }),
      () => ctx.api.moveCardAction({ boardId: b.id, id: card.id, statusId: target.id, position: 0 }),
      () => ctx.api.moveCardAction({ boardId: b.id, id: activeCard.id, statusId: s.id, position: 0 }),
      () => ctx.api.deleteStatusAction({ boardId: b.id, id: s.id, destinationStatusId: target.id }),
    ]) await reject(ctx, action, "La columna está archivada o en la papelera.");
    await reject(ctx, () => ctx.api.deleteStatusAction({ boardId: b.id, id: target.id, destinationStatusId: s.id }), "Elegí otro estado del mismo tablero como destino.");
    const activeIds = b.statuses.filter((item) => item.id !== s.id).map((item) => item.id).reverse();
    await ctx.api.reorderStatusesAction({ boardId: b.id, statusIds: activeIds });
    await reject(ctx, () => ctx.api.reorderStatusesAction({ boardId: b.id, statusIds: b.statuses.map((item) => item.id) }), "Incluí todos los estados del tablero una sola vez.");
    await lifecycle(ctx, b.id, s.id, "active");
    assert.deepEqual(await currentStatus(ctx, b.id, s.id), original);
  }
  await reject(ctx, () => lifecycle(ctx, b.id, s.id, "deleted"), "Elige un estado válido para la columna.");
});

test("S2 concurrent lifecycle changes retain the last active column", async () => {
  const ctx = app(), b = await board(ctx);
  await lifecycle(ctx, b.id, b.statuses[2].id, "archived");
  const results = await Promise.allSettled(b.statuses.slice(0, 2).map((s) => lifecycle(ctx, b.id, s.id, "trashed")));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.find((r) => r.status === "rejected").reason.message, "El tablero debe conservar al menos un estado.");
  const statuses = (await ctx.api.getBoardAction(b.id)).statuses, active = statuses.find((s) => !s.archivedAt && !s.trashedAt);
  await reject(ctx, () => lifecycle(ctx, b.id, active.id, "archived"), "El tablero debe conservar al menos un estado.");
  await reject(ctx, () => ctx.api.deleteStatusAction({ boardId: b.id, id: active.id }), "El tablero debe conservar al menos un estado.");
  await lifecycle(ctx, b.id, b.statuses[2].id, "active");
  await lifecycle(ctx, b.id, active.id, "archived");
});

test("S2/S5 permanent deletion requires trash, guards ownership and rolls back contained card deletion", async () => {
  const ctx = app(), b = await board(ctx), other = await board(ctx, "Otro"), [s] = b.statuses;
  await watch(ctx, b.id, s.id); await ctx.api.createCardAction({ boardId: b.id, statusId: s.id, title: "Destruir" });
  const del = () => ctx.api.permanentlyDeleteStatusAction({ boardId: b.id, id: s.id });
  await reject(ctx, del, "Primero mueve la columna a la papelera.");
  await lifecycle(ctx, b.id, s.id, "archived"); await reject(ctx, del, "Primero mueve la columna a la papelera.");
  await lifecycle(ctx, b.id, s.id, "trashed");
  const trashedAt = (await currentStatus(ctx, b.id, s.id)).trashedAt;
  await lifecycle(ctx, b.id, s.id, "trashed");
  assert.equal((await currentStatus(ctx, b.id, s.id)).trashedAt, trashedAt);
  await reject(ctx, () => ctx.api.permanentlyDeleteStatusAction({ boardId: other.id, id: s.id }), "El estado no pertenece a este tablero.");
  ctx.failDeletion(true); await reject(ctx, del, "fallo de eliminación"); ctx.failDeletion(false);
  await del(); assert.equal((await ctx.api.getBoardAction(b.id)).statuses.some((x) => x.id === s.id), false);
  assert.equal((await ctx.api.listBoardsAction()).find((x) => x.id === b.id).cardCount, 0);
  await reject(ctx, () => lifecycle(ctx, b.id, s.id, "active"), "El estado no pertenece a este tablero.");
});

test("S3/S5 persistent column notifications cover create/edit/move/hold, recipients and read markers", async () => {
  const ctx = app(), b = await board(ctx), [source, target, unwatched] = b.statuses;
  await watch(ctx, b.id, source.id); ctx.actor("custom"); await watch(ctx, b.id, target.id);
  await ctx.api.createCardAction({ boardId: b.id, statusId: source.id, title: "Aviso" });
  const card = (await currentStatus(ctx, b.id, source.id)).cards[0];
  assert.deepEqual(plain(await ctx.api.listKanbanNotificationsAction()), []);
  ctx.actor("teacher");
  let notices = plain(await ctx.api.listKanbanNotificationsAction()); assert.equal(notices.length, 1);
  assert.deepEqual(Object.keys(notices[0]).sort(), ["boardId", "cardId", "createdAt", "id", "message", "readAt", "statusId"].sort());
  assert.equal(notices[0].message, 'Se agregó la tarjeta "Aviso" a "Pendiente".');
  assert.deepEqual([notices[0].boardId, notices[0].statusId, notices[0].cardId, notices[0].readAt], [b.id, source.id, card.id, null]);
  assert.ok(Number.isFinite(Date.parse(notices[0].createdAt)));
  await ctx.api.updateCardAction({ boardId: b.id, id: card.id, title: "Editada" });
  await ctx.api.setStatusHoldEnabledAction({ boardId: b.id, id: source.id, enabled: true });
  await ctx.api.setCardOnHoldAction({ boardId: b.id, id: card.id, onHold: true });
  await ctx.api.setCardOnHoldAction({ boardId: b.id, id: card.id, onHold: true }); // no duplicate notice for a no-op
  await ctx.api.moveCardAction({ boardId: b.id, id: card.id, statusId: target.id, position: 0 });
  notices = plain(await ctx.api.listKanbanNotificationsAction());
  assert.equal(notices.length, 4);
  assert.deepEqual(new Set(notices.map((n) => n.message)), new Set([
    'Se agregó la tarjeta "Aviso" a "Pendiente".', 'Se actualizó la tarjeta "Editada" en "Pendiente".',
    'La tarjeta "Editada" quedó en espera en "Pendiente".', 'La tarjeta "Editada" salió de "Pendiente" hacia "En curso".',
  ]));
  const locks = ctx.effects.locks;
  await ctx.api.markKanbanNotificationReadAction({ id: notices[0].id, userId: "custom" });
  const readAt = (await ctx.api.listKanbanNotificationsAction()).find((n) => n.id === notices[0].id).readAt;
  assert.ok(Number.isFinite(Date.parse(readAt)));
  await ctx.api.markKanbanNotificationReadAction({ id: notices[0].id });
  assert.equal((await ctx.api.listKanbanNotificationsAction()).find((n) => n.id === notices[0].id).readAt, readAt);
  assert.equal(ctx.effects.locks, locks + 2);
  ctx.actor("custom"); let own = plain(await ctx.api.listKanbanNotificationsAction()); assert.equal(own.length, 1); assert.equal(own[0].readAt, null);
  assert.equal(own[0].message, 'La tarjeta "Editada" llegó a "En curso" desde "Pendiente".');
  await reject(ctx, () => ctx.api.markKanbanNotificationReadAction({ id: notices[0].id }), "El aviso no existe.");
  await reject(ctx, () => ctx.api.markKanbanNotificationReadAction({ id: "missing" }), "El aviso no existe.");
  await ctx.api.moveCardAction({ boardId: b.id, id: card.id, statusId: target.id, position: 0 });
  assert.equal((await ctx.api.listKanbanNotificationsAction()).length, 1, "unchanged position is not a move event");
  await ctx.api.setCardOnHoldAction({ boardId: b.id, id: card.id, onHold: false });
  own = plain(await ctx.api.listKanbanNotificationsAction()); assert.equal(own.length, 2);
  assert.ok(own.some((n) => n.message === 'La tarjeta "Editada" dejó de estar en espera en "En curso".'));
  await watch(ctx, b.id, target.id, false);
  await ctx.api.moveCardAction({ boardId: b.id, id: card.id, statusId: unwatched.id, position: 0 });
  await ctx.api.updateCardAction({ boardId: b.id, id: card.id, title: "Sin seguimiento" });
  assert.equal((await ctx.api.listKanbanNotificationsAction()).length, 2, "following a column never follows the card");
});

test("S3 notification failure rolls back each watched card mutation and legacy relocation", async () => {
  const ctx = app(), b = await board(ctx), [s, target] = b.statuses;
  await watch(ctx, b.id, s.id); await watch(ctx, b.id, target.id);
  await ctx.api.createCardAction({ boardId: b.id, statusId: s.id, title: "Antes" });
  const card = (await currentStatus(ctx, b.id, s.id)).cards[0];
  await ctx.api.setStatusHoldEnabledAction({ boardId: b.id, id: s.id, enabled: true }); ctx.failNotifications(true);
  for (const action of [
    () => ctx.api.createCardAction({ boardId: b.id, statusId: s.id, title: "Falla" }),
    () => ctx.api.updateCardAction({ boardId: b.id, id: card.id, title: "Falla" }),
    () => ctx.api.setCardOnHoldAction({ boardId: b.id, id: card.id, onHold: true }),
    () => ctx.api.moveCardAction({ boardId: b.id, id: card.id, statusId: target.id, position: 0 }),
    () => ctx.api.deleteStatusAction({ boardId: b.id, id: s.id, destinationStatusId: target.id }),
  ]) await reject(ctx, action, "fallo de aviso");
  ctx.failNotifications(false);
  await ctx.api.moveCardAction({ boardId: b.id, id: card.id, statusId: target.id, position: 0 });
  await ctx.api.createCardAction({ boardId: b.id, statusId: target.id, title: "Segunda" });
  const before = (await ctx.api.listKanbanNotificationsAction()).length;
  await ctx.api.moveCardAction({ boardId: b.id, id: card.id, statusId: target.id, position: 1 });
  assert.equal((await ctx.api.listKanbanNotificationsAction()).length, before + 1, "within-column reorder notifies once");
  await ctx.api.deleteBoardAction({ id: b.id }); assert.deepEqual(plain(await ctx.api.listKanbanNotificationsAction()), []);
});

test("S3/S5 fan-out failure rolls back already-inserted notices and unread counters", async () => {
  const ctx = app(), b = await board(ctx), [s] = b.statuses;
  await Promise.all([watch(ctx, b.id, s.id), watch(ctx, b.id, s.id)]);
  assert.equal((await currentStatus(ctx, b.id, s.id)).watchers.length, 1);
  ctx.actor("custom"); await watch(ctx, b.id, s.id); ctx.failNotifications(1);
  await reject(ctx, () => ctx.api.createCardAction({ boardId: b.id, statusId: s.id, title: "Todo o nada" }), "fallo de aviso");
  for (const actor of ["custom", "teacher"]) {
    ctx.actor(actor); assert.equal((await ctx.api.listKanbanNotificationsAction()).filter((n) => n.readAt === null).length, 0);
  }
  ctx.failNotifications(false);
  await ctx.api.createCardAction({ boardId: b.id, statusId: s.id, title: "Persistente" });
  await lifecycle(ctx, b.id, s.id, "trashed");
  await ctx.api.permanentlyDeleteStatusAction({ boardId: b.id, id: s.id });
  const notices = plain(await ctx.api.listKanbanNotificationsAction()); assert.equal(notices.length, 1);
  await ctx.api.markKanbanNotificationReadAction({ id: notices[0].id });
  assert.equal((await ctx.api.listKanbanNotificationsAction()).filter((n) => n.readAt === null).length, 0);
});

test("S2/S5 new mutations validate board-local targets and serialize stale lifecycle writers", async () => {
  const ctx = app(), b = await board(ctx), other = await board(ctx, "Otro"), [s] = b.statuses;
  await ctx.api.createCardAction({ boardId: other.id, statusId: other.statuses[0].id, title: "Ajena" });
  const card = (await currentStatus(ctx, other.id, other.statuses[0].id)).cards[0];
  await reject(ctx, () => ctx.api.setStatusHoldEnabledAction({ boardId: b.id, id: other.statuses[0].id, enabled: true }), "El estado no pertenece a este tablero.");
  await reject(ctx, () => lifecycle(ctx, b.id, other.statuses[0].id, "trashed"), "El estado no pertenece a este tablero.");
  await reject(ctx, () => ctx.api.setCardOnHoldAction({ boardId: b.id, id: card.id, onHold: false }), "La tarjeta no pertenece a este tablero.");
  for (const action of [
    () => watch(ctx, "missing", s.id),
    () => ctx.api.setStatusHoldEnabledAction({ boardId: "missing", id: s.id, enabled: true }),
    () => lifecycle(ctx, "missing", s.id, "active"),
    () => ctx.api.setCardOnHoldAction({ boardId: "missing", id: card.id, onHold: false }),
    () => ctx.api.permanentlyDeleteStatusAction({ boardId: "missing", id: s.id }),
  ]) await reject(ctx, action, "El tablero no existe.");
  const outcomes = await Promise.allSettled([
    lifecycle(ctx, b.id, s.id, "archived"),
    ctx.api.createCardAction({ boardId: b.id, statusId: s.id, title: "Tardía" }),
    watch(ctx, b.id, s.id),
  ]);
  assert.equal(outcomes[0].status, "fulfilled");
  for (const outcome of outcomes.slice(1)) {
    assert.equal(outcome.status, "rejected"); assert.equal(outcome.reason.message, "La columna está archivada o en la papelera.");
  }
  const status = await currentStatus(ctx, b.id, s.id); assert.equal(status.cards.length, 0); assert.equal(status.watchers.length, 0);
});
