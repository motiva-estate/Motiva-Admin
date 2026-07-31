// Domain types — aligned to the Sanity schema for content resources
// (project, land, faq, service, galleryItem, testimonial, leadershipEntry,
// achievement, companyInfo, contactInfo). CRM types (Client, Subscription,
// Payment, Enquiry, etc.) remain mock-DB shaped.

export interface Payment {
  id: string;
  clientId: string;
  subscriptionId?: string;
  date: string;
  label: string;
  amount: number;
  currency: string;
}

export type Role = "SUPER_ADMIN" | "ADMINISTRATOR" | "CONTENT_EDITOR" | "VIEWER" | "SUBSCRIBER";
export type ContentStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
export type ClientStatus = "LEAD" | "ACTIVE" | "LAPSED" | "CONVERTED";
export type ClientSource = "WEBSITE_FORM" | "BULK_IMPORT" | "MANUAL" | "REFERRAL";
export type SubscriptionStatus = "ACTIVE" | "PENDING" | "EXPIRED" | "CANCELLED";
export type EnquiryStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";
export type EmailStatus = "QUEUED" | "SENT" | "FAILED";
export type ImportStatus = "PENDING" | "VALIDATED" | "IMPORTED" | "FAILED";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  twoFAEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  // Set for role=SUBSCRIBER — links the login to a Client record.
  clientId?: string;
}

// -------- Sanity: project --------
// Public "residences" are the `project` Sanity type. Admin surfaces both
// projects and properties from it; `type` is aliased to Sanity `propertyType`
// only on the Property view.
export type SanityProjectStatus = "pre-sale" | "ongoing" | "delivered";
export type SanityPropertyType = "Villa" | "Apartment" | "Townhouse" | "Penthouse";

export interface ProjectFaq {
  q: string;
  a: string;
}

export interface GalleryImage {
  url: string;
  caption?: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  tagline?: string;
  location?: string;
  city?: string;
  propertyType?: SanityPropertyType;
  projectStatus?: SanityProjectStatus;
  phaseLabel?: string;
  buildingType?: string;
  bedrooms?: number; // Sanity `beds`
  bathrooms?: number; // Sanity `baths`
  description?: string;
  amenities?: string[];
  coords?: string;
  nearby?: string[];
  faq?: ProjectFaq[];
  coverImageUrl?: string; // resolved from Sanity image or coverUrl
  coverUrl?: string; // raw external URL fallback
  galleryImages?: string[]; // flattened URLs from Sanity gallery[]
  isPriceInternal?: boolean;
  featured?: boolean;
  order?: number;
  status: ContentStatus; // derived from draft/published in Sanity
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

// Property view over the same `project` document type.
export interface Property extends Omit<Project, "propertyType"> {
  type?: SanityPropertyType; // aliased to Sanity `propertyType`
  projectId?: string;
}

// -------- Sanity: galleryItem --------
export interface GalleryItem {
  id: string;
  imageUrl: string; // resolved from `image` or `url`
  caption?: string;
  category?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// -------- Sanity: testimonial --------
export interface Testimonial {
  id: string;
  authorName: string;
  authorTitle?: string;
  quote: string;
  rating?: number;
  avatarUrl?: string;
  order?: number;
  status: ContentStatus; // derived from draft/published
  createdAt: string;
  updatedAt: string;
}

// -------- Sanity: faq --------
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// -------- Sanity: leadershipEntry --------
export interface LeadershipEntry {
  id: string;
  name: string;
  role: string;
  bio?: string;
  photoUrl?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// -------- Sanity: achievement --------
export interface Achievement {
  id: string;
  title: string;
  description?: string;
  year?: number;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// -------- Sanity: service --------
export interface Service {
  id: string;
  number?: string; // e.g. "01"
  title: string;
  slug: string;
  lede?: string;
  body?: string;
  items?: string[];
  icon?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// -------- Sanity: companyInfo (singleton) --------
export interface CompanyStat {
  label: string;
  value: string;
}
export interface CompanyInfo {
  id: string;
  foundingYear?: number;
  mission?: string;
  vision?: string;
  stats?: CompanyStat[];
  createdAt: string;
  updatedAt: string;
}

// -------- Sanity: contactInfo (singleton) --------
export interface Office {
  label: string;
  address: string;
  phone: string;
}
export interface SocialLink {
  platform: string;
  url: string;
}
export interface ContactInfo {
  id: string;
  primaryEmail?: string;
  secondaryEmail?: string;
  primaryPhone?: string;
  whatsappNumber?: string;
  offices?: Office[];
  socialLinks?: SocialLink[];
  createdAt: string;
  updatedAt: string;
}

// -------- Sanity: land --------
export interface Land {
  id: string;
  name: string;
  slug: string;
  location?: string;
  estate?: string;
  status: "available" | "reserved" | "sold";
  sizes?: number[];
  description?: string;
  estateAmenities?: string[];
  coverImageUrl?: string;
  coverUrl?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// -------- CRM (mock-DB) --------
export interface NextOfKin {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

export interface Client {
  _id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  contactAddress?: string;
  source: ClientSource;
  status: ClientStatus;
  assignedProjectId?: string;
  subscribedProjectIds?: string[];
  nextOfKin?: NextOfKin;
  termsAccepted?: boolean;
  signatureName?: string;
  signatureDate?: string;
  idDocumentUrl?: string;
  utilityBillUrl?: string;
  passportPhotoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Subscriber portal — set once the subscriber confirms contact details
  // on first login. Used to trigger the confirm-contact prompt.
  contactConfirmedAt?: string;
  // Subscriber portal — notification channel preferences (Phase 2 wiring).
  notificationPrefs?: { email: boolean; whatsapp: boolean };
}

export interface Installment {
  index: number;
  label?: string;
  dueDate: string;
  amount: number;
}

export interface Subscription {
  _id: string;
  id?: string; // alias populated by the API normaliser (_id → id)
  clientId: string;
  plan: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  paymentReference?: string;
  autoRenew: boolean;
  createdAt: string;
  // Subscriber-portal (PRD Phase 1) additions. Optional so legacy
  // service-subscription rows keep working.
  projectRef?: string; // Sanity project or land _id
  projectRefType?: "project" | "land";
  totalPrice?: number;
  amountPaid?: number;
  paymentPlan?: string; // e.g. "12mo", "3-4mo", "Custom"
  nextDueDate?: string;
  // Explicit installment schedule managed by admin. When present, this
  // overrides the derived plan used by the portal.
  installments?: Installment[];
}

// Documents attached to a subscription by admin, released to the
// subscriber based on `visibility`. See PRD §4.6.
export type DocumentVisibility = "immediate" | "on_full_payment" | `on_milestone:${string}`;

export interface SubscriberDocument {
  id: string;
  subscriptionId: string;
  fileUrl: string;
  label: string;
  visibility: DocumentVisibility;
  uploadedAt: string;
}

// Project-wide update posted by admin — visible to every subscriber
// linked to that project/land ref. See PRD §4.7.
export interface ProjectUpdate {
  id: string;
  projectRef: string;
  projectRefType: "project" | "land";
  text: string;
  photos: string[];
  postedAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  propertyId?: string;
  status: EnquiryStatus;
  assignedToId?: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  templateKey: string;
  clientId?: string;
  status: EmailStatus;
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  createdAt: string;
}

export interface HomepageSection {
  id: string;
  key: string;
  label: string;
  order: number;
  isVisible: boolean;
}

export interface SEOMetadata {
  id: string;
  pageKey?: string;
  projectId?: string;
  propertyId?: string;
  title: string;
  description: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
}

// Permission helpers keyed by resource
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMINISTRATOR: "Administrator",
  CONTENT_EDITOR: "Content Editor",
  VIEWER: "Viewer",
  SUBSCRIBER: "Subscriber",
};

export const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Draft",
  REVIEW: "In Review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};
