import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../contexts';
import { mockLeads } from '../lib/mockData';
import { useEditProfileNavigation } from '../navigation/EditProfileNavigation';
import { getLeads } from '../services/leadService';
import { colors, spacing, typography } from '../theme';
import type { Lead, LeadStatus } from '../types';

type LeadFilter = 'all' | LeadStatus;
type LeadsScreenProps = {
  onClose?: () => void;
};

const filters: { label: string; value: LeadFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Converted', value: 'converted' },
  { label: 'Lost', value: 'lost' },
];

export function LeadsScreen({ onClose }: LeadsScreenProps) {
  const { isDevelopmentAuthBypass, loading: authLoading, user } = useAuth();
  const { openLeadDetail } = useEditProfileNavigation();
  const [savedLeads, setSavedLeads] = useState<Lead[]>([...mockLeads]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<LeadFilter>('all');

  useEffect(() => {
    let mounted = true;

    async function loadLeads() {
      if (authLoading) {
        return;
      }

      if (!user || isDevelopmentAuthBypass) {
        setSavedLeads([...mockLeads]);
        setLeadsLoading(false);
        setErrorMessage(null);
        return;
      }

      setLeadsLoading(true);
      setErrorMessage(null);

      try {
        const leads = await getLeads(user.id);

        if (mounted) {
          setSavedLeads(leads);
        }
      } catch (error) {
        console.warn('CardIQ leads failed to load.', error);

        if (mounted) {
          setSavedLeads([...mockLeads]);
          setErrorMessage('Unable to load leads. Showing demo leads.');
        }
      } finally {
        if (mounted) {
          setLeadsLoading(false);
        }
      }
    }

    void loadLeads();

    return () => {
      mounted = false;
    };
  }, [authLoading, isDevelopmentAuthBypass, user]);

  const leads = useMemo(
    () =>
      savedLeads.filter((lead) => {
        const company = getCompanyOrTitle(lead);
        const haystack = [lead.snapshot.name, company].join(' ').toLowerCase();
        const matchesQuery = haystack.includes(query.trim().toLowerCase());
        const matchesFilter = activeFilter === 'all' || lead.status === activeFilter;

        return matchesQuery && matchesFilter;
      }),
    [activeFilter, query, savedLeads],
  );

  return (
    <Screen title="Leads" subtitle="Track business conversations by source, status, and follow-up context.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {onClose ? (
          <Pressable onPress={onClose} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}>
            <Text style={styles.backButtonText}>Back to settings</Text>
          </Pressable>
        ) : null}

        <View style={styles.searchShell}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or company"
            placeholderTextColor={colors.mutedText}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter) => (
            <Pressable
              key={filter.value}
              onPress={() => setActiveFilter(filter.value)}
              style={({ pressed }) => [
                styles.filterChip,
                activeFilter === filter.value ? styles.activeFilterChip : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.filterText, activeFilter === filter.value ? styles.activeFilterText : null]}>
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Business leads</Text>
            <Text style={styles.count}>{leadsLoading ? '...' : leads.length}</Text>
          </View>

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          {leadsLoading ? <Text style={styles.loading}>Loading leads...</Text> : null}
          {leads.length === 0 ? <Text style={styles.empty}>No leads match this search.</Text> : null}
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} onOpen={() => openLeadDetail(lead)} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function LeadRow({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}>
      <View style={styles.rowTop}>
        <Text numberOfLines={1} style={styles.name}>
          {lead.snapshot.name}
        </Text>
        <Text style={styles.statusPill}>{formatStatus(lead.status)}</Text>
      </View>
      <Text numberOfLines={1} style={styles.company}>
        {getCompanyOrTitle(lead)}
      </Text>
      <View style={styles.metaRow}>
        <Text numberOfLines={1} style={styles.meta}>
          {lead.source ?? 'Unknown source'}
        </Text>
        <Text style={styles.date}>{formatDate(lead.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

function getCompanyOrTitle(lead: Lead) {
  return lead.snapshot.business?.companyName ?? lead.snapshot.headline;
}

function formatStatus(status: LeadStatus) {
  return status[0].toUpperCase() + status.slice(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
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
  searchShell: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  searchInput: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '600',
  },
  filters: {
    paddingVertical: spacing.md,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  activeFilterChip: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  filterText: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  activeFilterText: {
    color: colors.surface,
  },
  pressed: {
    opacity: 0.72,
  },
  listCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  listTitle: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  count: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
  },
  empty: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    paddingVertical: spacing.md,
  },
  loading: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    paddingVertical: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    paddingVertical: spacing.md,
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  rowTop: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  name: {
    color: colors.text,
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: '800',
    marginRight: spacing.sm,
  },
  statusPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  company: {
    color: colors.text,
    fontSize: typography.sizes.small,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.mutedText,
    flex: 1,
    fontSize: typography.sizes.caption,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  date: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '700',
  },
});
