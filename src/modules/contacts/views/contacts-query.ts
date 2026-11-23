import { createStore, type StoreApi } from "zustand/vanilla";
import type { ContactRow } from "../contacts.domain";

export type ContactsPage = { items: ContactRow[]; total: number; page: number; pageSize: number };
type Snapshot = {
  query: string;
  search: string;
  page: ContactsPage | null;
  resultQuery: string;
  updating: boolean;
  stale: boolean;
  error: string;
  cache: ReadonlyMap<string, ContactsPage>;
};
type Dependencies = {
  fetch: typeof fetch;
  navigate: (query: string, replace: boolean) => void;
  schedule: (callback: () => void, milliseconds: number) => ReturnType<typeof setTimeout>;
  cancel: (timer: ReturnType<typeof setTimeout>) => void;
};

function canonical(query: string) {
  const params = new URLSearchParams(query);
  params.sort();
  return params.toString();
}

/** Shared by dashboard consumers through a request-isolated Zustand provider. */
export class ContactsQuery {
  readonly store: StoreApi<Snapshot>;

  private get snapshot() { return this.store.getState(); }
  private controller: AbortController | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;

  constructor(query: string, private dependencies: Dependencies) {
    this.store = createStore<Snapshot>(() => ({ query: canonical(query), search: new URLSearchParams(query).get("q") ?? "", page: null, resultQuery: "", updating: true, stale: true, error: "", cache: new Map() }));
  }

  getSnapshot = () => this.snapshot;
  private update(patch: Partial<Snapshot>) {
    this.store.setState(patch);
  }

  private cancelSearch() {
    if (this.timer !== undefined) this.dependencies.cancel(this.timer);
    this.timer = undefined;
  }

  start(query = this.snapshot.query) {
    this.update({ query: canonical(query), search: new URLSearchParams(query).get("q") ?? "" });
    this.load();
  }

  /** Leaving the list cancels work but retains dashboard-wide results and cache. */
  pause() {
    this.cancelSearch();
    this.controller?.abort();
    this.generation++;
    this.update({ search: new URLSearchParams(this.snapshot.query).get("q") ?? "", updating: false });
  }

  /** Leaving the dashboard also discards contacts held by the global store. */
  stop() {
    this.pause();
    this.update({ query: "", search: "", page: null, resultQuery: "", stale: true, error: "", cache: new Map() });
  }

  sync(query: string) {
    const next = canonical(query);
    if (next === this.snapshot.query) return;
    this.cancelSearch();
    this.update({ query: next, search: new URLSearchParams(next).get("q") ?? "" });
    this.load();
  }

  search(value: string) {
    this.cancelSearch();
    this.update({ search: value.slice(0, 200) });
    this.timer = this.dependencies.schedule(() => {
      this.timer = undefined;
      this.commit(this.filters(), true);
    }, 300);
  }

  private filters() {
    const params = new URLSearchParams(this.snapshot.query);
    if (this.snapshot.search) params.set("q", this.snapshot.search);
    else params.delete("q");
    params.delete("page");
    return params;
  }

  filter(key: "source" | "status", value: unknown) {
    this.cancelSearch();
    const params = this.filters();
    if (typeof value === "string" && value) params.set(key, value);
    else params.delete(key);
    this.commit(params, false);
  }

  paginate(page: number) {
    if (this.snapshot.stale || this.snapshot.updating || this.timer !== undefined) return;
    const params = new URLSearchParams(this.snapshot.query);
    params.set("page", String(page));
    this.commit(params, false);
  }

  private commit(params: URLSearchParams, replace: boolean) {
    const query = canonical(params.toString());
    if (query === this.snapshot.query) return;
    this.update({ query });
    this.load();
    this.dependencies.navigate(query, replace);
  }

  retry() { this.load(); }

  private load() {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    const generation = ++this.generation;
    const query = this.snapshot.query;
    const cache = new Map(this.snapshot.cache);
    const cached = cache.get(query);
    if (cached) {
      cache.delete(query);
      cache.set(query, cached);
    }
    this.update({
      cache,
      page: cached ?? this.snapshot.page,
      resultQuery: cached ? query : this.snapshot.resultQuery,
      stale: !cached && (!this.snapshot.page || this.snapshot.resultQuery !== query),
      updating: true,
      error: "",
    });
    this.dependencies.fetch(`/api/dashboard/contacts?${query}`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No pudimos cargar los contactos.");
      if (controller.signal.aborted || generation !== this.generation) return;
      const nextCache = new Map(this.snapshot.cache);
      nextCache.delete(query);
      nextCache.set(query, result);
      if (nextCache.size > 20) nextCache.delete(nextCache.keys().next().value!);
      this.update({ cache: nextCache, page: result, resultQuery: query, stale: false, updating: false, error: "" });
    }).catch((cause: unknown) => {
      if (controller.signal.aborted || generation !== this.generation) return;
      this.update({ updating: false, error: cause instanceof Error ? cause.message : "No pudimos cargar los contactos." });
    });
  }
}
