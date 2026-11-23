const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

/** Conservative validation for a stored contact address before it becomes a mailto href. */
export function validContactEmail(value: string | null | undefined): string | null {
  if (!value || value.length > MAX_EMAIL_LENGTH) return null;
  return EMAIL_PATTERN.test(value) ? value : null;
}
