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
  let data = { kanbanBoard: [], kanbanStatus: [], kanbanCard: [], user: [
    { id: "teacher", name: "Docente", role: "TEACHER", accessRoleId: null, accessRole: null },
    { id: "parent", name: "Familia", role: "PARENT", accessRoleId: null, accessRole: null },
    { id: "custom", name: "Interno", role: "PARENT", accessRoleId: "r1", accessRole: { isActive: true, permissions: [{ permission: { key: "dashboard.access" } }] } },
    { id: "disabled", name: "Inactivo", role: "ADMIN", accessRoleId: "r2", accessRole: { isActive: false, permissions: [{ permission: { key: "dashboard.access" } }] } },
    { id: "no-access", name: "Sin acceso", role: "ADMIN", accessRoleId: "r3", accessRole: { isActive: true, permissions: [] } },
  ] };
  let nextId = 0, denied = false, cardUpdatesUntilFailure = -1, failStatusCreate = false, actor = "teacher";
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
          const row = { id: `id-${++nextId}`, description: null, assigneeId: null, dueDate: null, ...input };
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
  return { api, effects, deny: (value) => { denied = value; }, fail: (value) => { cardUpdatesUntilFailure = typeof value === "number" ? value : value ? 0 : -1; }, failDefaults: (value) => { failStatusCreate = value; }, actor: (value) => { actor = value; }, snapshot: () => JSON.stringify(data) };
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
  const calls = [() => ctx.api.listBoardsAction(), () => ctx.api.getBoardAction("b"), () => ctx.api.listAssigneesAction(),
    ...["createBoard", "updateBoard", "deleteBoard", "createStatus", "updateStatus", "reorderStatuses", "deleteStatus", "createCard", "updateCard", "deleteCard", "moveCard"].map((name) => () => ctx.api[`${name}Action`]({}))];
  for (const call of calls) await reject(ctx, call, "Acceso denegado.");
  assert.equal(ctx.effects.guards, 14); assert.equal(ctx.effects.writes, 0); assert.equal(ctx.effects.locks, 0); assert.equal(ctx.effects.reads, 0);
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
  assert.deepEqual(plain(card), { id: card.id, title: "Tarea", description: "Detalle", assigneeId: "teacher", dueDate: "2024-02-29T00:00:00.000Z", position: 0 });
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
