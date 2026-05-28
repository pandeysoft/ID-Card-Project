import { supabase } from './supabase';
import {
  mapPublicSafeProfileRowToPublicProfile,
  mapPublicProfileRowToPublicProfile,
  mapPublicProfileToInsert,
  mapPublicProfileUpdatesToRow,
  type PublicSafeProfileRow,
  type PublicProfileRow,
} from './mappers/publicProfileMapper';
import type {
  BusinessProfile,
  ProfileLink,
  ProfileType,
  PublicProfile,
} from '../types';

export type CreatePublicProfileInput = {
  profileId: string;
  userId: string;
  publicSlug: string;
  name: string;
  headline: string;
  bio: string;
  avatarUrl?: string;
  type: ProfileType;
  links?: readonly ProfileLink[];
  business?: BusinessProfile;
  isPublic?: boolean;
};

export type UpdatePublicProfileInput = Partial<
  Omit<CreatePublicProfileInput, 'profileId' | 'userId' | 'publicSlug'>
>;

function assertNoError(error: Error | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function getPublicProfileBySlug(
  publicSlug: string,
): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .rpc('get_public_profile_by_slug', { profile_slug: publicSlug })
    .returns<PublicSafeProfileRow[]>();

  assertNoError(error, 'Unable to load public profile.');
  const rows = Array.isArray(data) ? data : [];
  return rows[0] ? mapPublicSafeProfileRowToPublicProfile(rows[0]) : null;
}

export async function getPublicProfileByProfileId(
  profileId: string,
): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('profile_id', profileId)
    .returns<PublicProfileRow[]>()
    .maybeSingle();

  assertNoError(error, 'Unable to load public profile.');
  return data ? mapPublicProfileRowToPublicProfile(data) : null;
}

export async function createPublicProfile(
  publicProfile: CreatePublicProfileInput,
): Promise<PublicProfile> {
  const { data, error } = await supabase
    .from('public_profiles')
    .insert(mapPublicProfileToInsert(publicProfile))
    .select('*')
    .returns<PublicProfileRow[]>()
    .single();

  assertNoError(error, 'Unable to create public profile.');
  if (!data) {
    throw new Error('Unable to create public profile.');
  }

  return mapPublicProfileRowToPublicProfile(data);
}

export async function updatePublicProfile(
  publicSlug: string,
  updates: UpdatePublicProfileInput,
): Promise<PublicProfile> {
  const { data, error } = await supabase
    .from('public_profiles')
    .update(mapPublicProfileUpdatesToRow(updates))
    .eq('public_slug', publicSlug)
    .select('*')
    .returns<PublicProfileRow[]>()
    .single();

  assertNoError(error, 'Unable to update public profile.');
  if (!data) {
    throw new Error('Unable to update public profile.');
  }

  return mapPublicProfileRowToPublicProfile(data);
}

export async function deletePublicProfile(publicSlug: string): Promise<void> {
  const { error } = await supabase
    .from('public_profiles')
    .delete()
    .eq('public_slug', publicSlug);

  assertNoError(error, 'Unable to delete public profile.');
}
