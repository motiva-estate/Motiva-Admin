// Central registry of Sanity-backed resources used by the admin API client.
// Each entry maps an admin key (e.g. "projects") to a Sanity `_type`,
// plus the field/image aliases needed to translate between the two.

import type { ResourceMap } from "./mappers";

export interface AdminResource extends ResourceMap {
  /** Public admin key on the api client (e.g. "projects"). */
  admin: string;
  /** Optional GROQ filter to narrow which docs of `type` this resource sees. */
  filter?: string;
  /** Extra fields to always set on create. */
  createDefaults?: Record<string, unknown>;
}

// Shared cover/gallery + field aliases for the `project` Sanity type.
const projectImageAliases = [
  { from: "cover", to: "coverImageUrl" },
  { from: "gallery", to: "galleryImages", multi: true as const },
];
const projectFieldAliases = [
  { sanity: "beds", admin: "bedrooms" },
  { sanity: "baths", admin: "bathrooms" },
];

export const RESOURCES: Record<string, AdminResource> = {
  projects: {
    admin: "projects",
    type: "project",
    slugFields: ["slug"],
    imageAliases: projectImageAliases,
    fieldAliases: projectFieldAliases,
    // galleryUrls is a plain string[] on both admin and Sanity side — no alias needed,
    // toDoc passes it through unchanged. Sanity schema must have a galleryUrls string[] field.
    coverUrlFallback: { from: "coverUrl", to: "coverImageUrl" },
    deriveContentStatus: true,
  },
  properties: {
    admin: "properties",
    type: "project",
    slugFields: ["slug"],
    imageAliases: projectImageAliases,
    fieldAliases: [...projectFieldAliases, { sanity: "propertyType", admin: "type" }],
    coverUrlFallback: { from: "coverUrl", to: "coverImageUrl" },
    deriveContentStatus: true,
  },
  gallery: {
    admin: "gallery",
    type: "galleryItem",
    imageAliases: [{ from: "image", to: "imageUrl" }],
    // Sanity `url` (external image URL) fills `imageUrl` when no asset is set.
    fieldAliases: [{ sanity: "url", admin: "imageUrl" }],
  },
  testimonials: {
    admin: "testimonials",
    type: "testimonial",
    imageAliases: [{ from: "avatar", to: "avatarUrl" }],
    deriveContentStatus: true,
  },
  faqs: {
    admin: "faqs",
    type: "faq",
  },
  leadership: {
    admin: "leadership",
    type: "leadershipEntry",
    imageAliases: [{ from: "photo", to: "photoUrl" }],
  },
  achievements: {
    admin: "achievements",
    type: "achievement",
  },
  services: {
    admin: "services",
    type: "service",
    slugFields: ["slug"],
  },
  land: {
    admin: "land",
    type: "land",
    slugFields: ["slug"],
    imageAliases: [{ from: "cover", to: "coverImageUrl" }],
    coverUrlFallback: { from: "coverUrl", to: "coverImageUrl" },
  },
  journal: {
    admin: "journal",
    type: "journalEntry",
    slugFields: ["slug"],
    imageAliases: [{ from: "cover", to: "coverUrl" }],
    deriveContentStatus: true,
  },
};

// Singleton documents (one row per type).
export const SINGLETONS: Record<string, ResourceMap> = {
  company: { type: "companyInfo" },
  contact: { type: "contactInfo" },
};

/** Which admin resources are live on Sanity — used by the Settings status panel. */
export const SANITY_BACKED_RESOURCES = [...Object.keys(RESOURCES), "company", "contact"] as const;

export const MOCK_BACKED_RESOURCES = [
  "clients",
  "subscriptions",
  "payments",
  "enquiries",
  "auditLog",
  "users",
  "homepageSections",
  "seo",
] as const;
