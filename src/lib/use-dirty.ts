/**
 * useDirty
 *
 * Compares the current form state against the last-known server data to tell
 * you whether there is anything worth saving.
 *
 * Usage:
 *   // For an edit page:
 *   const { isDirty, markClean } = useDirty(form, existing);
 *
 *   // For a new record (no server data yet — always dirty so Save is enabled):
 *   const { isDirty } = useDirty(form, null);
 *
 *   // For a page whose data is a singleton (company, contact…):
 *   const { isDirty, markClean } = useDirty(form, data ?? null);
 *
 *   // Multi-state forms (projects, properties — amenities live in separate state):
 *   const dirtyState = { form, amenitiesText, nearbyText, galleryUrls };
 *   const { isDirty, markClean } = useDirty(dirtyState, existing ?? null);
 *
 * Rules:
 *   - Pass the raw value returned by useQuery (data / existing / client).
 *     Do NOT pass a timing flag derived from isLoading.
 *   - When serverData is null the form is considered always dirty (new record).
 *   - Call markClean() in onSuccess so the button goes grey after saving.
 *   - Call resetBaseline(value) when a dialog re-opens with different data.
 */

import { useCallback, useRef } from "react";

function serialize(v: unknown): string {
  return JSON.stringify(v, (_, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val as object).sort(([a], [b]) => a.localeCompare(b)))
      : val,
  );
}

export function useDirty<T, S = unknown>(current: T, serverData: S | null | undefined) {
  // Tracks the serialised baseline from the last save (or the server data).
  // null means "not yet set" — resolved on first render when serverData arrives.
  const baseline = useRef<string | null>(null);

  // When serverData is available and the baseline hasn't been set yet,
  // capture the server data as the baseline immediately (synchronous, same render).
  // This is the key fix: we compare current against what the server sent,
  // not against the empty initial form state.
  if (baseline.current === null && serverData != null) {
    baseline.current = serialize(serverData);
  }

  // If there is no server data (new record), the form is always dirty.
  if (serverData == null) {
    const isDirty = true;
    const markClean = () => {};
    const resetBaseline = (_: T) => {};
    return { isDirty, markClean, resetBaseline };
  }

  const isDirty = baseline.current === null || serialize(current) !== baseline.current;

  /** Reset baseline to the current values after a successful save. */
  const markClean = useCallback(() => {
    baseline.current = serialize(current);
  }, [current]);

  /** Force-reset baseline to a specific value (e.g. when a dialog re-opens). */
  const resetBaseline = useCallback((value: T) => {
    baseline.current = serialize(value);
  }, []);

  return { isDirty, markClean, resetBaseline };
}
