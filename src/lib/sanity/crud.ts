// Sanity-backed CRUD helper mirroring the mock `makeCrud`
// (list/get/create/update/remove) so component code doesn't change.

import { sanityRead } from "./read-client";
import { fromDoc, toDoc, type ResourceMap } from "./mappers";
import type { AdminResource } from "./resources";
import { sanityCreate, sanityRemove, sanityUpdate } from "./writes.functions";

function currentActorEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    // Check both admin and portal keys — whichever is set is the active session.
    return (
      window.localStorage.getItem("motiva.admin.email") ??
      window.localStorage.getItem("motiva.portal.email") ??
      window.localStorage.getItem("motiva.user.email") ?? // legacy key
      ""
    );
  } catch {
    return "";
  }
}

export function makeSanityCrud<Row extends { id: string }>(res: AdminResource) {
  const baseFilter = res.filter ? ` && ${res.filter}` : "";
  return {
    async list(): Promise<Row[]> {
      const docs = await sanityRead.fetch<Array<Record<string, unknown>>>(
        `*[_type == $type${baseFilter}] | order(_createdAt desc)`,
        { type: res.type },
      );
      return docs.map((d) => fromDoc<Row>(d as never, res));
    },
    async get(id: string): Promise<Row | undefined> {
      const doc = await sanityRead.fetch<Record<string, unknown> | null>(
        `*[_id in [$id, "drafts." + $id] && _type == $type] | order(_updatedAt desc)[0]`,
        { id, type: res.type },
      );
      return doc ? fromDoc<Row>(doc as never, res) : undefined;
    },
    async create(input: Partial<Row>): Promise<Row> {
      const content = {
        ...(res.createDefaults ?? {}),
        ...toDoc(res, input as Record<string, unknown>),
      };
      const doc = await sanityCreate({
        data: { actorEmail: currentActorEmail(), type: res.type, content },
      });
      return fromDoc<Row>(doc as never, res);
    },
    async update(id: string, patch: Partial<Row>): Promise<Row> {
      const doc = await sanityUpdate({
        data: {
          actorEmail: currentActorEmail(),
          id,
          patch: toDoc(res, patch as Record<string, unknown>),
        },
      });
      return fromDoc<Row>(doc as never, res);
    },
    async remove(id: string): Promise<void> {
      await sanityRemove({ data: { actorEmail: currentActorEmail(), id } });
    },
  };
}

/**
 * Singleton (document per _type) helpers. Accepts a full ResourceMap so field
 * aliases (e.g. Sanity `mission` ↔ admin `mission`) apply on read/write.
 */
export function makeSingletonAccess<T extends { id: string }>(res: ResourceMap) {
  return {
    async get(): Promise<T> {
      const doc = await sanityRead.fetch<Record<string, unknown> | null>(
        `*[_type == $type] | order(_updatedAt desc)[0]`,
        { type: res.type },
      );
      if (!doc) {
        return {
          id: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as unknown as T;
      }
      return fromDoc<T>(doc as never, res);
    },
    async update(patch: Partial<T>): Promise<T> {
      const existing = await sanityRead.fetch<{ _id: string } | null>(`*[_type == $type][0]{_id}`, {
        type: res.type,
      });
      const clean = toDoc(res, patch as Record<string, unknown>);
      if (existing?._id) {
        const doc = await sanityUpdate({
          data: { actorEmail: currentActorEmail(), id: existing._id, patch: clean },
        });
        return fromDoc<T>(doc as never, res);
      }
      const doc = await sanityCreate({
        data: { actorEmail: currentActorEmail(), type: res.type, content: clean },
      });
      return fromDoc<T>(doc as never, res);
    },
  };
}
