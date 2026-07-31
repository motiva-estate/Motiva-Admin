// Browser-side mock database for CRM and deferred resources only.
// Content resources (projects, properties, gallery, testimonials, faqs,
// leadership, achievements, services, land, company, contact) are served
// from Sanity — the seeds here are just empty placeholders so the shape
// of `DB` is stable for the mock-backed CRUD helper.

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
  LeadershipEntry,
  Payment,
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

const STORAGE_KEY = "motiva.admin.db.v10";

interface DB {
  users: User[];
  projects: Project[];
  properties: Property[];
  gallery: GalleryItem[];
  testimonials: Testimonial[];
  faqs: FAQ[];
  leadership: LeadershipEntry[];
  achievements: Achievement[];
  services: Service[];
  company: CompanyInfo;
  contact: ContactInfo;
  clients: Client[];
  subscriptions: Subscription[];
  payments: Payment[];
  enquiries: Enquiry[];
  auditLog: AuditLog[];
  homepageSections: HomepageSection[];
  seo: SEOMetadata[];
  documents: SubscriberDocument[];
  projectUpdates: ProjectUpdate[];
}

const now = () => new Date().toISOString();
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function seed(): DB {
  const superAdmin: User = {
    id: "u-super",
    fullName: "Ada Motiva",
    email: "admin@motivaestate.com",
    role: "SUPER_ADMIN",
    isActive: true,
    twoFAEnabled: false,
    lastLoginAt: now(),
    createdAt: now(),
  };
  const editor: User = {
    id: "u-editor",
    fullName: "Chidi Editor",
    email: "editor@motivaestate.com",
    role: "CONTENT_EDITOR",
    isActive: true,
    twoFAEnabled: false,
    createdAt: now(),
  };
  const admin: User = {
    id: "u-admin",
    fullName: "Femi Administrator",
    email: "manager@motivaestate.com",
    role: "ADMINISTRATOR",
    isActive: true,
    twoFAEnabled: false,
    createdAt: now(),
  };
  const subscriber: User = {
    id: "u-sub-elena",
    fullName: "Elena Söderberg",
    email: "subscriber@motivaestate.com",
    role: "SUBSCRIBER",
    isActive: true,
    twoFAEnabled: false,
    clientId: "c-1",
    createdAt: now(),
  };
  const subscriber2: User = {
    id: "u-sub-adaeze",
    fullName: "Adaeze Okonkwo",
    email: "adaeze.portal@motivaestate.com",
    role: "SUBSCRIBER",
    isActive: true,
    twoFAEnabled: false,
    clientId: "c-2",
    createdAt: now(),
  };

  return {
    users: [superAdmin, admin, editor, subscriber, subscriber2],
    // Sanity-backed — kept empty; the API client reads these from Sanity.
    projects: [],
    properties: [],
    gallery: [],
    testimonials: [],
    faqs: [],
    leadership: [],
    achievements: [],
    services: [],
    company: { id: "", createdAt: now(), updatedAt: now() },
    contact: { id: "", createdAt: now(), updatedAt: now() },
    // CRM
    clients: [
      {
        _id: "c-1",
        fullName: "Elena Söderberg",
        firstName: "Elena",
        lastName: "Söderberg",
        email: "elena@example.com",
        phone: "+234 802 111 2222",
        contactAddress: "12B Banana Island, Ikoyi, Lagos",
        source: "REFERRAL",
        status: "ACTIVE",
        nextOfKin: {
          firstName: "Lars",
          lastName: "Söderberg",
          phone: "+46 70 555 8899",
          address: "Storgatan 14, Stockholm, Sweden",
        },
        termsAccepted: true,
        signatureName: "Elena Söderberg",
        signatureDate: new Date(Date.now() - 200 * 86400_000).toISOString(),
        idDocumentUrl: "https://placehold.co/600x400?text=ID",
        utilityBillUrl: "https://placehold.co/600x400?text=Utility",
        notes: "Prefers weekday viewings. Requested quiet handover.",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        _id: "c-2",
        fullName: "Adaeze Okonkwo",
        firstName: "Adaeze",
        lastName: "Okonkwo",
        email: "adaeze@example.com",
        source: "WEBSITE_FORM",
        status: "ACTIVE",
        termsAccepted: true,
        signatureName: "Adaeze Okonkwo",
        signatureDate: now(),
        createdAt: now(),
        updatedAt: now(),
      },
      {
        _id: "c-3",
        fullName: "Tunde Bakare",
        firstName: "Tunde",
        lastName: "Bakare",
        email: "tunde@example.com",
        phone: "+234 803 555 1010",
        source: "REFERRAL",
        status: "ACTIVE",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        _id: "c-4",
        fullName: "Ngozi & Femi Adeyemi",
        email: "adeyemi@example.com",
        source: "REFERRAL",
        status: "ACTIVE",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        _id: "c-5",
        fullName: "Chidera Okafor",
        firstName: "Chidera",
        lastName: "Okafor",
        email: "chidera@example.com",
        source: "WEBSITE_FORM",
        status: "LEAD",
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    subscriptions: [
      {
        _id: "s-1",
        id: "s-1",
        clientId: "c-1",
        plan: "Casa Solano — Residence Purchase",
        status: "ACTIVE",
        startDate: new Date(Date.now() - 200 * 86400_000).toISOString(),
        endDate: new Date(Date.now() + 165 * 86400_000).toISOString(),
        amount: 850_000_000,
        currency: "NGN",
        autoRenew: false,
        createdAt: now(),
        projectRef: "project-casa-solano",
        projectRefType: "project",
        totalPrice: 850_000_000,
        amountPaid: 510_000_000,
        paymentPlan: "3-4mo",
        nextDueDate: new Date(Date.now() + 20 * 86400_000).toISOString(),
        installments: [
          {
            index: 1,
            label: "Initial deposit",
            dueDate: new Date(Date.now() - 200 * 86400_000).toISOString(),
            amount: 170_000_000,
          },
          {
            index: 2,
            label: "Installment 1 of 4",
            dueDate: new Date(Date.now() - 120 * 86400_000).toISOString(),
            amount: 170_000_000,
          },
          {
            index: 3,
            label: "Installment 2 of 4",
            dueDate: new Date(Date.now() - 40 * 86400_000).toISOString(),
            amount: 170_000_000,
          },
          {
            index: 4,
            label: "Installment 3 of 4",
            dueDate: new Date(Date.now() + 20 * 86400_000).toISOString(),
            amount: 170_000_000,
          },
          {
            index: 5,
            label: "Final balance",
            dueDate: new Date(Date.now() + 100 * 86400_000).toISOString(),
            amount: 170_000_000,
          },
        ],
      },
      {
        _id: "s-2",
        id: "s-2",
        clientId: "c-1",
        plan: "Lanzarote — Land Parcel",
        status: "ACTIVE",
        startDate: new Date(Date.now() - 90 * 86400_000).toISOString(),
        endDate: new Date(Date.now() + 275 * 86400_000).toISOString(),
        amount: 48_000_000,
        currency: "NGN",
        autoRenew: false,
        createdAt: now(),
        projectRef: "land-lanzarote-a12",
        projectRefType: "land",
        totalPrice: 48_000_000,
        amountPaid: 12_000_000,
        paymentPlan: "12mo",
        nextDueDate: new Date(Date.now() + 7 * 86400_000).toISOString(),
        installments: Array.from({ length: 12 }, (_, i) => ({
          index: i + 1,
          label: i === 0 ? "Land deposit" : `Monthly installment ${i}`,
          dueDate: new Date(Date.now() + (i * 30 - 88) * 86400_000).toISOString(),
          amount: 4_000_000,
        })),
      },
      {
        _id: "s-3",
        id: "s-3",
        clientId: "c-2",
        plan: "Kaura Heights — Unit 04B",
        status: "ACTIVE",
        startDate: new Date(Date.now() - 340 * 86400_000).toISOString(),
        endDate: new Date(Date.now() + 25 * 86400_000).toISOString(),
        amount: 220_000_000,
        currency: "NGN",
        autoRenew: false,
        createdAt: now(),
        projectRef: "project-kaura-heights",
        projectRefType: "project",
        totalPrice: 220_000_000,
        amountPaid: 220_000_000,
        paymentPlan: "12mo",
      },
    ],
    payments: [
      {
        id: "pay-1",
        clientId: "c-1",
        subscriptionId: "s-1",
        date: new Date(Date.now() - 200 * 86400_000).toISOString(),
        label: "Initial deposit — Casa Solano",
        amount: 170_000_000,
        currency: "NGN",
      },
      {
        id: "pay-2",
        clientId: "c-1",
        subscriptionId: "s-1",
        date: new Date(Date.now() - 120 * 86400_000).toISOString(),
        label: "Installment 1 of 4",
        amount: 170_000_000,
        currency: "NGN",
      },
      {
        id: "pay-3",
        clientId: "c-1",
        subscriptionId: "s-1",
        date: new Date(Date.now() - 40 * 86400_000).toISOString(),
        label: "Installment 2 of 4",
        amount: 170_000_000,
        currency: "NGN",
      },
      {
        id: "pay-4",
        clientId: "c-1",
        subscriptionId: "s-2",
        date: new Date(Date.now() - 88 * 86400_000).toISOString(),
        label: "Land deposit — Lanzarote A12",
        amount: 12_000_000,
        currency: "NGN",
      },
      {
        id: "pay-5",
        clientId: "c-2",
        subscriptionId: "s-3",
        date: new Date(Date.now() - 340 * 86400_000).toISOString(),
        label: "Initial deposit — Kaura Heights",
        amount: 70_000_000,
        currency: "NGN",
      },
      {
        id: "pay-6",
        clientId: "c-2",
        subscriptionId: "s-3",
        date: new Date(Date.now() - 200 * 86400_000).toISOString(),
        label: "Installment tranche",
        amount: 90_000_000,
        currency: "NGN",
      },
      {
        id: "pay-7",
        clientId: "c-2",
        subscriptionId: "s-3",
        date: new Date(Date.now() - 60 * 86400_000).toISOString(),
        label: "Final balance",
        amount: 60_000_000,
        currency: "NGN",
      },
    ],
    enquiries: [
      {
        id: "e-1",
        name: "Bola Ade",
        email: "bola@example.com",
        message: "Interested in a new residence in Ikoyi similar to Casa Solano.",
        status: "NEW",
        createdAt: now(),
      },
      {
        id: "e-2",
        name: "Ifeoma Chukwu",
        email: "ifeoma@example.com",
        message: "Land + architecture — 1,200 sqm plot in Katampe.",
        status: "NEW",
        createdAt: now(),
      },
      {
        id: "e-3",
        name: "Michael Idowu",
        email: "michael@example.com",
        phone: "+234 806 220 8811",
        message: "Studio consultation for an existing property in Port Harcourt.",
        status: "CONTACTED",
        createdAt: now(),
      },
    ],
    auditLog: [],
    documents: [
      {
        id: "d-1",
        subscriptionId: "s-1",
        fileUrl: "https://placehold.co/800x1000?text=Receipt+01",
        label: "Receipt — Initial deposit",
        visibility: "immediate",
        uploadedAt: new Date(Date.now() - 200 * 86400_000).toISOString(),
      },
      {
        id: "d-2",
        subscriptionId: "s-1",
        fileUrl: "https://placehold.co/800x1000?text=Receipt+02",
        label: "Receipt — Installment 1 of 4",
        visibility: "immediate",
        uploadedAt: new Date(Date.now() - 120 * 86400_000).toISOString(),
      },
      {
        id: "d-3",
        subscriptionId: "s-1",
        fileUrl: "https://placehold.co/800x1000?text=Offer+Letter",
        label: "Offer letter",
        visibility: "immediate",
        uploadedAt: new Date(Date.now() - 195 * 86400_000).toISOString(),
      },
      {
        id: "d-4",
        subscriptionId: "s-1",
        fileUrl: "https://placehold.co/800x1000?text=Title+Deed",
        label: "Title deed",
        visibility: "on_full_payment",
        uploadedAt: new Date(Date.now() - 30 * 86400_000).toISOString(),
      },
      {
        id: "d-5",
        subscriptionId: "s-2",
        fileUrl: "https://placehold.co/800x1000?text=Land+Receipt",
        label: "Receipt — Land deposit",
        visibility: "immediate",
        uploadedAt: new Date(Date.now() - 88 * 86400_000).toISOString(),
      },
      {
        id: "d-6",
        subscriptionId: "s-2",
        fileUrl: "https://placehold.co/800x1000?text=Survey",
        label: "Survey document",
        visibility: "on_milestone:survey",
        uploadedAt: new Date(Date.now() - 20 * 86400_000).toISOString(),
      },
      {
        id: "d-7",
        subscriptionId: "s-3",
        fileUrl: "https://placehold.co/800x1000?text=Allocation",
        label: "Allocation letter",
        visibility: "immediate",
        uploadedAt: new Date(Date.now() - 10 * 86400_000).toISOString(),
      },
      {
        id: "d-8",
        subscriptionId: "s-3",
        fileUrl: "https://placehold.co/800x1000?text=C+of+O",
        label: "Certificate of Occupancy",
        visibility: "on_full_payment",
        uploadedAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
      },
    ],
    projectUpdates: [
      {
        id: "pu-1",
        projectRef: "project-casa-solano",
        projectRefType: "project",
        text: "Structural works on Block B are complete — moving to façade and interiors this month.",
        photos: ["https://placehold.co/1200x800?text=Casa+Solano+Facade"],
        postedAt: new Date(Date.now() - 6 * 86400_000).toISOString(),
      },
      {
        id: "pu-2",
        projectRef: "project-casa-solano",
        projectRefType: "project",
        text: "Landscape design finalised with the studio. Planting begins after handover of external hardscape.",
        photos: [],
        postedAt: new Date(Date.now() - 22 * 86400_000).toISOString(),
      },
      {
        id: "pu-3",
        projectRef: "land-lanzarote-a12",
        projectRefType: "land",
        text: "Perimeter survey booked for next week. All parcel owners will receive individual survey documents once complete.",
        photos: [],
        postedAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
      },
      {
        id: "pu-4",
        projectRef: "project-kaura-heights",
        projectRefType: "project",
        text: "Kaura Heights received practical completion sign-off. Handover packs are being finalised.",
        photos: ["https://placehold.co/1200x800?text=Kaura+Handover"],
        postedAt: new Date(Date.now() - 12 * 86400_000).toISOString(),
      },
    ],
    homepageSections: [
      { id: "hs-1", key: "hero", label: "Hero", order: 1, isVisible: true },
      { id: "hs-2", key: "the-practice", label: "002 — The Practice", order: 2, isVisible: true },
      {
        id: "hs-3",
        key: "signature-residences",
        label: "003 — Signature Residences",
        order: 3,
        isVisible: true,
      },
      { id: "hs-4", key: "principles", label: "004 — Principles", order: 4, isVisible: true },
      { id: "hs-5", key: "the-method", label: "005 — The Method", order: 5, isVisible: true },
      { id: "hs-6", key: "recent-works", label: "006 — Recent Works", order: 6, isVisible: true },
      { id: "hs-7", key: "testimonials", label: "Testimonials", order: 7, isVisible: true },
      { id: "hs-8", key: "the-journal", label: "007 — The Journal", order: 8, isVisible: true },
      {
        id: "hs-9",
        key: "contact",
        label: "008 — Begin a conversation",
        order: 9,
        isVisible: true,
      },
    ],
    seo: [
      {
        id: "seo-home",
        pageKey: "home",
        title: "Motiva — a fully integrated real-estate practice",
        description: "Fully integrated real-estate solutions across Lagos and Abuja since 2010.",
        canonicalUrl: "https://www.motivaestate.com/",
      },
      {
        id: "seo-projects",
        pageKey: "projects",
        title: "Signature Residences — Motiva",
        description: "A quiet collection of residences composed for the few.",
      },
      {
        id: "seo-about",
        pageKey: "about",
        title: "The Practice — Motiva Estate",
        description: "Motiva Estate Company — a fully integrated real-estate practice.",
      },
      {
        id: "seo-contact",
        pageKey: "contact",
        title: "Begin a conversation — Motiva",
        description: "Offices in Lagos and Abuja. We respond within two working days.",
      },
    ],
  };
}

function load(): DB {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as DB;
  } catch {
    return seed();
  }
}

function save(db: DB) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDb() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const mockDb = {
  get: load,
  set: save,
  uid,
  now,
};
