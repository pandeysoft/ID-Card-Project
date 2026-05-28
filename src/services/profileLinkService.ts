import type { ProfileLink } from '../types';
import { supabase } from './supabase';
import { mapProfileLinkRowToProfileLink, type ProfileLinkRow } from './mappers/profileMapper';

export type ReplaceProfileLinkInput = {
  label: string;
  url: string;
  order: number;
  isVisible: boolean;
};

function assertNoError(error: Error | null, fallbackMessage: string): void {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function getProfileLinks(profileId: string): Promise<ProfileLink[]> {
  const { data, error } = await supabase
    .from('profile_links')
    .select('*')
    .eq('profile_id', profileId)
    .order('display_order', { ascending: true })
    .returns<ProfileLinkRow[]>();

  assertNoError(error, 'Unable to load profile links.');
  return (data ?? []).map(mapProfileLinkRowToProfileLink);
}

export async function replaceProfileLinks(
  profileId: string,
  userId: string,
  links: ReplaceProfileLinkInput[],
): Promise<ProfileLink[]> {
  const { error: deleteError } = await supabase
    .from('profile_links')
    .delete()
    .eq('profile_id', profileId);

  assertNoError(deleteError, 'Unable to replace profile links.');

  if (links.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('profile_links')
    .insert(
      links.map((link) => ({
        profile_id: profileId,
        user_id: userId,
        label: link.label,
        url: link.url,
        display_order: link.order,
        is_visible: link.isVisible,
      })),
    )
    .select('*')
    .order('display_order', { ascending: true })
    .returns<ProfileLinkRow[]>();

  assertNoError(error, 'Unable to save profile links.');
  return (data ?? []).map(mapProfileLinkRowToProfileLink);
}
