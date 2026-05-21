import { useEffect, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { RouteProp } from '@react-navigation/native';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useProfiles } from '../contexts';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../types/navigation';

const linkTypes = ['phone', 'email', 'website', 'linkedin', 'instagram', 'facebook', 'x', 'youtube', 'tiktok', 'whatsapp', 'custom'] as const;

export type ProfileLinkType = (typeof linkTypes)[number];

export type EditableProfileLink = {
  id: string;
  type: ProfileLinkType;
  label: string;
  value: string;
};

export type EditProfileForm = {
  displayName: string;
  title: string;
  company: string;
  bio: string;
  avatarUri?: string;
  links: EditableProfileLink[];
};

type EditProfileScreenProps = {
  onCancel?: () => void;
  route: RouteProp<RootStackParamList, 'EditProfile'>;
};

export function EditProfileScreen({ onCancel, route }: EditProfileScreenProps) {
  const { profiles, saveProfileEdits } = useProfiles();
  const { profileId } = route.params;
  const profile = profiles.find((item) => item.id === profileId);
  const initialForm = useMemo<EditProfileForm>(
    () => ({
      displayName: profile?.name ?? '',
      title: profile?.headline ?? '',
      company: profile?.company ?? '',
      bio: profile?.bio ?? '',
      avatarUri: profile?.avatarUrl,
      links: (profile?.links ?? []).map((link) => ({
        id: link.id,
        type: getLinkType(link.label),
        label: link.label,
        value: link.url,
      })),
    }),
    [profile],
  );
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [pickingAvatar, setPickingAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  function updateField(field: keyof EditProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLink(linkId: string, updates: Partial<EditableProfileLink>) {
    setForm((current) => ({
      ...current,
      links: current.links.map((link) => (link.id === linkId ? { ...link, ...updates } : link)),
    }));
  }

  function addLink() {
    setForm((current) => ({
      ...current,
      links: [
        ...current.links,
        { id: `local-link-${Date.now()}`, type: 'website', label: 'Website', value: '' },
      ],
    }));
  }

  function removeLink(linkId: string) {
    setForm((current) => ({
      ...current,
      links: current.links.filter((link) => link.id !== linkId),
    }));
  }

  async function chooseAvatar() {
    setPickingAvatar(true);
    setErrorMessage(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        throw new Error('Photo library permission is required to choose an avatar.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (!result.canceled) {
        updateField('avatarUri', result.assets[0]?.uri ?? '');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to choose avatar.');
    } finally {
      setPickingAvatar(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);

    try {
      if (!profile) {
        throw new Error('Profile not found.');
      }

      await saveProfileEdits(profileId, form);
      onCancel?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save profile changes.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="Edit Profile" subtitle="Update the basics for this card.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarPreview}>
              {form.avatarUri ? (
                <Image source={{ uri: form.avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(form.displayName || 'Profile')}</Text>
              )}
            </View>
            <Pressable
              disabled={pickingAvatar || saving}
              onPress={chooseAvatar}
              style={({ pressed }) => [styles.addLinkButton, pressed ? styles.pressed : null, pickingAvatar ? styles.disabled : null]}
            >
              <Text style={styles.addLinkText}>{pickingAvatar ? 'Opening...' : 'Choose Avatar'}</Text>
            </Pressable>
          </View>
          <ProfileField
            label="Display name"
            onChangeText={(value) => updateField('displayName', value)}
            value={form.displayName}
          />
          <ProfileField
            label="Title"
            onChangeText={(value) => updateField('title', value)}
            value={form.title}
          />
          <ProfileField
            label="Company"
            onChangeText={(value) => updateField('company', value)}
            value={form.company}
          />
          <ProfileField
            label="Bio"
            multiline
            onChangeText={(value) => updateField('bio', value)}
            value={form.bio}
          />
        </View>

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Links</Text>
            <Pressable onPress={addLink} style={({ pressed }) => [styles.addLinkButton, pressed ? styles.pressed : null]}>
              <Text style={styles.addLinkText}>Add Link</Text>
            </Pressable>
          </View>
          {form.links.map((link) => (
            <View key={link.id} style={styles.linkCard}>
              <View style={styles.typeRow}>
                {linkTypes.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => updateLink(link.id, { type, label: getDefaultLabel(type) })}
                    style={[styles.typePill, link.type === type ? styles.typePillActive : null]}
                  >
                    <Text style={[styles.typePillText, link.type === type ? styles.typePillTextActive : null]}>{type}</Text>
                  </Pressable>
                ))}
              </View>
              <ProfileField label="Label" onChangeText={(value) => updateLink(link.id, { label: value })} value={link.label} />
              <ProfileField label="Value" onChangeText={(value) => updateLink(link.id, { value })} value={link.value} />
              <Pressable onPress={() => removeLink(link.id)} style={({ pressed }) => [styles.removeLinkButton, pressed ? styles.pressed : null]}>
                <Text style={styles.removeLinkText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <View style={styles.actions}>
          <Pressable disabled={saving} onPress={onCancel} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null, saving ? styles.disabled : null]}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
          <Pressable disabled={saving} onPress={handleSave} style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null, saving ? styles.disabled : null]}>
            <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ProfileField({
  label,
  multiline = false,
  onChangeText,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.mutedText}
        style={[styles.input, multiline ? styles.multilineInput : null]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

function getLinkType(label: string): ProfileLinkType {
  const lower = label.toLowerCase();
  return linkTypes.find((type) => lower.includes(type)) ?? 'custom';
}

function getDefaultLabel(type: ProfileLinkType) {
  if (type === 'x') {
    return 'X';
  }

  return `${type[0].toUpperCase()}${type.slice(1)}`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  formCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarPreview: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 64,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarText: {
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  label: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.sizes.body,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  multilineInput: {
    minHeight: 116,
    paddingTop: spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  addLinkButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  addLinkText: {
    color: colors.primary,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  linkCard: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typePill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  typePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typePillText: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
  },
  typePillTextActive: {
    color: colors.surface,
  },
  removeLinkButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  removeLinkText: {
    color: colors.danger,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.64,
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.small,
    marginTop: spacing.md,
  },
});
