// Typed API client. Content resources (projects, properties, gallery, testimonials,
// faqs, leadership, achievements, services, land, company, contact) are backed
// by Sanity. CRM resources (clients, subscriptions, payments, enquiries, users,
// auditLog) and deferred resources (homepageSections, seo) stay on the local
// mock DB until they get their own backend.
//
// Method signatures (list/get/create/update/remove) are identical across both
// backends so no component code changes.

import { mockDb } from "./mock-db";
import { makeSanityCrud, makeSingletonAccess } from "../sanity/crud";
import { RESOURCES, SINGLETONS } from "../sanity/resources";
import type {
  Achievement,
  AuditLog,
  Client,
  CompanyInfo,
  ContactInfo,
  Enquiry,
  FAQ,
  GalleryItem,
  HomepageSection,
  Land,
  LeadershipEntry,
  Project,
  ProjectUpdate,
  Property,
  SEOMetadata,
  Service,
  Subscription,
  SubscriberDocument,
  Testimonial,
  User,
} from "./types";

// Tiny artificial latency for mock-backed reads so loading states are visible.
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function makeMockCrud<K extends keyof ReturnType<typeof mockDb.get>>(key: K) {
  type Row = ReturnType<typeof mockDb.get>[K] extends Array<infer T> ? T : never;
  return {
    async list(): Promise<Row[]> {
      await wait();
      const db = mockDb.get();
      return db[key] as Row[];
    },
    async get(id: string): Promise<Row | undefined> {
      await wait();
      const db = mockDb.get();
      return (db[key] as Row[]).find((r) => (r as { id: string }).id === id);
    },
    async create(input: Partial<Row>): Promise<Row> {
      await wait();
      const db = mockDb.get();
      const row = {
        id: mockDb.uid(),
        createdAt: mockDb.now(),
        updatedAt: mockDb.now(),
        ...(input as object),
      } as unknown as Row;
      (db[key] as Row[]).unshift(row);
      mockDb.set(db);
      return row;
    },
    async update(id: string, patch: Partial<Row>): Promise<Row> {
      await wait();
      const db = mockDb.get();
      const arr = db[key] as Row[];
      const idx = arr.findIndex((r) => (r as { id: string }).id === id);
      if (idx === -1) throw new Error("Not found");
      const updated = { ...(arr[idx] as object), ...(patch as object), updatedAt: mockDb.now() } as Row;
      arr[idx] = updated;
      mockDb.set(db);
      return updated;
    },
    async remove(id: string): Promise<void> {
      await wait();
      const db = mockDb.get();
      const arr = db[key] as Row[];
      const idx = arr.findIndex((r) => (r as { id: string }).id === id);
      if (idx !== -1) {
        arr.splice(idx, 1);
        mockDb.set(db);
      }
    },
  };
}

const companyAccess = makeSingletonAccess<CompanyInfo>(SINGLETONS.company);
const contactAccess = makeSingletonAccess<ContactInfo>(SINGLETONS.contact);

export const api = {
  // Sanity-backed content resources
  projects: makeSanityCrud<Project>(RESOURCES.projects),
  properties: makeSanityCrud<Property>(RESOURCES.properties),
  gallery: makeSanityCrud<GalleryItem>(RESOURCES.gallery),
  testimonials: makeSanityCrud<Testimonial>(RESOURCES.testimonials),
  faqs: makeSanityCrud<FAQ>(RESOURCES.faqs),
  leadership: makeSanityCrud<LeadershipEntry>(RESOURCES.leadership),
  achievements: makeSanityCrud<Achievement>(RESOURCES.achievements),
  services: makeSanityCrud<Service>(RESOURCES.services),
  land: makeSanityCrud<Land>(RESOURCES.land),

  // Mock-backed CRM & deferred resources
  users: makeMockCrud("users"),
  clients: makeMockCrud("clients"),
  subscriptions: makeMockCrud("subscriptions"),
  payments: {
    ...makeMockCrud("payments"),
    async byClient(clientId: string) {
      await wait();
      return mockDb.get().payments.filter((p) => p.clientId === clientId);
    },
    async bySubscription(subscriptionId: string) {
      await wait();
      return mockDb
        .get()
        .payments.filter((p) => p.subscriptionId === subscriptionId)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    },
    async record(input: {
      clientId: string;
      subscriptionId: string;
      date: string;
      label: string;
      amount: number;
      currency: string;
    }) {
      await wait();
      const db = mockDb.get();
      const row = {
        id: mockDb.uid(),
        ...input,
      };
      db.payments.unshift(row);
      const sub = db.subscriptions.find((s) => s.id === input.subscriptionId);
      if (sub) {
        sub.amountPaid = (sub.amountPaid ?? 0) + input.amount;
        // Advance nextDueDate to next unpaid installment when explicit schedule exists.
        if (sub.installments && sub.installments.length) {
          const sorted = [...sub.installments].sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
          let running = 0;
          const next = sorted.find((r) => {
            running += r.amount;
            return running > (sub.amountPaid ?? 0);
          });
          sub.nextDueDate = next?.dueDate;
        }
      }
      mockDb.set(db);
      return row;
    },
    async reverse(paymentId: string) {
      await wait();
      const db = mockDb.get();
      const idx = db.payments.findIndex((p) => p.id === paymentId);
      if (idx === -1) return;
      const [removed] = db.payments.splice(idx, 1);
      if (removed?.subscriptionId) {
        const sub = db.subscriptions.find((s) => s.id === removed.subscriptionId);
        if (sub) {
          sub.amountPaid = Math.max(0, (sub.amountPaid ?? 0) - removed.amount);
          if (sub.installments && sub.installments.length) {
            const sorted = [...sub.installments].sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
            let running = 0;
            const next = sorted.find((r) => {
              running += r.amount;
              return running > (sub.amountPaid ?? 0);
            });
            sub.nextDueDate = next?.dueDate;
          }
        }
      }
      mockDb.set(db);
    },
  },
  enquiries: makeMockCrud("enquiries"),
  auditLog: makeMockCrud("auditLog"),
  homepageSections: makeMockCrud("homepageSections"),
  seo: makeMockCrud("seo"),
  documents: {
    ...makeMockCrud("documents"),
    async listForSubscription(subscriptionId: string) {
      await wait();
      return mockDb.get().documents.filter((d) => d.subscriptionId === subscriptionId);
    },
    async listForClient(clientId: string) {
      await wait();
      const db = mockDb.get();
      const subIds = db.subscriptions.filter((s) => s.clientId === clientId).map((s) => s.id);
      return db.documents.filter((d) => subIds.includes(d.subscriptionId));
    },
  },
  projectUpdates: {
    ...makeMockCrud("projectUpdates"),
    async listForProject(projectRef: string) {
      await wait();
      return mockDb
        .get()
        .projectUpdates.filter((u) => u.projectRef === projectRef)
        .sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1));
    },
    async listForClient(clientId: string) {
      await wait();
      const db = mockDb.get();
      const refs = new Set(
        db.subscriptions.filter((s) => s.clientId === clientId).map((s) => s.projectRef).filter(Boolean) as string[],
      );
      return db.projectUpdates
        .filter((u) => refs.has(u.projectRef))
        .sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1));
    },
  },
  subscriptionsForClient: async (clientId: string) => {
    return (await mockDb.get().subscriptions).filter((s) => s.clientId === clientId);
  },

  // Sanity singletons
  async getCompany(): Promise<CompanyInfo> {
    return companyAccess.get();
  },
  async updateCompany(patch: Partial<CompanyInfo>): Promise<CompanyInfo> {
    return companyAccess.update(patch);
  },
  async getContact(): Promise<ContactInfo> {
    return contactAccess.get();
  },
  async updateContact(patch: Partial<ContactInfo>): Promise<ContactInfo> {
    return contactAccess.update(patch);
  },

  // Dashboard stats — reads across both backends (Sanity content counts +
  // mock CRM counts). Sanity counts are done via GROQ for efficiency.
  async dashboardStats() {
    await wait();
    const db = mockDb.get();
    const now = Date.now();
    const expiringSoon = db.subscriptions.filter((s) => {
      const end = new Date(s.endDate).getTime();
      return s.status === "ACTIVE" && end - now < 30 * 86400_000 && end - now > 0;
    }).length;

    // Sanity content stats (best-effort; fallback to 0 if fetch fails)
    let publishedProjects = 0;
    let draftProjects = 0;
    try {
      const { sanityRead } = await import("../sanity/read-client");
      const counts = await sanityRead.fetch<{ published: number; draft: number }>(
        `{
          "published": count(*[_type == "project" && !(_id in path("drafts.**"))]),
          "draft": count(*[_type == "project" && _id in path("drafts.**")])
        }`,
      );
      publishedProjects = counts.published ?? 0;
      draftProjects = counts.draft ?? 0;
    } catch {
      // ignore
    }

    return {
      clientsActive: db.clients.filter((c) => c.status === "ACTIVE").length,
      clientsTotal: db.clients.length,
      subscriptionsActive: db.subscriptions.filter((s) => s.status === "ACTIVE").length,
      expiringSoon,
      enquiriesNew: db.enquiries.filter((e) => e.status === "NEW").length,
      enquiriesUnassigned: db.enquiries.filter((e) => !e.assignedToId).length,
      contentInReview: 0,
      publishedProjects,
      draftProjects,
      publishedProperties: publishedProjects,
      draftProperties: draftProjects,
      recentActivity: db.auditLog.slice(0, 8),
    };
  },
};

// Re-export types for callers so they only import from one place.
export type {
  Achievement,
  AuditLog,
  Client,
  CompanyInfo,
  ContactInfo,
  Enquiry,
  FAQ,
  GalleryItem,
  HomepageSection,
  Land,
  LeadershipEntry,
  Project,
  ProjectUpdate,
  Property,
  SEOMetadata,
  Service,
  SubscriberDocument,
  Testimonial,
  User,
};
