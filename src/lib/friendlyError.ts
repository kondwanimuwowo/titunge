/**
 * Translates a raw error message (almost always straight from
 * Postgres/PostgREST/Supabase) into something a shop owner can actually act
 * on, instead of surfacing column names and constraint internals in a toast.
 * Falls back to a generic message for anything unrecognized — never leaks
 * the raw text, since that's a dead end for the person reading it either way.
 */
export function toFriendlyErrorMessage(rawMessage: string | null | undefined): string {
  const message = rawMessage ?? "";

  // PostgREST hasn't picked up a schema change yet (a migration was applied
  // but the API's schema cache hasn't reloaded, or wasn't applied at all).
  // Not something the person using the app can fix themselves.
  if (/column .* (of|in) .* schema cache/i.test(message) || /could not find the .* column/i.test(message)) {
    return "This feature just had an update roll out and needs a moment to finish syncing. Please try again in a minute — if it keeps happening, let support know.";
  }

  if (/violates foreign key constraint/i.test(message)) {
    return "One of the things you selected no longer exists — someone may have removed it. Please refresh the page and try again.";
  }

  if (/duplicate key|violates unique constraint/i.test(message)) {
    return "That already exists. Please check and try again.";
  }

  if (/row-level security|rls/i.test(message)) {
    return "You don't have permission to do that.";
  }

  if (/jwt|not authenticated|auth session missing/i.test(message)) {
    return "Your session has expired. Please refresh the page and sign in again.";
  }

  if (/failed to fetch|network ?error|econnrefused|timed? ?out/i.test(message)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }

  if (/out of stock|insufficient stock/i.test(message)) {
    return message; // already written for a shop owner to read as-is
  }

  // A short, already-plain message (no internals leaking) is fine to show
  // directly — most of this app's own hand-written error messages qualify.
  if (message && message.length < 120 && !/[{}[\]]|relation|column|constraint/i.test(message)) {
    return message;
  }

  return "Something went wrong. Please try again, or contact support if this keeps happening.";
}
