import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockProfiles, mockUser } from '../lib/mockData';
import { createLeadFromProfile } from '../services/leadService';
import { colors, spacing, typography } from '../theme';
import type { Lead, Profile } from '../types';

type LeadCaptureScreenProps = {
  businessUserId?: string;
  onClose?: () => void;
  profile?: Profile;
};

const previewProfile = mockProfiles[1];

export function LeadCaptureScreen({
  businessUserId = mockUser.id,
  onClose,
  profile = previewProfile,
}: LeadCaptureScreenProps) {
  const [capturing, setCapturing] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleShareContact() {
    setCapturing(true);
    setErrorMessage(null);

    try {
      setLead(await createLeadFromProfile(profile, businessUserId, 'manual'));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to share contact.');
    } finally {
      setCapturing(false);
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
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.title}>{getTitle(profile)}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>

        <View style={styles.consentCard}>
          <Text style={styles.consentTitle}>Share your contact details</Text>
          <Text style={styles.consentText}>
            By tapping Share My Contact, you agree to share this profile with the business for follow-up.
          </Text>
        </View>

        {lead ? <Text style={styles.success}>Contact shared. Lead status: {lead.status}</Text> : null}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          disabled={capturing}
          onPress={handleShareContact}
          style={({ pressed }) => [styles.button, pressed ? styles.pressed : null, capturing ? styles.disabled : null]}
        >
          <Text style={styles.buttonText}>{capturing ? 'Sharing...' : 'Share My Contact'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
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
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 28,
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
  consentCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  consentTitle: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  consentText: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 54,
  },
  buttonText: {
    color: colors.surface,
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
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.64,
  },
});
