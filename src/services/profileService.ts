import { supabase } from './supabase';
import {
  mapProfileRowToProfile,
  mapProfileToInsert,
  mapProfileUpdatesToRow,
  type ProfileWithLinksRow,
} from './mappers/profileMapper';
import type { Profile, ProfileType } from '../types';

export type CreateProfileInput = {
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
  isPublic?: boolean;
};

export type UpdateProfileInput = Partial<
  Omit<CreateProfileInput, 'userId'>
>;

function assertNoError(error: Error | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function getProfiles(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, profile_links(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .returns<ProfileWithLinksRow[]>();

  assertNoError(error, 'Unable to load profiles.');
  return (data ?? []).map(mapProfileRowToProfile);
}

export async function getProfileById(profileId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, profile_links(*)')
    .eq('id', profileId)
    .returns<ProfileWithLinksRow[]>()
    .maybeSingle();

  assertNoError(error, 'Unable to load profile.');
  return data ? mapProfileRowToProfile(data) : null;
}

export async function createProfile(
  profile: CreateProfileInput,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert(mapProfileToInsert(profile))
    .select('*, profile_links(*)')
    .returns<ProfileWithLinksRow[]>()
    .single();

  assertNoError(error, 'Unable to create profile.');
  if (!data) {
    throw new Error('Unable to create profile.');
  }

  return mapProfileRowToProfile(data);
}

export async function updateProfile(
  profileId: string,
  updates: UpdateProfileInput,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(mapProfileUpdatesToRow(updates))
    .eq('id', profileId)
    .select('*, profile_links(*)')
    .returns<ProfileWithLinksRow[]>()
    .single();

  assertNoError(error, 'Unable to update profile.');
  if (!data) {
    throw new Error('Unable to update profile.');
  }

  return mapProfileRowToProfile(data);
}

export async function deleteProfile(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId);

  assertNoError(error, 'Unable to delete profile.');
}

export async function publishPublicProfile(
  profileId: string,
): Promise<void> {
  const profile = await getProfileById(profileId);

  if (!profile) {
    throw new Error('Cannot publish a profile that does not exist.');
  }

  const { error } = await supabase
    .from('public_profiles')
    .upsert(
      {
        profile_id: profile.id,
        user_id: profile.userId,
        public_slug: profile.publicSlug,
        name: profile.name,
        headline: profile.headline,
        bio: profile.bio,
        avatar_url: profile.avatarUrl ?? null,
        published_data: {
          type: profile.type,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          links: profile.links,
        },
        is_public: profile.isPublic,
      },
      { onConflict: 'profile_id' },
    );

  assertNoError(error, 'Unable to publish public profile.');
}
