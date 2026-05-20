import { supabase } from './supabase';
import {
  mapContactRowToContact,
  mapContactToInsert,
  mapContactUpdatesToRow,
  type ContactWithLinksRow,
} from './mappers/contactMapper';
import type {
  Profile,
  SavedContact,
} from '../types';

export type ContactSource =
  | 'qr'
  | 'nfc'
  | 'manual'
  | 'business_card_scan'
  | 'lead_capture';

export type CreateContactInput = {
  userId: string;
  profileId?: string;
  name: string;
  headline?: string;
  bio?: string;
  email?: string;
  phone?: string;
  location?: string;
  notes?: string;
  tags?: readonly string[];
};

export type UpdateContactInput = Partial<
  Omit<CreateContactInput, 'userId'>
>;

export type GetContactsOptions = {
  limit?: number;
  offset?: number;
  search?: string;
};

function assertNoError(error: Error | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function getContacts(
  userId: string,
  options: GetContactsOptions = {},
): Promise<SavedContact[]> {
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;
  const search = options.search?.trim();
  let query = supabase
    .from('contacts')
    .select('*, contact_links(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,headline.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query.returns<ContactWithLinksRow[]>();

  assertNoError(error, 'Unable to load contacts.');
  return (data ?? []).map(mapContactRowToContact);
}

export async function getContactById(
  contactId: string,
): Promise<SavedContact | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*, contact_links(*)')
    .eq('id', contactId)
    .returns<ContactWithLinksRow[]>()
    .maybeSingle();

  assertNoError(error, 'Unable to load contact.');
  return data ? mapContactRowToContact(data) : null;
}

export async function createContact(
  contact: CreateContactInput,
): Promise<SavedContact> {
  const { data, error } = await supabase
    .from('contacts')
    .insert(mapContactToInsert(contact))
    .select('*, contact_links(*)')
    .returns<ContactWithLinksRow[]>()
    .single();

  assertNoError(error, 'Unable to create contact.');
  if (!data) {
    throw new Error('Unable to create contact.');
  }

  return mapContactRowToContact(data);
}

export async function createContactFromProfile(
  profile: Profile,
  ownerUserId: string,
  source: ContactSource,
): Promise<SavedContact> {
  return createContact({
    userId: ownerUserId,
    profileId: profile.id,
    name: profile.name,
    headline: profile.company ? `${profile.headline} at ${profile.company}` : profile.headline,
    bio: profile.bio,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    notes: `Source: ${source}`,
    tags: [source],
  });
}

export async function updateContact(
  contactId: string,
  updates: UpdateContactInput,
): Promise<SavedContact> {
  const { data, error } = await supabase
    .from('contacts')
    .update(mapContactUpdatesToRow(updates))
    .eq('id', contactId)
    .select('*, contact_links(*)')
    .returns<ContactWithLinksRow[]>()
    .single();

  assertNoError(error, 'Unable to update contact.');
  if (!data) {
    throw new Error('Unable to update contact.');
  }

  return mapContactRowToContact(data);
}

export async function deleteContact(contactId: string): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);

  assertNoError(error, 'Unable to delete contact.');
}

export async function syncLinkedContact(
  contactId: string,
): Promise<SavedContact> {
  const contact = await getContactById(contactId);

  if (!contact) {
    throw new Error('Cannot sync a contact that does not exist.');
  }

  return contact;
}
