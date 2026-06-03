import type { Profile } from '../types/cardiq';
import type { PublicProfilePublishedData } from '../types/database';

export function buildPublicProfilePublishedData(profile: Profile): PublicProfilePublishedData {
  return {
    type: profile.type,
    company: profile.company,
    avatarUrl: profile.avatarUrl,
    links: profile.links.filter((link) => link.isVisible !== false),
  };
}
