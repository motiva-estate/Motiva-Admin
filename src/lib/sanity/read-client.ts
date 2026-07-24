// Public, read-only Sanity client used for `list`/`get` calls.
// Writes go through `writes.functions.ts` (server-side, holds the write token).

import { createClient, type SanityClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "./config";

export const sanityRead: SanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  useCdn: true,
});

const builder = imageUrlBuilder(sanityRead);

type SanityImageSource = Parameters<ReturnType<typeof imageUrlBuilder>["image"]>[0];

export function urlFor(source: SanityImageSource | null | undefined): string | undefined {
  if (!source) return undefined;
  try {
    return builder.image(source).auto("format").url();
  } catch {
    return undefined;
  }
}
