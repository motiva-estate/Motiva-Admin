// Server-side Sanity write proxy. The write token never reaches the browser.
//
// SECURITY: until real server auth lands (Lovable Cloud / Supabase), these
// endpoints are guarded only by the admin app's mock auth passing an
// `actorEmail` claim. Swap `assertAdmin` for `requireSupabaseAuth` when auth
// moves server-side.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ALLOWED_ADMIN_EMAILS = new Set([
  "admin@motivaestate.com",
  "manager@motivaestate.com",
  "editor@motivaestate.com",
]);

async function getWriteClient() {
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) throw new Error("SANITY_WRITE_TOKEN is not configured");
  const { createClient } = await import("@sanity/client");
  return createClient({
    projectId: "znx01lol",
    dataset: "production",
    apiVersion: "2024-01-01",
    token,
    useCdn: false,
  });
}

function assertAdmin(actorEmail: string | undefined) {
  if (!actorEmail || !ALLOWED_ADMIN_EMAILS.has(actorEmail.toLowerCase())) {
    throw new Error("Forbidden");
  }
}

const createInput = z.object({
  actorEmail: z.string().email(),
  type: z.string().min(1),
  content: z.record(z.string(), z.unknown()),
});

export const sanityCreate = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof createInput>) => createInput.parse(data))
  .handler(async ({ data }) => {
    assertAdmin(data.actorEmail);
    const client = await getWriteClient();
    const doc = await client.create({ _type: data.type, ...data.content });
    return doc;
  });

const updateInput = z.object({
  actorEmail: z.string().email(),
  id: z.string().min(1),
  patch: z.record(z.string(), z.unknown()),
});

export const sanityUpdate = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof updateInput>) => updateInput.parse(data))
  .handler(async ({ data }) => {
    assertAdmin(data.actorEmail);
    const client = await getWriteClient();
    const doc = await client.patch(data.id).set(data.patch).commit();
    return doc;
  });

const removeInput = z.object({
  actorEmail: z.string().email(),
  id: z.string().min(1),
});

export const sanityRemove = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof removeInput>) => removeInput.parse(data))
  .handler(async ({ data }) => {
    assertAdmin(data.actorEmail);
    const client = await getWriteClient();
    await client.delete(data.id);
    return { ok: true };
  });
