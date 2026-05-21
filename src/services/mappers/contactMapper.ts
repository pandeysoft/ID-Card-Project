import type {
  ContactSnapshot,
  ProfileLink,
  ProfileType,
  SavedContact,
} from '../../types';
import type { Database } from '../../types/database';
import type {
  CreateContactInput,
  UpdateContactInput,
} from '../contactService';

export type ContactRow = Database['public']['Tables']['contacts']['Row'];

export type ContactLinkRow = Database['public']['Tables']['contact_links']['Row'];

type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

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

export function mapContactToInsert(contact: CreateContactInput): ContactInsert {
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

export function mapContactUpdatesToRow(updates: UpdateContactInput): ContactUpdate {
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
