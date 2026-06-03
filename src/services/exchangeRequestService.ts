import { supabase } from './supabase';
import type { ContactExchangeRequest, ContactExchangeStatus } from '../types/cardiq';
import type { Database } from '../types/database';

type ExchangeRequestRow = Database['public']['Tables']['contact_exchange_requests']['Row'];
type ExchangeRequestInsert = Database['public']['Tables']['contact_exchange_requests']['Insert'];
type ExchangeRequestListRow =
  Database['public']['Functions']['list_contact_exchange_requests']['Returns'][number];

export type ExchangeRequestWithProfiles = ContactExchangeRequest & {
  requesterName?: string;
  requesterHeadline?: string;
  recipientName?: string;
  recipientHeadline?: string;
};

export type CreateExchangeRequestInput = {
  requesterUserId: string;
  requesterProfileId: string;
} & (
  | {
      recipientUserId: string;
      recipientProfileId: string;
    }
  | {
      recipientPublicSlug: string;
    }
);

function assertNoError(error: Error | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function createExchangeRequest(
  request: CreateExchangeRequestInput,
): Promise<ContactExchangeRequest> {
  if ('recipientPublicSlug' in request) {
    const { data, error } = await supabase
      .rpc('create_contact_exchange_request_by_slug', {
        p_recipient_public_slug: request.recipientPublicSlug,
        p_requester_profile_id: request.requesterProfileId,
      })
      .returns<ExchangeRequestRow[]>();

    assertNoError(error, 'Unable to create contact exchange request.');
    const rows = Array.isArray(data)
      ? (data as ExchangeRequestRow[])
      : data
        ? [data as unknown as ExchangeRequestRow]
        : [];
    const row = rows[0];
    if (!row) {
      throw new Error('Unable to create contact exchange request.');
    }

    return mapExchangeRequestRow(row);
  }

  const { data, error } = await supabase
    .from('contact_exchange_requests')
    .insert(mapExchangeRequestToInsert(request))
    .select('*')
    .returns<ExchangeRequestRow[]>()
    .single();

  assertNoError(error, 'Unable to create contact exchange request.');
  if (!data) {
    throw new Error('Unable to create contact exchange request.');
  }

  return mapExchangeRequestRow(data);
}

export async function acceptExchangeRequest(
  requestId: string,
  _recipientUserId: string,
): Promise<ContactExchangeRequest> {
  const { data, error } = await supabase
    .rpc('accept_contact_exchange_request', { p_request_id: requestId })
    .returns<ExchangeRequestRow[]>();

  assertNoError(error, 'Unable to accept contact exchange request.');
  const rows = Array.isArray(data) ? data : [];
  const row = rows[0];
  if (!row) {
    throw new Error('Unable to accept contact exchange request.');
  }

  return mapExchangeRequestRow(row);
}

export async function declineExchangeRequest(
  requestId: string,
  recipientUserId: string,
): Promise<ContactExchangeRequest> {
  return respondToExchangeRequest(requestId, recipientUserId, 'recipient_user_id', 'declined');
}

export async function cancelExchangeRequest(
  requestId: string,
  requesterUserId: string,
): Promise<ContactExchangeRequest> {
  return respondToExchangeRequest(requestId, requesterUserId, 'requester_user_id', 'cancelled');
}

export async function listExchangeRequests(): Promise<ExchangeRequestWithProfiles[]> {
  const { data, error } = await supabase
    .rpc('list_contact_exchange_requests', {})
    .returns<ExchangeRequestListRow[]>();

  assertNoError(error, 'Unable to load contact exchange requests.');
  const rows = Array.isArray(data) ? data : [];
  return rows.map(mapExchangeRequestListRow);
}

async function respondToExchangeRequest(
  requestId: string,
  userId: string,
  userColumn: 'requester_user_id' | 'recipient_user_id',
  status: Exclude<ContactExchangeStatus, 'pending'>,
): Promise<ContactExchangeRequest> {
  const { data, error } = await supabase
    .from('contact_exchange_requests')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq(userColumn, userId)
    .eq('status', 'pending')
    .select('*')
    .returns<ExchangeRequestRow[]>()
    .single();

  assertNoError(error, 'Unable to update contact exchange request.');
  if (!data) {
    throw new Error('Unable to update contact exchange request.');
  }

  return mapExchangeRequestRow(data);
}

function mapExchangeRequestToInsert(
  request: CreateExchangeRequestInput,
): ExchangeRequestInsert {
  if ('recipientPublicSlug' in request) {
    throw new Error('Recipient ids are required for direct exchange request inserts.');
  }

  return {
    requester_user_id: request.requesterUserId,
    recipient_user_id: request.recipientUserId,
    requester_profile_id: request.requesterProfileId,
    recipient_profile_id: request.recipientProfileId,
    status: 'pending',
  };
}

function mapExchangeRequestRow(row: ExchangeRequestRow): ContactExchangeRequest {
  return {
    id: row.id,
    requesterUserId: row.requester_user_id,
    recipientUserId: row.recipient_user_id,
    requesterProfileId: row.requester_profile_id,
    recipientProfileId: row.recipient_profile_id,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at ?? undefined,
  };
}

function mapExchangeRequestListRow(row: ExchangeRequestListRow): ExchangeRequestWithProfiles {
  return {
    ...mapExchangeRequestRow(row),
    requesterName: row.requester_name ?? undefined,
    requesterHeadline: row.requester_headline ?? undefined,
    recipientName: row.recipient_name ?? undefined,
    recipientHeadline: row.recipient_headline ?? undefined,
  };
}
