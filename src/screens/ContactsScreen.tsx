import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../contexts';
import { mockLeads, mockSavedContacts } from '../lib/mockData';
import { useEditProfileNavigation } from '../navigation/EditProfileNavigation';
import { getContacts } from '../services/contactService';
import { generateVCardFromContact, shareVCardFile } from '../services/vcardService';
import { colors, spacing, typography } from '../theme';
import type { SavedContact } from '../types';

type ContactFilter = 'all' | 'personal' | 'professional' | 'lead';

const filters: { label: string; value: ContactFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Personal', value: 'personal' },
  { label: 'Professional', value: 'professional' },
  { label: 'Lead', value: 'lead' },
];
const contactsPageSize = 25;

export function ContactsScreen() {
  const { isDevelopmentAuthBypass, user, loading: authLoading } = useAuth();
  const { openContactDetail } = useEditProfileNavigation();
  const [savedContacts, setSavedContacts] = useState<SavedContact[]>([...mockSavedContacts]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsLoadingMore, setContactsLoadingMore] = useState(false);
  const [hasMoreContacts, setHasMoreContacts] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ContactFilter>('all');

  useEffect(() => {
    let mounted = true;

    async function loadContacts() {
      if (authLoading) {
        return;
      }

      if (!user || isDevelopmentAuthBypass) {
        setSavedContacts([...mockSavedContacts]);
        setContactsLoading(false);
        setHasMoreContacts(false);
        setErrorMessage(null);
        return;
      }

      setContactsLoading(true);
      setErrorMessage(null);

      try {
        const contacts = await getContacts(user.id, {
          limit: contactsPageSize,
          offset: 0,
          search: query.trim() || undefined,
        });

        if (mounted) {
          setSavedContacts(contacts);
          setHasMoreContacts(contacts.length === contactsPageSize);
        }
      } catch (error) {
        console.warn('CardIQ contacts failed to load.', error);

        if (mounted) {
          setErrorMessage('Unable to load contacts.');
          setSavedContacts([]);
        }
      } finally {
        if (mounted) {
          setContactsLoading(false);
        }
      }
    }

    void loadContacts();

    return () => {
      mounted = false;
    };
  }, [authLoading, isDevelopmentAuthBypass, query, user]);

  async function handleLoadMoreContacts() {
    if (!user || isDevelopmentAuthBypass || contactsLoadingMore) {
      return;
    }

    setContactsLoadingMore(true);
    setErrorMessage(null);

    try {
      const nextContacts = await getContacts(user.id, {
        limit: contactsPageSize,
        offset: savedContacts.length,
        search: query.trim() || undefined,
      });

      setSavedContacts((current) => [...current, ...nextContacts]);
      setHasMoreContacts(nextContacts.length === contactsPageSize);
    } catch (error) {
      console.warn('CardIQ contacts failed to load more.', error);
      setErrorMessage('Unable to load more contacts.');
    } finally {
      setContactsLoadingMore(false);
    }
  }

  const contacts = useMemo(
    () =>
      savedContacts.filter((contact) => {
        const haystack = [
          contact.snapshot.name,
          contact.snapshot.headline,
          contact.snapshot.type,
          getLeadForContact(contact)?.source,
          contact.tags.join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const matchesQuery = haystack.includes(query.trim().toLowerCase());
        const matchesFilter =
          activeFilter === 'all' ||
          (activeFilter === 'lead' && Boolean(getLeadForContact(contact))) ||
          (activeFilter !== 'lead' && contact.snapshot.type === activeFilter);

        return matchesQuery && matchesFilter;
      }),
    [activeFilter, query, savedContacts],
  );

  return (
    <Screen title="Contacts" subtitle="A focused place for saved people, notes, and follow-ups.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.searchShell}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search contacts"
            placeholderTextColor={colors.mutedText}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
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
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.value ? styles.activeFilterText : null,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Saved connections</Text>
            <Text style={styles.count}>{contactsLoading ? '...' : contacts.length}</Text>
          </View>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          {contactsLoading ? <Text style={styles.loading}>Loading contacts...</Text> : null}
          {contacts.map((contact) => (
            <ContactRow key={contact.id} contact={contact} onOpen={() => openContactDetail(contact)} />
          ))}
          {hasMoreContacts ? (
            <Pressable
              disabled={contactsLoadingMore}
              onPress={handleLoadMoreContacts}
              style={({ pressed }) => [styles.loadMoreButton, pressed ? styles.pressed : null, contactsLoadingMore ? styles.disabled : null]}
            >
              <Text style={styles.loadMoreText}>{contactsLoadingMore ? 'Loading...' : 'Load more'}</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function ContactRow({ contact, onOpen }: { contact: SavedContact; onOpen: () => void }) {
  const lead = getLeadForContact(contact);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExportVCard() {
    setExporting(true);
    setExportError(null);

    try {
      await shareVCardFile(contact.snapshot.name, generateVCardFromContact(contact));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Unable to export vCard.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(contact.snapshot.name)}</Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text numberOfLines={1} style={styles.name}>
            {contact.snapshot.name}
          </Text>
          <Text style={styles.typePill}>{lead ? 'Lead' : getRelationshipType(contact)}</Text>
        </View>
        <Text numberOfLines={1} style={styles.headline}>
          {contact.snapshot.headline}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {getRelationshipType(contact)} · {lead?.source ?? 'Manual save'}
        </Text>
        {exportError ? <Text style={styles.exportError}>{exportError}</Text> : null}
      </View>
      <Pressable
        disabled={exporting}
        onPress={(event) => {
          event.stopPropagation();
          void handleExportVCard();
        }}
        style={({ pressed }) => [styles.exportButton, pressed ? styles.pressed : null, exporting ? styles.disabled : null]}
      >
        <Text style={styles.exportButtonText}>{exporting ? '...' : 'Export vCard'}</Text>
      </Pressable>
    </Pressable>
  );
}

function getLeadForContact(contact: SavedContact) {
  return mockLeads.find((lead) => lead.savedContactId === contact.id);
}

function getRelationshipType(contact: SavedContact) {
  if (contact.snapshot.type === 'business') {
    return 'Professional';
  }

  return contact.snapshot.type[0].toUpperCase() + contact.snapshot.type.slice(1);
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
  searchShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  searchIcon: {
    color: colors.mutedText,
    fontSize: typography.sizes.heading,
    marginRight: spacing.sm,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
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
    marginRight: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
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
  listCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 4,
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
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 82,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.64,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    height: 48,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 48,
  },
  avatarText: {
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  rowBody: {
    flex: 1,
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
  typePill: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headline: {
    color: colors.text,
    fontSize: typography.sizes.small,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  exportButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  exportButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
  },
  exportError: {
    color: colors.danger,
    fontSize: typography.sizes.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
});
