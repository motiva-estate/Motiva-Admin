// Resolve a Subscription.projectRef to display info for the portal.
// Tries Sanity first (via api.projects.get / api.land.get). Falls back to
// a curated demo map so the seeded mock refs still render with imagery
// and phase state in Phase 1.

import { api } from "@/lib/api/client";

export type PhaseKey = "pre-sale" | "ongoing" | "delivered";

export interface ProjectRefInfo {
  name: string;
  location?: string;
  coverImageUrl: string;
  phaseLabel?: string;
  projectStatus: PhaseKey;
  refType: "project" | "land";
}

const DEMO: Record<string, ProjectRefInfo> = {
  "project-casa-solano": {
    name: "Casa Solano",
    location: "Ikoyi, Lagos",
    coverImageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    phaseLabel: "Façade & interiors",
    projectStatus: "ongoing",
    refType: "project",
  },
  "project-kaura-heights": {
    name: "Kaura Heights — Unit 04B",
    location: "Kaura, Abuja",
    coverImageUrl:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
    phaseLabel: "Practical completion",
    projectStatus: "delivered",
    refType: "project",
  },
  "land-lanzarote-a12": {
    name: "Lanzarote — Parcel A12",
    location: "Lekki Peninsula, Lagos",
    coverImageUrl:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80",
    phaseLabel: "Perimeter survey",
    projectStatus: "pre-sale",
    refType: "land",
  },
};

const PHASES: PhaseKey[] = ["pre-sale", "ongoing", "delivered"];

export function phaseIndex(p: PhaseKey): number {
  return Math.max(0, PHASES.indexOf(p));
}

export function phaseList(): PhaseKey[] {
  return PHASES;
}

export async function resolveProjectRef(
  ref: string | undefined,
  refType: "project" | "land" | undefined,
): Promise<ProjectRefInfo | null> {
  if (!ref) return null;

  // Try Sanity by _id first — projectRef is meant to be a Sanity document id.
  try {
    if (refType === "land") {
      const l = await api.land.get(ref);
      if (l) {
        return {
          name: l.name,
          location: l.location ?? l.estate,
          coverImageUrl: l.coverImageUrl || l.coverUrl || DEMO[ref]?.coverImageUrl || "",
          phaseLabel:
            l.status === "sold" ? "Sold" : l.status === "reserved" ? "Reserved" : "Available",
          projectStatus: l.status === "sold" ? "delivered" : "pre-sale",
          refType: "land",
        };
      }
    } else {
      const p = await api.projects.get(ref);
      if (p) {
        return {
          name: p.title,
          location: [p.location, p.city].filter(Boolean).join(", ") || undefined,
          coverImageUrl: p.coverImageUrl || p.coverUrl || DEMO[ref]?.coverImageUrl || "",
          phaseLabel: p.phaseLabel,
          projectStatus:
            (p.projectStatus as PhaseKey | undefined) ??
            (DEMO[ref]?.projectStatus ?? "ongoing"),
          refType: "project",
        };
      }
    }
  } catch {
    // fall through to demo map
  }

  return DEMO[ref] ?? null;
}