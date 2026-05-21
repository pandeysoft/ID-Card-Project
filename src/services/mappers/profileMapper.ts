import type { Profile, ProfileLink, ProfileType } from '../../types';
import type { Database } from '../../types/database';
import type {
  CreateProfileInput,
  UpdateProfileInput,
} from '../profileService';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type ProfileLinkRow = Database['public']['Tables']['profile_links']['Row'];

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type ProfileWithLinksRow = ProfileRow & {
  profile_links?: ProfileLinkRow[] | null;
};

export function mapProfileRowToProfile(row: ProfileWithLinksRow): Profile {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    publicSlug: row.public_slug,
    name: row.name,
    headline: row.headline ?? '',
    company: row.company ?? undefined,
    bio: row.bio ?? '',
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    location: row.location ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    links: (row.profile_links ?? []).map(mapProfileLinkRowToProfileLink),
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProfileToInsert(profile: CreateProfileInput): ProfileInsert {
  return {
    user_id: profile.userId,
    type: profile.type,
    public_slug: profile.publicSlug,
    name: profile.name,
    headline: profile.headline,
    company: profile.company ?? null,
    bio: profile.bio,
    email: profile.email ?? null,
    phone: profile.phone ?? null,
    location: profile.location ?? null,
    avatar_url: profile.avatarUrl ?? null,
    is_public: profile.isPublic ?? true,
  };
}

export function mapProfileUpdatesToRow(updates: UpdateProfileInput): ProfileUpdate {
  return {
    ...(updates.type ? { type: updates.type } : {}),
    ...(updates.publicSlug ? { public_slug: updates.publicSlug } : {}),
    ...(updates.name ? { name: updates.name } : {}),
    ...(updates.headline ? { headline: updates.headline } : {}),
    ...(updates.company !== undefined ? { company: updates.company } : {}),
    ...(updates.bio ? { bio: updates.bio } : {}),
    ...(updates.email !== undefined ? { email: updates.email } : {}),
    ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
    ...(updates.location !== undefined ? { location: updates.location } : {}),
    ...(updates.avatarUrl !== undefined ? { avatar_url: updates.avatarUrl } : {}),
    ...(updates.isPublic !== undefined ? { is_public: updates.isPublic } : {}),
  };
}

export function mapProfileLinkRowToProfileLink(row: ProfileLinkRow): ProfileLink {
  return {
    id: row.id,
    profileId: row.profile_id,
    label: row.label,
    url: row.url,
    order: row.display_order,
    isVisible: row.is_visible,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
