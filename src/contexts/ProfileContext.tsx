import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import { mockProfiles } from '../lib/mockData';
import { getAvatarPublicUrl, uploadProfileAvatar } from '../services/avatarService';
import { initializeUserProfiles } from '../services/bootstrapService';
import { getProfileLinks, replaceProfileLinks } from '../services/profileLinkService';
import { getProfiles, publishPublicProfile, updateProfile } from '../services/profileService';
import type { Profile } from '../types';
import type { EditProfileForm } from '../screens/EditProfileScreen';

type ProfileContextValue = {
  activeProfile: Profile;
  activeProfileId: string;
  loading: boolean;
  profiles: Profile[];
  saveProfileEdits: (profileId: string, form: EditProfileForm) => Promise<void>;
  selectProfile: (profileId: string) => void;
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
        })),
    );

    try {
      await publishPublicProfile(profileId);
    } catch {
      console.warn('CardIQ public profile publish failed after profile save.');
    }
  }

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        activeProfileId,
        loading: profilesLoading || authLoading,
        profiles,
        saveProfileEdits,
        selectProfile: setActiveProfileId,
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
