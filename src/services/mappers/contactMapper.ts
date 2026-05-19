import type {
  ContactSnapshot,
  ProfileLink,
  ProfileType,
  SavedContact,
} from '../../types';
import type {
  CreateContactInput,
  UpdateContactInput,
} from '../contactService';

export type ContactRow = {
  id: string;
  user_id: string;
  source_profile_id: string | null;
  name: string;
  headline: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type ContactLinkRow = {
  id: string;
  contact_id: string;
  label: string;
  url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ContactWithLinksRow = ContactRow & {
  contact_links?: ContactLinkRow[] | null;
};

export function mapContactRowToContact(row: ContactWithLinksRow): SavedContact {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.source_profile_id ?? undefined,
    snapshot: mapContactSnapshot(row),
    notes: row.notes ?? undefined,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapContactToInsert(contact: CreateContactInput) {
  return {
    user_id: contact.userId,
    source_profile_id: contact.profileId ?? null,
    name: contact.name,
    headline: contact.headline ?? null,
    bio: contact.bio ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    location: contact.location ?? null,
    notes: contact.notes ?? null,
    tags: contact.tags ?? [],
  };
}

export function mapContactUpdatesToRow(updates: UpdateContactInput) {
  return {
    ...(updates.profileId !== undefined ? { source_profile_id: updates.profileId } : {}),
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.headline !== undefined ? { headline: updates.headline } : {}),
    ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
    ...(updates.email !== undefined ? { email: updates.email } : {}),
    ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
    ...(updates.location !== undefined ? { location: updates.location } : {}),
    ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
    ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
  };
}

function mapContactSnapshot(row: ContactWithLinksRow): ContactSnapshot {
  return {
    id: row.id,
    profileId: row.source_profile_id ?? row.id,
    type: 'professional' satisfies ProfileType,
    name: row.name,
    headline: row.headline ?? '',
    bio: row.bio ?? '',
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    location: row.location ?? undefined,
    links: (row.contact_links ?? []).map(mapContactLinkRowToProfileLink),
    capturedAt: row.created_at,
  };
}

function mapContactLinkRowToProfileLink(row: ContactLinkRow): ProfileLink {
  return {
    id: row.id,
    profileId: row.contact_id,
    label: row.label,
    url: row.url,
    order: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
