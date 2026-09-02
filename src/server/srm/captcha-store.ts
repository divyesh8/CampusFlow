import type { SRMCookieJar } from "./academia-config";

const CHALLENGE_TTL = 5 * 60 * 1000;

export interface CaptchaChallenge {
  challengeId: string;
  netId: string;
  password: string;
  srmCookies: SRMCookieJar;
  captchaDigest: string;
  captchaImage: string;
  createdAt: number;
}

const challenges = new Map<string, CaptchaChallenge>();

function cleanupExpired() {
  const now = Date.now();
  for (const [key, challenge] of challenges) {
    if (now - challenge.createdAt > CHALLENGE_TTL) {
      challenges.delete(key);
    }
  }
}

setInterval(cleanupExpired, 30_000).unref?.();

export function createChallenge(
  netId: string,
  password: string,
  srmCookies: SRMCookieJar,
  captchaDigest: string,
  captchaImage: string
): CaptchaChallenge {
  cleanupExpired();

  const challengeId = crypto.randomUUID();
  const challenge: CaptchaChallenge = {
    challengeId,
    netId,
    password,
    srmCookies,
    captchaDigest,
    captchaImage,
    createdAt: Date.now(),
  };

  challenges.set(challengeId, challenge);
  console.log(`[CAPTCHA] Created challenge ${challengeId} for ${netId.replace(/(.{2}).*/, "$1***")}`);
  return challenge;
}

export function getChallenge(
  challengeId: string
): CaptchaChallenge | null {
  const challenge = challenges.get(challengeId);
  if (!challenge) return null;

  if (Date.now() - challenge.createdAt > CHALLENGE_TTL) {
    challenges.delete(challengeId);
    return null;
  }

  return challenge;
}

export function deleteChallenge(challengeId: string): void {
  challenges.delete(challengeId);
}
