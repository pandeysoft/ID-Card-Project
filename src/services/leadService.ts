import { supabase } from './supabase';
import {
  mapLeadRowToLead,
  mapLeadToInsert,
  mapLeadUpdatesToRow,
  type LeadWithContactRow,
} from './mappers/leadMapper';
import type { Lead, LeadStatus, Profile } from '../types';

export type LeadCaptureSource =
  | 'qr_booth'
  | 'manual'
  | 'business_card_scan'
  | 'public_profile_form';

export type CreateLeadInput = {
  userId: string;
  contactId?: string;
  profileId?: string;
  status?: LeadStatus;
  source?: string;
  notes?: string;
  nextFollowUpAt?: string;
};

export type UpdateLeadInput = Partial<
  Omit<CreateLeadInput, 'userId'>
>;

function assertNoError(error: Error | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function getLeads(userId: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*, contacts(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<LeadWithContactRow[]>();

  assertNoError(error, 'Unable to load leads.');
  return (data ?? []).map(mapLeadRowToLead);
}

export async function getLeadById(leadId: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*, contacts(*)')
    .eq('id', leadId)
    .returns<LeadWithContactRow[]>()
    .maybeSingle();

  assertNoError(error, 'Unable to load lead.');
  return data ? mapLeadRowToLead(data) : null;
}

export async function createLead(lead: CreateLeadInput): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert(mapLeadToInsert(lead))
    .select('*, contacts(*)')
    .returns<LeadWithContactRow[]>()
    .single();

  assertNoError(error, 'Unable to create lead.');
  if (!data) {
    throw new Error('Unable to create lead.');
  }

  return mapLeadRowToLead(data);
}

export async function createLeadFromProfile(
  profile: Profile,
  businessUserId: string,
  source: LeadCaptureSource,
): Promise<Lead> {
  return createLead({
    userId: businessUserId,
    profileId: profile.id,
    status: 'new',
    source,
    notes: `Lead captured from ${profile.name}.`,
  });
}

export async function updateLead(
  leadId: string,
  updates: UpdateLeadInput,
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update(mapLeadUpdatesToRow(updates))
    .eq('id', leadId)
    .select('*, contacts(*)')
    .returns<LeadWithContactRow[]>()
    .single();

  assertNoError(error, 'Unable to update lead.');
  if (!data) {
    throw new Error('Unable to update lead.');
  }

  return mapLeadRowToLead(data);
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<Lead> {
  return updateLead(leadId, { status });
}

export async function deleteLead(leadId: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);

  assertNoError(error, 'Unable to delete lead.');
}
