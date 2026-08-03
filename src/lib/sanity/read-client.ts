// Public, read-only Sanity client used for `list`/`get` calls.
// Writes go through `writes.functions.ts` (server-side, holds the write token).
//
// The client is created lazily (on first call) so that a missing VITE_SANITY_PROJECT_ID
// in the environment produces a clear error at query time rather than crashing the
// entire SSR module graph at startup.

import { createClient, type SanityClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "./config";

let _client: SanityClient | null = null;

function getClient(): SanityClient {
  if (_client) return _client;

  if (!SANITY_PROJECT_ID) {
    throw new Error(
      "VITE_SANITY_PROJECT_ID is not set. " + "Add it to your .env file (see .env.example).",
    );
  }

  _client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET ?? "production",
    apiVersion: SANITY_API_VERSION ?? "2024-01-01",
    useCdn: true,
  });

  return _client;
}

// Proxy object — all property accesses and method calls are forwarded to the
// lazily-created real client.  Components import `sanityRead` and use it just
// like before; no call sites need to change.
export const sanityRead = new Proxy({} as SanityClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

const _builderClient = new Proxy({} as SanityClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

const builder = createImageUrlBuilder(_builderClient as SanityClient);

type SanityImageSource = Parameters<ReturnType<typeof createImageUrlBuilder>["image"]>[0];

export function urlFor(source: SanityImageSource | null | undefined): string | undefined {
  if (!source) return undefined;
  try {
    return builder.image(source).auto("format").url();
  } catch {
    return undefined;
  }
}
