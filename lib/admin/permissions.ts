/** Pure authorization helpers shared by admin pages and server actions. */

const ADMIN_HOME = "/admin";

/** The only profile role allowed into the admin panel. */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin";
}

/**
 * Resolve a post-login `next` parameter without opening an external redirect.
 * Browser URL parsing treats backslashes and encoded slashes as separators, so
 * both the raw and the decoded value have to be checked.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (typeof next !== "string" || !next.startsWith("/")) return ADMIN_HOME;
  if (next.startsWith("//") || next.includes("\\") || hasControlCharacter(next)) {
    return ADMIN_HOME;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return ADMIN_HOME;
  }
  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    hasControlCharacter(decoded)
  ) {
    return ADMIN_HOME;
  }

  const pathname = decoded.split(/[?#]/, 1)[0];
  if (pathname === "/admin/login") return ADMIN_HOME;

  return next;
}

function hasControlCharacter(value: string): boolean {
  return /[\u0000-\u001f\u007f]/.test(value);
}
