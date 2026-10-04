import { randomBytes } from "node:crypto";
import type { BrowserContext, Page } from "playwright";
import type { StudentProfile } from "@/types";
import type { SrmData } from "@/hooks/use-srm-data";
import { PortalError } from "./errors";
import { sessionTtl, maxActiveSessions } from "./config";
import { PortalDiagnostics } from "./diagnostics";

export interface PortalSession {
  context: BrowserContext; page: Page; createdAt: number; lastAccessedAt: number;
  busy: boolean; authenticated: boolean; profile?: StudentProfile; data?: SrmData;
}
export class SessionStore {
  readonly sessions = new Map<string, PortalSession>();
  private pending = 0;
  constructor(private ttl = sessionTtl(), private max?: number, private now = Date.now) {}
  async create(factory: () => Promise<{ context: BrowserContext; page: Page }>, diagnostics = new PortalDiagnostics()) {
    await this.cleanup();
    if (this.sessions.size + this.pending >= (this.max ?? maxActiveSessions())) throw new PortalError("SERVER_BUSY", 503);
    this.pending++;
    try {
      const resources = await factory();
      const id = randomBytes(32).toString("hex");
      this.sessions.set(id, { ...resources, createdAt: this.now(), lastAccessedAt: this.now(), busy: false, authenticated: false });
      diagnostics.stage("PORTAL_SESSION_CREATED");
      return id;
    } finally { this.pending--; }
  }
  async get(id: string) {
    const session = this.sessions.get(id);
    if (!session || this.now() - session.lastAccessedAt >= this.ttl) {
      await this.destroy(id);
      throw new PortalError("SESSION_EXPIRED", 401);
    }
    session.lastAccessedAt = this.now();
    return session;
  }
  async run<T>(id: string, work: (session: PortalSession) => Promise<T>) {
    const session = await this.get(id);
    if (session.busy) throw new PortalError("SESSION_BUSY", 409);
    session.busy = true;
    try { return await work(session); }
    finally { session.busy = false; }
  }
  rotate(id: string) {
    const session = this.sessions.get(id);
    if (!session) throw new PortalError("SESSION_EXPIRED", 401);
    const next = randomBytes(32).toString("hex");
    this.sessions.delete(id);
    this.sessions.set(next, session);
    return next;
  }
  async destroy(id: string) {
    const session = this.sessions.get(id);
    this.sessions.delete(id);
    if (session) {
      session.profile = undefined; session.data = undefined;
      await session.context.close().catch(() => {});
      new PortalDiagnostics().stage("PORTAL_SESSION_DESTROYED");
    }
  }
  async cleanup() {
    await Promise.all([...this.sessions].filter(([, s]) => this.now() - s.lastAccessedAt >= this.ttl)
      .map(([id]) => this.destroy(id)));
  }
  async close() { await Promise.all([...this.sessions.keys()].map(id => this.destroy(id))); }
}

// One store across Next route bundles and development reloads. One replica only.
const globalState = globalThis as typeof globalThis & { portalSessions?: SessionStore; portalCleanup?: NodeJS.Timeout };
export const sessions = globalState.portalSessions ??= new SessionStore();
if (!globalState.portalCleanup) {
  globalState.portalCleanup = setInterval(() => { void sessions.cleanup(); }, 30_000);
  globalState.portalCleanup.unref();
}
