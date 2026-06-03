import { buildPublicProfilePublishedData } from '../src/services/publicProfilePrivacy';
import { mapPublicSafeProfileRowToPublicProfile } from '../src/services/mappers/publicProfileMapper';
import type { Profile } from '../src/types/cardiq';
import type { Database } from '../src/types/database';

type PublicSafeRpcRow =
  Database['public']['Functions']['get_public_profile_by_slug']['Returns'][number];
type ExchangeListRpcRow =
  Database['public']['Functions']['list_contact_exchange_requests']['Returns'][number];
type Assert<T extends true> = T;
type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;
type _RpcDoesNotIncludeUserId = Assert<HasKey<PublicSafeRpcRow, 'user_id'> extends false ? true : false>;
type _RpcDoesNotIncludeProfileId = Assert<HasKey<PublicSafeRpcRow, 'profile_id'> extends false ? true : false>;
type _ExchangeListDoesNotIncludePublishedData = Assert<HasKey<ExchangeListRpcRow, 'published_data'> extends false ? true : false>;
type _ExchangeListDoesNotIncludeEmail = Assert<HasKey<ExchangeListRpcRow, 'email'> extends false ? true : false>;
type _ExchangeListDoesNotIncludePhone = Assert<HasKey<ExchangeListRpcRow, 'phone'> extends false ? true : false>;

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)}, received ${String(actual)}.`);
  }
}

function assertDeepEqual<T>(actual: T, expected: T, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}.`);
  }
}

function hasOwn(value: object, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

const profile: Profile = {
  id: 'profile-1',
  userId: 'user-1',
  type: 'professional',
  publicSlug: 'public-slug',
  name: 'Ada Lovelace',
  headline: 'Engineer',
  company: 'CardIQ',
  bio: 'Builds things',
  email: 'ada@example.com',
  phone: '555-0100',
  location: 'Austin',
  avatarUrl: 'https://example.com/avatar.png',
  isPublic: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  links: [
    {
      id: 'visible-link',
      profileId: 'profile-1',
      label: 'Website',
      url: 'https://example.com',
      order: 1,
      isVisible: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'hidden-link',
      profileId: 'profile-1',
      label: 'Hidden',
      url: 'https://hidden.example.com',
      order: 2,
      isVisible: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ],
};

const publishedData = buildPublicProfilePublishedData(profile);
assertEqual(hasOwn(publishedData, 'email'), false, 'published data must exclude email');
assertEqual(hasOwn(publishedData, 'phone'), false, 'published data must exclude phone');
assertEqual(hasOwn(publishedData, 'location'), false, 'published data must exclude location');
assertEqual(hasOwn(publishedData, 'userId'), false, 'published data must exclude userId');
assertDeepEqual(publishedData.links?.map((link) => link.id), ['visible-link'], 'published data must include only visible links');

const publicProfile = mapPublicSafeProfileRowToPublicProfile({
  public_slug: 'public-slug',
  name: 'Ada Lovelace',
  headline: 'Engineer',
  bio: 'Builds things',
  avatar_url: null,
  published_data: publishedData,
  updated_at: '2026-01-01T00:00:00Z',
});

assertEqual(hasOwn(publicProfile, 'user_id'), false, 'public mapper must not expose user_id');
assertEqual(hasOwn(publicProfile, 'profile_id'), false, 'public mapper must not expose profile_id');
assertEqual(hasOwn(publicProfile, 'userId'), false, 'public mapper must not expose userId');
assertEqual(publicProfile.id, 'public-slug', 'safe mapper id should use public slug');
assertEqual(publicProfile.profileId, 'public-slug', 'safe mapper profileId should use public slug');

console.log('Privacy checks passed.');
