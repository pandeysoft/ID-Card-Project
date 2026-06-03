import { supabase } from './supabase';
import type { Company, CompanyMembership, CompanyRole } from '../types';
import type { Database } from '../types/database';

type CompanyRow = Database['public']['Tables']['companies']['Row'];
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyMembershipRow = Database['public']['Tables']['company_memberships']['Row'];

export type CreateCompanyInput = {
  ownerUserId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  description?: string;
};

function assertNoError(error: Error | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert(mapCompanyToInsert(input))
    .select('*')
    .returns<CompanyRow[]>()
    .single();

  assertNoError(error, 'Unable to create company.');
  if (!data) {
    throw new Error('Unable to create company.');
  }

  const company = mapCompanyRowToCompany(data);
  const { error: membershipError } = await supabase
    .from('company_memberships')
    .insert({
      company_id: company.id,
      user_id: input.ownerUserId,
      role: 'owner',
    });

  assertNoError(membershipError, 'Unable to create company owner membership.');
  return company;
}

export async function getCompany(companyId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .returns<CompanyRow[]>()
    .maybeSingle();

  assertNoError(error, 'Unable to load company.');
  return data ? mapCompanyRowToCompany(data) : null;
}

export async function listMyCompanies(userId: string): Promise<Company[]> {
  const { data, error } = await supabase
    .from('company_memberships')
    .select('companies(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<Array<{ companies: CompanyRow | null }>>();

  assertNoError(error, 'Unable to load companies.');
  return (data ?? [])
    .map((row) => row.companies)
    .filter((company): company is CompanyRow => Boolean(company))
    .map(mapCompanyRowToCompany);
}

export async function inviteMember(
  companyId: string,
  userId: string,
  role: CompanyRole,
): Promise<CompanyMembership> {
  const { data, error } = await supabase
    .rpc('invite_company_member', {
      p_company_id: companyId,
      p_user_id: userId,
      p_role: role,
    })
    .returns<CompanyMembershipRow[]>();

  assertNoError(error, 'Unable to invite company member.');
  const rows = Array.isArray(data) ? data : [];
  const row = rows[0];
  if (!row) {
    throw new Error('Unable to invite company member.');
  }

  return mapCompanyMembershipRowToCompanyMembership(row);
}

export async function removeMember(companyId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .rpc('remove_company_member', {
      p_company_id: companyId,
      p_user_id: userId,
    });

  assertNoError(error, 'Unable to remove company member.');
}

export async function listCompanyMembers(companyId: string): Promise<CompanyMembership[]> {
  const { data, error } = await supabase
    .rpc('list_company_members', { p_company_id: companyId })
    .returns<CompanyMembershipRow[]>();

  assertNoError(error, 'Unable to load company members.');
  const rows = Array.isArray(data) ? data : [];
  return rows.map(mapCompanyMembershipRowToCompanyMembership);
}

export function mapCompanyRowToCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url ?? undefined,
    website: row.website ?? undefined,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCompanyMembershipRowToCompanyMembership(
  row: CompanyMembershipRow,
): CompanyMembership {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  };
}

function mapCompanyToInsert(input: CreateCompanyInput): CompanyInsert {
  return {
    owner_user_id: input.ownerUserId,
    name: input.name,
    slug: input.slug,
    logo_url: input.logoUrl ?? null,
    website: input.website ?? null,
    description: input.description ?? null,
  };
}

export type { CompanyRole };
