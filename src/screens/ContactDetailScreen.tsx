import { useEffect, useState } from 'react';
import { useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../contexts';
import { mockLeads, mockSavedContacts } from '../lib/mockData';
import { getContactById, updateContact } from '../services/contactService';
import { generateVCardFromContact, shareVCardFile } from '../services/vcardService';
import { colors, spacing, typography } from '../theme';
import type { LeadStatus, SavedContact } from '../types';
import type { RootStackParamList } from '../types/navigation';

type ContactDetailScreenProps = {
  onBack?: () => void;
  route: RouteProp<RootStackParamList, 'ContactDetail'>;
};

const leadStatuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost'];

export function ContactDetailScreen({ onBack, route }: ContactDetailScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDevelopmentAuthBypass, user } = useAuth();
  const { contactId } = route.params;
  const [localContact, setLocalContact] = useState<SavedContact | null>(null);
  const [notes, setNotes] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus | null>(null);
  const [loadingContact, setLoadingContact] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const lead = localContact ? mockLeads.find((item) => item.savedContactId === localContact.id) : undefined;

  useEffect(() => {
    let mounted = true;

    async function loadContact() {
      setLoadingContact(true);
      setSaveError(null);

      try {
        const contact =
          user && !isDevelopmentAuthBypass
            ? await getContactById(contactId)
            : mockSavedContacts.find((item) => item.id === contactId) ?? null;
        const contactLead = contact ? mockLeads.find((item) => item.savedContactId === contact.id) : undefined;

        if (mounted) {
          setLocalContact(contact);
          setNotes(contact?.notes ?? contactLead?.notes ?? '');
          setLeadStatus(contactLead?.status ?? null);
          setSaveError(contact ? null : 'Contact not found.');
        }
      } catch (error) {
        if (mounted) {
          setSaveError(error instanceof Error ? error.message : 'Unable to load contact.');
        }
      } finally {
        if (mounted) {
          setLoadingContact(false);
        }
      }
    }

    void loadContact();

    return () => {
      mounted = false;
    };
  }, [contactId, isDevelopmentAuthBypass, user]);

  async function handleSave() {
    if (!localContact) {
      return;
    }

    const nextNotes = notes.trim();
    const nextContact = { ...localContact, notes: nextNotes || undefined, updatedAt: new Date().toISOString() };

    setLocalContact(nextContact);
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      if (user && !isDevelopmentAuthBypass) {
        const persistedContact = await updateContact(localContact.id, { notes: nextNotes || undefined });
        setLocalContact(persistedContact);
        setNotes(persistedContact.notes ?? '');
      }

      setSaveMessage(isDevelopmentAuthBypass ? 'Saved locally.' : 'Saved.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExportVCard() {
    if (!localContact) {
      return;
    }

    setExporting(true);
    setExportError(null);

    try {
      await shareVCardFile(localContact.snapshot.name, generateVCardFromContact(localContact));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Unable to export vCard.');
    } finally {
      setExporting(false);
    }
  }

  const company = localContact?.snapshot.business?.companyName;
  const title = localContact?.snapshot.business?.jobTitle ?? localContact?.snapshot.headline;
  const source = lead?.source ?? 'Manual save';

  return (
    <Screen title="Contact" subtitle="Saved contact details and follow-up context.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={onBack ?? navigation.goBack} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}>
          <Text style={styles.backButtonText}>Back to contacts</Text>
        </Pressable>

        {loadingContact ? <Text style={styles.bodyText}>Loading contact...</Text> : null}
        {!loadingContact && !localContact ? <Text style={styles.error}>{saveError ?? 'Contact not found.'}</Text> : null}
        {localContact ? (
          <>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(localContact.snapshot.name)}</Text>
          </View>
          <View style={styles.headerBody}>
            <Text style={styles.name}>{localContact.snapshot.name}</Text>
            <Text style={styles.headline}>{title}</Text>
            {company ? <Text style={styles.muted}>{company}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact details</Text>
          <DetailRow label="Phone" value={localContact.snapshot.phone} />
          <DetailRow label="Email" value={localContact.snapshot.email} />
          {localContact.snapshot.links.map((link) => (
            <DetailRow key={link.id} label={link.label || 'Link'} value={link.url} />
          ))}
          {!localContact.snapshot.phone && !localContact.snapshot.email && localContact.snapshot.links.length === 0 ? (
            <Text style={styles.empty}>No phone, email, or links saved.</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            multiline
            onChangeText={(value) => {
              setNotes(value);
              setSaveError(null);
              setSaveMessage(null);
            }}
            placeholder="Add notes"
            placeholderTextColor={colors.mutedText}
            style={styles.notesInput}
            value={notes}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source</Text>
          <Text style={styles.bodyText}>{source}</Text>
          {leadStatus ? (
            <View style={styles.statusList}>
              {leadStatuses.map((status) => (
                <Pressable
                  key={status}
                  onPress={() => {
                    setLeadStatus(status);
                    setSaveError(null);
                    setSaveMessage(null);
                  }}
                  style={({ pressed }) => [
                    styles.statusChip,
                    leadStatus === status ? styles.activeStatusChip : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={[styles.statusText, leadStatus === status ? styles.activeStatusText : null]}>
                    {status}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>{getRelationshipType(localContact)}</Text>
          )}
        </View>

        <Pressable
          disabled={saving}
          onPress={handleSave}
          style={({ pressed }) => [styles.saveButton, pressed ? styles.pressed : null, saving ? styles.disabled : null]}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save changes'}</Text>
        </Pressable>
        {saveMessage ? <Text style={styles.success}>{saveMessage}</Text> : null}
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

        <Pressable
          disabled={exporting}
          onPress={handleExportVCard}
          style={({ pressed }) => [styles.exportButton, pressed ? styles.pressed : null, exporting ? styles.disabled : null]}
        >
          <Text style={styles.exportButtonText}>{exporting ? 'Preparing vCard...' : 'Export vCard'}</Text>
        </Pressable>
        {exportError ? <Text style={styles.error}>{exportError}</Text> : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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

function getRelationshipType(contact: SavedContact) {
  if (contact.snapshot.type === 'business') {
    return 'Professional';
  }

  return contact.snapshot.type[0].toUpperCase() + contact.snapshot.type.slice(1);
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.64,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.lg,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 28,
    height: 64,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 64,
  },
  avatarText: {
    color: colors.primary,
    fontSize: typography.sizes.heading,
    fontWeight: '800',
  },
  headerBody: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.heading,
    fontWeight: '800',
  },
  headline: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  muted: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  detailRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  detailValue: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '600',
  },
  bodyText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    lineHeight: 23,
  },
  notesInput: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '600',
    minHeight: 110,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  statusList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  statusChip: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activeStatusChip: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  statusText: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
  },
  activeStatusText: {
    color: colors.surface,
  },
  empty: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '700',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 50,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  exportButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 50,
  },
  exportButtonText: {
    color: colors.surface,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  success: {
    color: colors.success,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
});
