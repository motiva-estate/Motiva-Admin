// Field mappers between Sanity documents and the admin's row shapes.

import { urlFor } from "./read-client";

type SanityDoc = Record<string, unknown> & {
  _id: string;
  _type: string;
  _createdAt?: string;
  _updatedAt?: string;
  _rev?: string;
};

export interface ResourceMap {
  /** Sanity `_type` value. */
  type: string;
  /** Image fields aliased into URL strings for the admin. */
  imageAliases?: Array<{ from: string; to: string; multi?: boolean }>;
  /** Rename plain scalar fields between Sanity <-> admin. */
  fieldAliases?: Array<{ sanity: string; admin: string }>;
  /** Fields that live inside Sanity `slug` objects but the admin stores as plain strings. */
  slugFields?: string[];
  /** External URL fallback (e.g. `coverUrl` → `coverImageUrl`). */
  coverUrlFallback?: { from: string; to: string };
  /** When true, derive `status: DRAFT | PUBLISHED` from the document `_id`. */
  deriveContentStatus?: boolean;
}

function stripDraftPrefix(id: string): string {
  return id.startsWith("drafts.") ? id.slice("drafts.".length) : id;
}

function readSlug(v: unknown): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "current" in v) {
    return (v as { current?: string }).current;
  }
  return undefined;
}

function imageItemToUrl(item: unknown): string | undefined {
  if (!item || typeof item !== "object") return undefined;
  const it = item as Record<string, unknown>;
  // External image object: { _type: "externalImage", url, caption }
  if (typeof it.url === "string") return it.url;
  // Regular Sanity image asset — try urlFor
  const url = urlFor(it as never);
  return url || undefined;
}

export function fromDoc<Row extends { id: string }>(doc: SanityDoc, map: ResourceMap): Row {
  const { _id, _type: _t, _createdAt, _updatedAt, _rev: _r, ...rest } = doc;
  const row: Record<string, unknown> = {
    ...rest,
    id: stripDraftPrefix(_id),
    createdAt: _createdAt,
    updatedAt: _updatedAt,
  };

  // Sanity → admin field renames
  for (const alias of map.fieldAliases ?? []) {
    if (row[alias.sanity] !== undefined && row[alias.admin] === undefined) {
      row[alias.admin] = row[alias.sanity];
      delete row[alias.sanity];
    }
  }

  for (const field of map.slugFields ?? ["slug"]) {
    if (row[field] !== undefined) {
      const s = readSlug(row[field]);
      if (s !== undefined) row[field] = s;
    }
  }

  for (const alias of map.imageAliases ?? []) {
    const src = row[alias.from];
    if (src == null) continue;
    if (alias.multi && Array.isArray(src)) {
      const urls = src.map(imageItemToUrl).filter((u): u is string => !!u);
      if (urls.length && row[alias.to] == null) row[alias.to] = urls;
      continue;
    }
    if (row[alias.to] == null || row[alias.to] === "") {
      const url = urlFor(src as never);
      if (url) row[alias.to] = url;
    }
  }

  if (map.coverUrlFallback) {
    const { from, to } = map.coverUrlFallback;
    if ((row[to] == null || row[to] === "") && typeof row[from] === "string") {
      row[to] = row[from];
    }
  }

  if (map.deriveContentStatus && row.status === undefined) {
    row.status = _id.startsWith("drafts.") ? "DRAFT" : "PUBLISHED";
  }

  return row as Row;
}

export function toDoc(map: ResourceMap, patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const adminToSanity = new Map((map.fieldAliases ?? []).map((a) => [a.admin, a.sanity]));
  const imageAdminKeys = new Set((map.imageAliases ?? []).map((a) => a.to));
  const coverFallbackTo = map.coverUrlFallback?.to;

  for (const [key, value] of Object.entries(patch)) {
    if (key === "id" || key === "createdAt" || key === "updatedAt") continue;
    if (map.deriveContentStatus && key === "status") continue;
    // Derived/resolved image URL fields are read-only projections; skip them
    // so we don't try to overwrite the underlying Sanity image object.
    if (imageAdminKeys.has(key)) continue;
    // Skip the resolved cover URL projection; the raw fallback field
    // (e.g. `coverUrl`) is written via its own key below.
    if (coverFallbackTo && key === coverFallbackTo) continue;

    const targetKey = adminToSanity.get(key) ?? key;

    if ((map.slugFields ?? ["slug"]).includes(targetKey) && typeof value === "string") {
      out[targetKey] = { _type: "slug", current: value };
      continue;
    }
    out[targetKey] = value;
  }
  return out;
}
