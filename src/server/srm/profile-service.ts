import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { profileRepository } from "@/lib/repositories/profile-repository";
import { profileSchema, type NormalizedProfile } from "./normalized-data";

export async function ensureStudentProfile(netId: string, source: NormalizedProfile) {
  const profile = profileSchema.parse(source);
  const normalizedNetId = netId.toLowerCase().replace(/@srmist\.edu\.in$/, "");
  const email = `${normalizedNetId}@srmist.edu.in`;
  const admin = getAdminClient();
  // Called only after successful SRM authentication + profile identity verification.
  // generateLink resolves/creates an auth UUID without sending email. No link or token leaves this service.
  const { data: identity, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !identity.user) throw new Error("SESSION_STORE_ERROR");
  return profileRepository.saveSRM(identity.user.id, normalizedNetId, email, profile);
}

