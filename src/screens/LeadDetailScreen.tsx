import { useEffect, useState } from 'react';
import { useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../contexts';
import { mockLeads } from '../lib/mockData';
import { getLeadById, updateLeadStatus } from '../services/leadService';
import { colors, spacing, typography } from '../theme';
import type { Lead, LeadStatus } from '../types';
import type { RootStackParamList } from '../types/navigation';

type LeadDetailScreenProps = {
  onBack?: () => void;
  route: RouteProp<RootStackParamList, 'LeadDetail'>;
};

const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost'];

export function LeadDetailScreen({ onBack, route }: LeadDetailScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDevelopmentAuthBypass, user } = useAuth();
  const { leadId } = route.params;
  const [localLead, setLocalLead] = useState<Lead | null>(null);
  const [loadingLead, setLoadingLead] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadLead() {
      setLoadingLead(true);
      setErrorMessage(null);

      try {
        const lead =
          user && !isDevelopmentAuthBypass
            ? await getLeadById(leadId)
            : mockLeads.find((item) => item.id === leadId) ?? null;

        if (mounted) {
          setLocalLead(lead);
          setErrorMessage(lead ? null : 'Lead not found.');
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load lead.');
        }
      } finally {
        if (mounted) {
          setLoadingLead(false);
        }
      }
    }

    void loadLead();

    return () => {
      mounted = false;
    };
  }, [isDevelopmentAuthBypass, leadId, user]);

  async function handleStatusChange(status: LeadStatus) {
    if (!localLead) {
      return;
    }

    const previousLead = localLead;

    setLocalLead({ ...localLead, status, updatedAt: new Date().toISOString() });
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (user && !isDevelopmentAuthBypass) {
        const updatedLead = await updateLeadStatus(localLead.id, status);
        setLocalLead(updatedLead);
      }

      setSuccessMessage(isDevelopmentAuthBypass || !user ? 'Saved locally.' : 'Saved.');
    } catch (error) {
      setLocalLead(previousLead);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update lead status.');
    } finally {
      setSaving(false);
    }
  }

  const companyOrTitle = localLead?.snapshot.business?.companyName ?? localLead?.snapshot.headline;

  return (
    <Screen title="Lead" subtitle="Lead details and current follow-up status.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={onBack ?? navigation.goBack} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}>
          <Text style={styles.backButtonText}>Back to leads</Text>
        </Pressable>

        {loadingLead ? <Text style={styles.loading}>Loading lead...</Text> : null}
        {!loadingLead && !localLead ? <Text style={styles.error}>{errorMessage ?? 'Lead not found.'}</Text> : null}
        {localLead ? (
          <>
        <View style={styles.header}>
          <Text style={styles.name}>{localLead.snapshot.name}</Text>
          <Text style={styles.headline}>{companyOrTitle || 'No title saved'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source</Text>
          <Text style={styles.bodyText}>{localLead.source ?? 'Unknown source'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusList}>
            {statuses.map((status) => (
              <Pressable
                disabled={saving}
                key={status}
                onPress={() => void handleStatusChange(status)}
                style={({ pressed }) => [
                  styles.statusChip,
                  localLead.status === status ? styles.activeStatusChip : null,
                  pressed ? styles.pressed : null,
                  saving ? styles.disabled : null,
                ]}
              >
                <Text style={[styles.statusText, localLead.status === status ? styles.activeStatusText : null]}>
                  {formatStatus(status)}
                </Text>
              </Pressable>
            ))}
          </View>
          {saving ? <Text style={styles.loading}>Saving...</Text> : null}
          {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.bodyText}>{localLead.notes ?? 'No notes yet.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact links</Text>
          {localLead.snapshot.links.length > 0 ? (
            localLead.snapshot.links.map((link) => (
              <View key={link.id} style={styles.linkRow}>
                <Text style={styles.linkLabel}>{link.label || 'Link'}</Text>
                <Text style={styles.linkValue}>{link.url}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No contact links saved.</Text>
          )}
        </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function formatStatus(status: LeadStatus) {
  return status[0].toUpperCase() + status.slice(1);
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
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
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
  bodyText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    lineHeight: 23,
  },
  statusList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  loading: {
    color: colors.mutedText,
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
  error: {
    color: colors.danger,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  empty: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '700',
  },
  linkRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
  },
  linkLabel: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  linkValue: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '600',
  },
});
