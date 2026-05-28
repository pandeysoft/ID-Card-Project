import type {
  PublicProfile,
} from '../../types';
import type { Database, PublicProfilePublishedData } from '../../types/database';
import type {
  CreatePublicProfileInput,
  UpdatePublicProfileInput,
} from '../publicProfileService';

export type { PublicProfilePublishedData };

export type PublicProfileRow = Database['public']['Tables']['public_profiles']['Row'];
export type PublicSafeProfileRow =
  Database['public']['Functions']['get_public_profile_by_slug']['Returns'][number];

type PublicProfileInsert = Database['public']['Tables']['public_profiles']['Insert'];
type PublicProfileUpdate = Database['public']['Tables']['public_profiles']['Update'];

export function mapPublicProfileRowToPublicProfile(
  row: PublicProfileRow,
): PublicProfile {
  return {
    id: row.id,
    profileId: row.profile_id,
    type: row.published_data?.type ?? 'professional',
    name: row.name,
    headline: row.headline ?? '',
    bio: row.bio ?? '',
    avatarUrl: row.avatar_url ?? undefined,
    links: row.published_data?.links ?? [],
    business: row.published_data?.business,
    updatedAt: row.updated_at,
  };
}

export function mapPublicSafeProfileRowToPublicProfile(
  row: PublicSafeProfileRow,
): PublicProfile {
  return {
    id: row.public_slug,
    profileId: row.public_slug,
    type: row.published_data?.type ?? 'professional',
    name: row.name,
    headline: row.headline ?? '',
    bio: row.bio ?? '',
    avatarUrl: row.avatar_url ?? undefined,
    links: row.published_data?.links ?? [],
    business: row.published_data?.business,
    updatedAt: row.updated_at,
  };
}

export function mapPublicProfileToInsert(
  publicProfile: CreatePublicProfileInput,
): PublicProfileInsert {
  return {
    profile_id: publicProfile.profileId,
    user_id: publicProfile.userId,
    public_slug: publicProfile.publicSlug,
    name: publicProfile.name,
    headline: publicProfile.headline,
    bio: publicProfile.bio,
    avatar_url: publicProfile.avatarUrl ?? null,
    published_data: {
      type: publicProfile.type,
      links: publicProfile.links ?? [],
      business: publicProfile.business,
    },
    is_public: publicProfile.isPublic ?? true,
  };
}

export function mapPublicProfileUpdatesToRow(
  updates: UpdatePublicProfileInput,
): PublicProfileUpdate {
  return {
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.headline !== undefined ? { headline: updates.headline } : {}),
    ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
    ...(updates.avatarUrl !== undefined ? { avatar_url: updates.avatarUrl } : {}),
    ...(updates.isPublic !== undefined ? { is_public: updates.isPublic } : {}),
    ...(updates.type !== undefined ||
    updates.links !== undefined ||
    updates.business !== undefined
      ? {
          published_data: {
            ...(updates.type !== undefined ? { type: updates.type } : {}),
            ...(updates.links !== undefined ? { links: updates.links } : {}),
            ...(updates.business !== undefined ? { business: updates.business } : {}),
          },
        }
      : {}),
  };
}
