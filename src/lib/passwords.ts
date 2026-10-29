import { randomBytes } from "node:crypto";

/**
 * Password rules, shared by the admin page and the command-line tools so the
 * two cannot drift apart.
 */

/** Unambiguous alphabet: no l/1, no o/0, because these get read aloud. */
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function generatePassword(): string {
  const bytes = randomBytes(20);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
  return [0, 5, 10, 15].map((i) => chars.slice(i, i + 5).join("")).join("-");
}

/**
 * Rejects the things people type when they mean "I will pick one later".
 * This exists because a placeholder was once pasted in verbatim and became a
 * real account's real password.
 */
const PLACEHOLDERS =
  /^(your-choice|your-password|password|passwd|changeme|change-me|paste-.*|pick-a-real-password|.*-here|placeholder|secret|admin|test|123456)$/i;

export function passwordProblem(password: string): string | null {
  if (PLACEHOLDERS.test(password)) {
    return `"${password}" looks like a placeholder, not a password you chose.`;
  }
  if (password.length < 10) {
    return `That is ${password.length} characters. Use at least 10, or leave it blank for a generated one.`;
  }
  return null;
}

export function assertPasswordUsable(password: string): void {
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);
}
