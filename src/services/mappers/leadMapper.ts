import type {
  ContactSnapshot,
  Lead,
  LeadStatus,
  ProfileType,
} from '../../types';
import type {
  CreateLeadInput,
  UpdateLeadInput,
} from '../leadService';

export type LeadRow = {
  id: string;
  user_id: string;
  contact_id: string | null;
  profile_id: string | null;
  lead_status: LeadStatus;
  source: string | null;
  notes: string | null;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadContactRow = {
  id: string;
  source_profile_id: string | null;
  name: string;
  headline: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
};

export type LeadWithContactRow = LeadRow & {
  contacts?: LeadContactRow | null;
};

export function mapLeadRowToLead(row: LeadWithContactRow): Lead {
  return {
    id: row.id,
    ownerUserId: row.user_id,
    savedContactId: row.contact_id ?? undefined,
    snapshot: mapLeadContactSnapshot(row.contacts, row.profile_id),
    status: row.lead_status,
    source: row.source ?? undefined,
    notes: row.notes ?? undefined,
    nextFollowUpAt: row.next_follow_up_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLeadToInsert(lead: CreateLeadInput) {
  return {
    user_id: lead.userId,
    contact_id: lead.contactId ?? null,
    profile_id: lead.profileId ?? null,
    lead_status: lead.status ?? 'new',
    source: lead.source ?? null,
    notes: lead.notes ?? null,
    next_follow_up_at: lead.nextFollowUpAt ?? null,
  };
}

export function mapLeadUpdatesToRow(updates: UpdateLeadInput) {
  return {
    ...(updates.contactId !== undefined ? { contact_id: updates.contactId } : {}),
    ...(updates.profileId !== undefined ? { profile_id: updates.profileId } : {}),
    ...(updates.status !== undefined ? { lead_status: updates.status } : {}),
    ...(updates.source !== undefined ? { source: updates.source } : {}),
    ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
    ...(updates.nextFollowUpAt !== undefined
      ? { next_follow_up_at: updates.nextFollowUpAt }
      : {}),
  };
}

function mapLeadContactSnapshot(
  contact: LeadContactRow | null | undefined,
  fallbackProfileId: string | null,
): ContactSnapshot {
  return {
    id: contact?.id ?? 'unknown_contact',
    profileId: contact?.source_profile_id ?? fallbackProfileId ?? 'unknown_profile',
    type: 'professional' satisfies ProfileType,
    name: contact?.name ?? 'Unknown contact',
    headline: contact?.headline ?? '',
    bio: contact?.bio ?? '',
    email: contact?.email ?? undefined,
    phone: contact?.phone ?? undefined,
    location: contact?.location ?? undefined,
    links: [],
    capturedAt: contact?.created_at ?? new Date().toISOString(),
  };
}
