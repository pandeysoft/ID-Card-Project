export type Timestamp = string;

export type ProfileType =
  | "personal"
  | "professional"
  | "acquaintance"
  | "business";

export type AccountPlan = "free" | "plus" | "business" | "enterprise";

export type UserRole = "user" | "admin" | "owner";

export type OrganizationRole = "owner" | "admin" | "member";

export type ProfileVisibility = "private" | "contacts" | "public";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountPlan: AccountPlan;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Organization {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PrivacySettings {
  userId: string;
  profileVisibility: ProfileVisibility;
  searchableByEmail: boolean;
  searchableByPhone: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SharingSettings {
  userId: string;
  contactSyncEnabled: boolean;
  leadSharingRequiresConsent: boolean;
  allowVCardExport: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AccountSettings {
  userId: string;
  privacy: PrivacySettings;
  sharing: SharingSettings;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface NetworkingSession {
  id: string;
  hostUserId: string;
  status: "active" | "ended";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NearbyUser {
  id: string;
  displayName: string;
  headline?: string;
  distanceLabel?: string;
  lastSeenAt: Timestamp;
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: Timestamp;
  leftAt?: Timestamp;
}

export interface ProfileLink {
  id: string;
  profileId: string;
  label: string;
  url: string;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Profile {
  id: string;
  userId: string;
  type: ProfileType;
  publicSlug: string;
  name: string;
  headline: string;
  company?: string;
  bio: string;
  email?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  links: readonly ProfileLink[];
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  profileId: string;
  companyName: string;
  jobTitle: string;
  industry?: string;
  websiteUrl?: string;
  companyLogoUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PublicProfile {
  id: string;
  profileId: string;
  type: ProfileType;
  name: string;
  headline: string;
  bio: string;
  avatarUrl?: string;
  links: readonly ProfileLink[];
  business?: BusinessProfile;
  updatedAt: Timestamp;
}

export interface ContactSnapshot {
  id: string;
  profileId: string;
  type: ProfileType;
  name: string;
  headline: string;
  bio: string;
  email?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  links: readonly ProfileLink[];
  business?: BusinessProfile;
  capturedAt: Timestamp;
}

export interface SavedContact {
  id: string;
  userId: string;
  profileId?: string;
  snapshot: ContactSnapshot;
  notes?: string;
  tags: readonly string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Lead {
  id: string;
  ownerUserId: string;
  savedContactId?: string;
  snapshot: ContactSnapshot;
  status: LeadStatus;
  source?: string;
  notes?: string;
  nextFollowUpAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
