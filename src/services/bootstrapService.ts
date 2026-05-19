import type { User } from '@supabase/supabase-js';
import {
  createProfile,
  getProfiles,
  type CreateProfileInput,
} from './profileService';
import type { Profile } from '../types';

export async function initializeUserProfiles(user: User): Promise<Profile[]> {
  if (!user.id) {
    throw new Error('Cannot initialize profiles without a user id.');
  }

  const existingProfiles = await getProfiles(user.id);

  if (existingProfiles.length > 0) {
    return existingProfiles;
  }

  const displayName = getDisplayName(user);
  const slugBase = slugify(displayName || user.email || user.id);
  const defaults = getDefaultProfiles(user.id, displayName, slugBase);

  try {
    const createdProfiles: Profile[] = [];

    for (const profile of defaults) {
      createdProfiles.push(await createProfile(profile));
    }

    return createdProfiles;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Unable to initialize user profiles: ${error.message}`
        : 'Unable to initialize user profiles.',
    );
  }
}

function getDefaultProfiles(
  userId: string,
  displayName: string,
  slugBase: string,
): CreateProfileInput[] {
  return [
    {
      userId,
      type: 'personal',
      publicSlug: `${slugBase}-personal`,
      name: displayName,
      headline: 'Personal Profile',
      bio: 'A personal card for friends, communities, and casual introductions.',
      isPublic: true,
    },
    {
      userId,
      type: 'professional',
      publicSlug: `${slugBase}-professional`,
      name: displayName,
      headline: 'Professional Profile',
      bio: 'A professional card for networking, meetings, and follow-up.',
      isPublic: true,
    },
    {
      userId,
      type: 'acquaintance',
      publicSlug: `${slugBase}-acquaintance`,
      name: displayName,
      headline: 'Good to meet you',
      bio: 'A lightweight card for quick exchanges and simple follow-up.',
      isPublic: true,
    },
  ];
}

function getDisplayName(user: User): string {
  const metadataName = user.user_metadata?.display_name;

  if (typeof metadataName === 'string' && metadataName.trim().length > 0) {
    return metadataName.trim();
  }

  if (user.email) {
    return user.email.split('@')[0] ?? 'CardIQ User';
  }

  return 'CardIQ User';
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'cardiq-user';
}
