import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import { mockProfiles } from '../lib/mockData';
import { getAvatarPublicUrl, uploadProfileAvatar } from '../services/avatarService';
import { initializeUserProfiles } from '../services/bootstrapService';
import { getProfileLinks, replaceProfileLinks } from '../services/profileLinkService';
import { createProfile, deleteProfile, getProfiles, publishPublicProfile, updateProfile } from '../services/profileService';
import { getProfileTemplate, profileLabels } from '../lib/profileTemplates';
import type { Profile, ProfileType } from '../types';
import type { EditProfileForm } from '../screens/EditProfileScreen';

export type CreateManagedProfileForm = {
  displayName: string;
  title: string;
  company: string;
  bio: string;
  type: ProfileType;
  links: Array<{
    label: string;
    value: string;
    isVisible: boolean;
  }>;
};

type ProfileContextValue = {
  activeProfile: Profile;
  activeProfileId: string;
  loading: boolean;
  profiles: Profile[];
  createManagedProfile: (form: CreateManagedProfileForm) => Promise<void>;
  deleteManagedProfile: (profileId: string) => Promise<void>;
  saveProfileEdits: (profileId: string, form: EditProfileForm) => Promise<void>;
  selectProfile: (profileId: string) => void;
  setProfileVisibility: (profileId: string, isPublic: boolean) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { isDevelopmentAuthBypass, user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([...mockProfiles]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState(mockProfiles[0].id);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? mockProfiles[0],
    [activeProfileId, profiles],
  );

  useEffect(() => {
    let mounted = true;

    async function loadProfiles() {
      if (authLoading) {
        return;
      }

      if (!user || isDevelopmentAuthBypass) {
        setProfiles([...mockProfiles]);
        setProfilesLoading(false);
        return;
      }

      setProfilesLoading(true);

      try {
        const userProfiles = await loadAuthenticatedProfiles(user);

        if (mounted) {
          setProfiles(userProfiles.length > 0 ? userProfiles : [...mockProfiles]);
        }
      } catch {
        console.warn('CardIQ profiles failed to load.');

        if (mounted) {
          setProfiles([...mockProfiles]);
        }
      } finally {
        if (mounted) {
          setProfilesLoading(false);
        }
      }
    }

    void loadProfiles();

    return () => {
      mounted = false;
    };
  }, [authLoading, isDevelopmentAuthBypass, user]);

  useEffect(() => {
    if (!profiles.some((profile) => profile.id === activeProfileId)) {
      setActiveProfileId(profiles[0]?.id ?? mockProfiles[0].id);
    }
  }, [activeProfileId, profiles]);

  async function saveProfileEdits(profileId: string, form: EditProfileForm) {
    const currentProfile = profiles.find((profile) => profile.id === profileId) ?? activeProfile;

    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              name: form.displayName,
              headline: form.title,
              company: form.company,
              bio: form.bio,
              avatarUrl: form.avatarUri ?? profile.avatarUrl,
              links: form.links.map((link, index) => ({
                id: link.id,
                profileId,
                label: link.label,
                url: link.value,
                order: index,
                isVisible: link.isVisible,
                createdAt: profile.createdAt,
                updatedAt: new Date().toISOString(),
              })),
            }
          : profile,
      ),
    );

    if (!user || isDevelopmentAuthBypass) {
      return;
    }

    let avatarUrl = form.avatarUri;

    if (form.avatarUri && form.avatarUri !== currentProfile.avatarUrl) {
      avatarUrl = getAvatarPublicUrl(await uploadProfileAvatar(user.id, profileId, form.avatarUri));
      setProfiles((currentProfiles) =>
        currentProfiles.map((profile) => (profile.id === profileId ? { ...profile, avatarUrl } : profile)),
      );
    }

    await updateProfile(profileId, {
      name: form.displayName,
      headline: form.title,
      company: form.company,
      bio: form.bio,
      avatarUrl,
    });

    await replaceProfileLinks(
      profileId,
      user.id,
      form.links
        .filter((link) => link.label.trim() && link.value.trim())
        .map((link, index) => ({
          label: link.label.trim(),
          url: link.value.trim(),
          order: index,
          isVisible: link.isVisible,
        })),
    );

    try {
      await publishPublicProfile(profileId);
    } catch {
      console.warn('CardIQ public profile publish failed after profile save.');
    }
  }

  async function createManagedProfile(form: CreateManagedProfileForm) {
    const now = new Date().toISOString();
    const template = getProfileTemplate(form.type);
    const profileId = `profile_${Date.now()}`;
    const trimmedName = form.displayName.trim() || 'New Profile';
    const trimmedTitle = form.title.trim() || template.defaultHeadline;
    const trimmedCompany = form.company.trim();
    const links = form.links
      .filter((link) => link.label.trim() && link.value.trim())
      .map((link, index) => ({
        id: `link_${profileId}_${index}`,
        profileId,
        label: link.label.trim(),
        url: link.value.trim(),
        order: index,
        isVisible: link.isVisible,
        createdAt: now,
        updatedAt: now,
      }));
    const newProfile: Profile = {
      id: profileId,
      userId: user?.id ?? 'local_demo_user',
      type: form.type,
      publicSlug: buildProfileSlug(trimmedName, form.type),
      name: trimmedName,
      headline: trimmedTitle,
      company: trimmedCompany || undefined,
      bio: form.bio.trim() || template.defaultBio,
      links,
      isPublic: template.defaultIsPublic,
      createdAt: now,
      updatedAt: now,
    };

    setProfiles((currentProfiles) => [...currentProfiles, newProfile]);
    setActiveProfileId(newProfile.id);

    if (!user || isDevelopmentAuthBypass) {
      return;
    }

    const createdProfile = await createProfile({
      userId: user.id,
      type: newProfile.type,
      publicSlug: newProfile.publicSlug,
      name: newProfile.name,
      headline: newProfile.headline,
      company: newProfile.company,
      bio: newProfile.bio,
      isPublic: newProfile.isPublic,
    });

    const createdLinks = await replaceProfileLinks(
      createdProfile.id,
      user.id,
      links.map((link) => ({
        label: link.label,
        url: link.url,
        order: link.order,
        isVisible: link.isVisible,
      })),
    );

    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === newProfile.id ? { ...createdProfile, links: createdLinks } : profile,
      ),
    );
    setActiveProfileId(createdProfile.id);

    try {
      await publishPublicProfile(createdProfile.id);
    } catch {
      console.warn('CardIQ public profile publish failed after profile creation.');
    }
  }

  async function deleteManagedProfile(profileId: string) {
    if (profiles.length <= 1) {
      throw new Error('Keep at least one profile.');
    }

    const nextProfileId = profiles.find((profile) => profile.id !== profileId)?.id ?? profiles[0].id;
    setProfiles((currentProfiles) => currentProfiles.filter((profile) => profile.id !== profileId));
    setActiveProfileId(nextProfileId);

    if (!user || isDevelopmentAuthBypass) {
      return;
    }

    await deleteProfile(profileId);
  }

  async function setProfileVisibility(profileId: string, isPublic: boolean) {
    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) => (profile.id === profileId ? { ...profile, isPublic } : profile)),
    );

    if (!user || isDevelopmentAuthBypass) {
      return;
    }

    await updateProfile(profileId, { isPublic });

    try {
      await publishPublicProfile(profileId);
    } catch {
      console.warn('CardIQ public profile publish failed after visibility change.');
    }
  }

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        activeProfileId,
        loading: profilesLoading || authLoading,
        profiles,
        createManagedProfile,
        deleteManagedProfile,
        saveProfileEdits,
        selectProfile: setActiveProfileId,
        setProfileVisibility,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles() {
  const value = useContext(ProfileContext);

  if (!value) {
    throw new Error('useProfiles must be used within ProfileProvider.');
  }

  return value;
}

async function loadAuthenticatedProfiles(user: User): Promise<Profile[]> {
  const profiles = await getProfiles(user.id);

  if (profiles.length > 0) {
    return loadProfilesWithLinks(profiles);
  }

  return loadProfilesWithLinks(await initializeUserProfiles(user));
}

async function loadProfilesWithLinks(profiles: Profile[]): Promise<Profile[]> {
  return Promise.all(
    profiles.map(async (profile) => ({
      ...profile,
      links: await getProfileLinks(profile.id),
    })),
  );
}

function buildProfileSlug(name: string, type: ProfileType): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug || 'cardiq-profile'}-${type}-${Date.now().toString(36)}`;
}
