import type { PortalSession } from "./session-manager";
import { PortalError } from "./errors";
import type { PortalDiagnostics } from "./diagnostics";

/**
 * Deliberate verification boundary, not a successful empty scrape.
 * The public Student Portal was inspected, but no authenticated Student Portal
 * DOM was available. Existing Academia parsers target a different application.
 * Implement this adapter only after a student manually signs in and the real
 * profile/attendance navigation, headings and identity marker are inspected.
 * Never infer login success from HTTP 200, a redirect, or a cookie alone.
 */
export async function syncAcademicData(session: PortalSession, diagnostics?: PortalDiagnostics): Promise<void> {
  void session;
  diagnostics?.stage("PORTAL_SYNC_UNIMPLEMENTED", 501, "PORTAL_CHANGED");
  throw new PortalError("PORTAL_CHANGED", 501);
}
