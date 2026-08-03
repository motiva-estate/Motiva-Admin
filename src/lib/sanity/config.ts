// Sanity project config. Non-secret values — safe to commit.
// Project ID + dataset were confirmed via the Sanity MCP connector.
export const SANITY_PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
export const SANITY_DATASET = import.meta.env.VITE_SANITY_DATASET;
export const SANITY_API_VERSION = import.meta.env.VITE_SANITY_API_VERSION;
export const SANITY_WRITE_TOKEN = import.meta.env.VITE_SANITY_WRITE_TOKEN;
