import { useEffect, useMemo, useState } from 'react';
import type { RouteProp } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts';
import { mockProfiles } from '../lib/mockData';
import { createContactFromProfile } from '../services/contactService';
import { getPublicProfileBySlug } from '../services/publicProfileService';
import { generateVCardFromProfile, shareVCardFile } from '../services/vcardService';
import { colors, spacing, typography } from '../theme';
import type { Profile, ProfileLink, SavedContact } from '../types';
import type { RootStackParamList } from '../types/navigation';

type PublicProfileScreenProps = {
  onClose?: () => void;
  route: RouteProp<RootStackParamList, 'PublicProfile'>;
};

const defaultProfile = mockProfiles[1];

export function PublicProfileScreen({ onClose, route }: PublicProfileScreenProps) {
  const { isDevelopmentAuthBypass, user } = useAuth();
  const publicSlug = route.params?.publicSlug;
  const devPreview = route.params?.devPreview === true;
  const [loadedProfile, setLoadedProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharingVCard, setSharingVCard] = useState(false);
  const [savedContact, setSavedContact] = useState<SavedContact | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const displayProfile = useMemo(() => {
    if (publicSlug) {
      return loadedProfile;
    }

    return devPreview ? defaultProfile : null;
  }, [devPreview, loadedProfile, publicSlug]);

  useEffect(() => {
    let mounted = true;

    async function loadPublicProfile() {
      if (!publicSlug) {
        return;
      }

      setLoadingProfile(true);
      setLoadMessage(null);
      setLoadError(null);
      setLoadedProfile(null);

      try {
        const publicProfile = await getPublicProfileBySlug(publicSlug);

        if (mounted && publicProfile) {
          setLoadedProfile(mapPublicProfileToProfile(publicProfile, publicSlug));
        } else if (mounted) {
          setLoadError('Profile not found.');
        }
      } catch (error) {
        console.warn('CardIQ public profile failed to load.', error);

        if (mounted) {
          setLoadError('Unable to load public profile.');
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    void loadPublicProfile();

    return () => {
      mounted = false;
    };
  }, [publicSlug]);

  async function handleSaveContact() {
    if (!displayProfile) {
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      if (user && !isDevelopmentAuthBypass) {
        setSavedContact(await createContactFromProfile(displayProfile, user.id, 'manual'));
      } else {
        setSavedContact(createLocalSavedContact(displayProfile));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save contact.');
    } finally {
      setSaving(false);
    }
  }

  async function handleShareVCard() {
    if (!displayProfile) {
      return;
    }

    setSharingVCard(true);
    setErrorMessage(null);

    try {
      await shareVCardFile(displayProfile.name, generateVCardFromProfile(displayProfile));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to share vCard.');
    } finally {
      setSharingVCard(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {onClose ? (
          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        ) : null}
        {loadingProfile ? <Text style={styles.statusText}>Loading public profile...</Text> : null}
        {loadMessage ? <Text style={styles.statusText}>{loadMessage}</Text> : null}
        {loadError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{loadError}</Text>
            <Text style={styles.emptyCopy}>This CardIQ profile is unavailable or no longer public.</Text>
          </View>
        ) : null}
        {displayProfile ? (
          <>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayProfile.name)}</Text>
          </View>
          <Text style={styles.name}>{displayProfile.name}</Text>
          <Text style={styles.title}>{getTitle(displayProfile)}</Text>
          <Text style={styles.bio}>{displayProfile.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {displayProfile.email ? <LinkRow label="Email" value={displayProfile.email} /> : null}
          {displayProfile.phone ? <LinkRow label="Phone" value={displayProfile.phone} /> : null}
          {displayProfile.location ? <LinkRow label="Location" value={displayProfile.location} /> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Links</Text>
          {displayProfile.links.map((link) => (
            <LinkRow key={link.id} label={link.label} value={formatLink(link)} />
          ))}
        </View>

        {savedContact ? <Text style={styles.success}>Saved {savedContact.snapshot.name} locally.</Text> : null}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable disabled={saving} onPress={handleSaveContact} style={({ pressed }) => [styles.saveButton, pressed ? styles.pressed : null, saving ? styles.disabled : null]}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Contact'}</Text>
        </Pressable>
        <Pressable disabled={sharingVCard} onPress={handleShareVCard} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null, sharingVCard ? styles.disabled : null]}>
          <Text style={styles.secondaryButtonText}>{sharingVCard ? 'Preparing vCard...' : 'Save vCard'}</Text>
        </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function LinkRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.linkRow}>
      <View style={styles.linkIcon}>
        <Text style={styles.linkIconText}>{label[0]}</Text>
      </View>
      <View style={styles.linkText}>
        <Text style={styles.linkLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.linkValue}>{value}</Text>
      </View>
    </View>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getTitle(profile: Profile) {
  return profile.company ? `${profile.headline} at ${profile.company}` : profile.headline;
}

function formatLink(link: ProfileLink) {
  return link.url.replace('mailto:', '').replace('https://', '').replace('http://', '').replace('www.', '');
}

function createLocalSavedContact(profile: Profile): SavedContact {
  const now = new Date().toISOString();

  return {
    id: `local-contact-${profile.id}`,
    userId: 'development-demo-user',
    profileId: profile.id,
    snapshot: {
      id: `snapshot-${profile.id}`,
      profileId: profile.id,
      type: profile.type,
      name: profile.name,
      headline: profile.company ? `${profile.headline} at ${profile.company}` : profile.headline,
      bio: profile.bio,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      avatarUrl: profile.avatarUrl,
      links: profile.links,
      capturedAt: now,
    },
    tags: ['manual'],
    createdAt: now,
    updatedAt: now,
  };
}

function mapPublicProfileToProfile(
  publicProfile: Awaited<ReturnType<typeof getPublicProfileBySlug>> extends infer T ? NonNullable<T> : never,
  publicSlug: string,
): Profile {
  return {
    id: publicProfile.profileId,
    userId: '',
    type: publicProfile.type,
    publicSlug,
    name: publicProfile.name,
    headline: publicProfile.headline,
    company: publicProfile.business?.companyName,
    bio: publicProfile.bio,
    avatarUrl: publicProfile.avatarUrl,
    links: publicProfile.links,
    isPublic: true,
    createdAt: publicProfile.updatedAt,
    updatedAt: publicProfile.updatedAt,
  };
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
  },
  closeButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButtonText: {
    color: colors.text,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  statusText: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizes.heading,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyCopy: {
    color: colors.mutedText,
    fontSize: typography.sizes.body,
    lineHeight: 23,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 52,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: '800',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  title: {
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: '700',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  bio: {
    color: colors.mutedText,
    fontSize: typography.sizes.body,
    lineHeight: 23,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: spacing.md,
    overflow: 'hidden',
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  linkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 54,
  },
  linkIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 36,
  },
  linkIconText: {
    color: colors.primary,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  linkText: {
    flex: 1,
  },
  linkLabel: {
    color: colors.text,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  linkValue: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    marginTop: 2,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 54,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 54,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  success: {
    color: colors.success,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.64,
  },
  pressed: {
    opacity: 0.72,
  },
});
