import type { ProfileType } from '../types';

export type ProfileTemplateType = 'personal' | 'business' | 'creator' | 'event';

export type ProfileTemplateLink = {
  label: string;
  url: string;
  isVisible: boolean;
};

export type ProfileTemplate = {
  type: ProfileTemplateType;
  label: string;
  headlinePlaceholder: string;
  bioPlaceholder: string;
  companyPlaceholder: string;
  defaultHeadline: string;
  defaultBio: string;
  defaultIsPublic: boolean;
  suggestedLinks: ProfileTemplateLink[];
};

export const profileTemplates: readonly ProfileTemplate[] = [
  {
    type: 'personal',
    label: 'Personal',
    headlinePlaceholder: 'Friend, community member, or personal intro',
    bioPlaceholder: 'A short personal intro',
    companyPlaceholder: 'Optional',
    defaultHeadline: 'Personal Profile',
    defaultBio: '',
    defaultIsPublic: false,
    suggestedLinks: [
      { label: 'Instagram', url: '', isVisible: false },
      { label: 'Email', url: '', isVisible: false },
    ],
  },
  {
    type: 'business',
    label: 'Business',
    headlinePlaceholder: 'Founder, sales, partnerships, or team role',
    bioPlaceholder: 'What you help people do',
    companyPlaceholder: 'Company',
    defaultHeadline: 'Business Profile',
    defaultBio: '',
    defaultIsPublic: true,
    suggestedLinks: [
      { label: 'LinkedIn', url: '', isVisible: true },
      { label: 'Website', url: '', isVisible: true },
    ],
  },
  {
    type: 'creator',
    label: 'Creator',
    headlinePlaceholder: 'Creator, writer, artist, or community builder',
    bioPlaceholder: 'What you create and where to follow',
    companyPlaceholder: 'Studio or brand',
    defaultHeadline: 'Creator Profile',
    defaultBio: '',
    defaultIsPublic: true,
    suggestedLinks: [
      { label: 'Instagram', url: '', isVisible: true },
      { label: 'YouTube', url: '', isVisible: true },
      { label: 'Website', url: '', isVisible: true },
    ],
  },
  {
    type: 'event',
    label: 'Event',
    headlinePlaceholder: 'Event, meetup, or conference intro',
    bioPlaceholder: 'Temporary context for this event',
    companyPlaceholder: 'Event or organization',
    defaultHeadline: 'Event Networking Profile',
    defaultBio: '',
    defaultIsPublic: true,
    suggestedLinks: [
      { label: 'LinkedIn', url: '', isVisible: true },
      { label: 'Calendar', url: '', isVisible: true },
    ],
  },
];

export const profileLabels: Record<ProfileType, string> = {
  personal: 'Personal',
  professional: 'Professional',
  acquaintance: 'Acquaintance',
  business: 'Business',
  creator: 'Creator',
  event: 'Event',
};

export function getProfileTemplate(type: ProfileType): ProfileTemplate {
  return profileTemplates.find((template) => template.type === type) ?? profileTemplates[1];
}
