import { supabase } from './supabase';
import type { Organization, OrganizationMember, OrganizationRole } from '../types';

export type CreateOrganizationInput = {
  ownerUserId: string;
  name: string;
  slug: string;
};

export type UpdateOrganizationInput = Partial<
  Pick<CreateOrganizationInput, 'name' | 'slug'>
>;

type OrganizationRow = {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

type OrganizationMemberRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
  updated_at: string;
};

function assertNoError(error: Error | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function getOrganizations(userId: string): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: false })
    .returns<OrganizationRow[]>();

  assertNoError(error, 'Unable to load organizations.');
  return (data ?? []).map(mapOrganizationRowToOrganization);
}

export async function getOrganizationById(
  organizationId: string,
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .returns<OrganizationRow[]>()
    .maybeSingle();

  assertNoError(error, 'Unable to load organization.');
  return data ? mapOrganizationRowToOrganization(data) : null;
}

export async function createOrganization(
  organization: CreateOrganizationInput,
): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .insert(mapOrganizationToInsert(organization))
    .select('*')
    .returns<OrganizationRow[]>()
    .single();

  assertNoError(error, 'Unable to create organization.');
  if (!data) {
    throw new Error('Unable to create organization.');
  }

  return mapOrganizationRowToOrganization(data);
}

export async function updateOrganization(
  organizationId: string,
  updates: UpdateOrganizationInput,
): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .update(mapOrganizationUpdatesToRow(updates))
    .eq('id', organizationId)
    .select('*')
    .returns<OrganizationRow[]>()
    .single();

  assertNoError(error, 'Unable to update organization.');
  if (!data) {
    throw new Error('Unable to update organization.');
  }

  return mapOrganizationRowToOrganization(data);
}

export async function getOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMember[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .returns<OrganizationMemberRow[]>();

  assertNoError(error, 'Unable to load organization members.');
  return (data ?? []).map(mapOrganizationMemberRowToOrganizationMember);
}

export async function addOrganizationMember(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
): Promise<OrganizationMember> {
  const { data, error } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role,
    })
    .select('*')
    .returns<OrganizationMemberRow[]>()
    .single();

  assertNoError(error, 'Unable to add organization member.');
  if (!data) {
    throw new Error('Unable to add organization member.');
  }

  return mapOrganizationMemberRowToOrganizationMember(data);
}

export async function removeOrganizationMember(
  organizationId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  assertNoError(error, 'Unable to remove organization member.');
}

function mapOrganizationRowToOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrganizationMemberRowToOrganizationMember(
  row: OrganizationMemberRow,
): OrganizationMember {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrganizationToInsert(organization: CreateOrganizationInput) {
  return {
    owner_user_id: organization.ownerUserId,
    name: organization.name,
    slug: organization.slug,
  };
}

function mapOrganizationUpdatesToRow(updates: UpdateOrganizationInput) {
  return {
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.slug !== undefined ? { slug: updates.slug } : {}),
  };
}
