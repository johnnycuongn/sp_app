import { Timestamp } from "firebase/firestore"

/**
 * Strips `null`, `undefined`, and empty/whitespace-only strings from an object.
 * Unlike the prior `removeEmpty`, this does NOT strip the number `0`,
 * the boolean `false`, or empty arrays — those are legitimate values.
 *
 * Returns a new object; does not mutate the input.
 */
export function stripEmpty<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue
    if (typeof v === "string" && v.trim().length === 0) continue
    out[k] = v
  }
  return out as Partial<T>
}

/**
 * Coerce a Firestore value into a Date — handles Timestamp, Date, and
 * anything with a `.toDate()` method. Falls back to `new Date(value)`.
 */
export function toDate(value: unknown): Date {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (value instanceof Timestamp) return value.toDate()
  if (typeof (value as any)?.toDate === "function") return (value as any).toDate()
  return new Date(value as any)
}

/** Sanitize a filename for safe use in a Storage path. */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80)
}
