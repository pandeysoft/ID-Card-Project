import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../contexts';
import {
  acceptExchangeRequest,
  cancelExchangeRequest,
  declineExchangeRequest,
  listExchangeRequests,
  type ExchangeRequestWithProfiles,
} from '../services/exchangeRequestService';
import { colors, spacing, typography } from '../theme';
import type { ContactExchangeStatus } from '../types';

type SectionKey = 'incoming' | 'outgoing' | 'accepted' | 'declined';

const sectionLabels: Record<SectionKey, string> = {
  incoming: 'Pending Incoming',
  outgoing: 'Pending Outgoing',
  accepted: 'Accepted',
  declined: 'Declined',
};

export function ExchangeRequestsScreen() {
  const { isDevelopmentAuthBypass, user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<ExchangeRequestWithProfiles[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadRequests() {
    if (authLoading) {
      return;
    }

    if (!user || isDevelopmentAuthBypass) {
      setRequests([]);
      setErrorMessage(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      setRequests(await listExchangeRequests());
    } catch (error) {
      console.warn('CardIQ exchange requests failed to load.', error);
      setErrorMessage('Unable to load exchange requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, [authLoading, isDevelopmentAuthBypass, user?.id]);

  const sections = useMemo(() => groupRequests(requests, user?.id), [requests, user?.id]);

  async function handleAction(
    request: ExchangeRequestWithProfiles,
    action: 'accept' | 'decline' | 'cancel',
  ) {
    if (!user) {
      return;
    }

    setActionId(request.id);
    setErrorMessage(null);

    try {
      if (action === 'accept') {
        await acceptExchangeRequest(request.id, user.id);
      } else if (action === 'decline') {
        await declineExchangeRequest(request.id, user.id);
      } else {
        await cancelExchangeRequest(request.id, user.id);
      }

      await loadRequests();
    } catch (error) {
      console.warn('CardIQ exchange request action failed.', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update exchange request.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <Screen title="Exchange" subtitle="Review contact exchange requests.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.summary}>{loading ? 'Loading...' : `${requests.length} requests`}</Text>
          <Pressable
            disabled={loading}
            onPress={() => void loadRequests()}
            style={({ pressed }) => [styles.refreshButton, pressed ? styles.pressed : null, loading ? styles.disabled : null]}
          >
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        {(Object.keys(sectionLabels) as SectionKey[]).map((sectionKey) => (
          <RequestSection
            key={sectionKey}
            actionId={actionId}
            currentUserId={user?.id}
            requests={sections[sectionKey]}
            sectionKey={sectionKey}
            onAction={handleAction}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

function RequestSection({
  actionId,
  currentUserId,
  requests,
  sectionKey,
  onAction,
}: {
  actionId: string | null;
  currentUserId?: string;
  requests: ExchangeRequestWithProfiles[];
  sectionKey: SectionKey;
  onAction: (request: ExchangeRequestWithProfiles, action: 'accept' | 'decline' | 'cancel') => Promise<void>;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{sectionLabels[sectionKey]}</Text>
        <Text style={styles.count}>{requests.length}</Text>
      </View>
      {requests.length === 0 ? <Text style={styles.empty}>No requests.</Text> : null}
      {requests.map((request) => (
        <RequestRow
          key={request.id}
          actionId={actionId}
          currentUserId={currentUserId}
          request={request}
          sectionKey={sectionKey}
          onAction={onAction}
        />
      ))}
    </View>
  );
}

function RequestRow({
  actionId,
  currentUserId,
  request,
  sectionKey,
  onAction,
}: {
  actionId: string | null;
  currentUserId?: string;
  request: ExchangeRequestWithProfiles;
  sectionKey: SectionKey;
  onAction: (request: ExchangeRequestWithProfiles, action: 'accept' | 'decline' | 'cancel') => Promise<void>;
}) {
  const isOutgoing = request.requesterUserId === currentUserId;
  const name = isOutgoing ? request.recipientName : request.requesterName;
  const headline = isOutgoing ? request.recipientHeadline : request.requesterHeadline;
  const busy = actionId === request.id;

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(name ?? 'Contact')}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text numberOfLines={1} style={styles.name}>{name ?? 'Contact'}</Text>
        <Text numberOfLines={1} style={styles.headline}>{headline ?? getStatusLabel(request.status)}</Text>
        <Text style={styles.meta}>{formatDate(request.createdAt)}</Text>
        {sectionKey === 'incoming' ? (
          <View style={styles.actions}>
            <ActionButton disabled={busy} label={busy ? '...' : 'Accept'} onPress={() => void onAction(request, 'accept')} primary />
            <ActionButton disabled={busy} label="Decline" onPress={() => void onAction(request, 'decline')} />
          </View>
        ) : null}
        {sectionKey === 'outgoing' ? (
          <View style={styles.actions}>
            <ActionButton disabled={busy} label={busy ? '...' : 'Cancel'} onPress={() => void onAction(request, 'cancel')} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ActionButton({
  disabled,
  label,
  onPress,
  primary,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        primary ? styles.primaryAction : null,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={[styles.actionText, primary ? styles.primaryActionText : null]}>{label}</Text>
    </Pressable>
  );
}

function groupRequests(requests: ExchangeRequestWithProfiles[], currentUserId?: string) {
  const groups: Record<SectionKey, ExchangeRequestWithProfiles[]> = {
    incoming: [],
    outgoing: [],
    accepted: [],
    declined: [],
  };

  requests.forEach((request) => {
    if (request.status === 'pending' && request.recipientUserId === currentUserId) {
      groups.incoming.push(request);
    } else if (request.status === 'pending' && request.requesterUserId === currentUserId) {
      groups.outgoing.push(request);
    } else if (request.status === 'accepted') {
      groups.accepted.push(request);
    } else if (request.status === 'declined' || request.status === 'cancelled') {
      groups.declined.push(request);
    }
  });

  return groups;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getStatusLabel(status: ContactExchangeStatus) {
  return status[0].toUpperCase() + status.slice(1);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summary: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  refreshText: {
    color: colors.primary,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
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
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  row: {
    alignItems: 'flex-start',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    height: 44,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 44,
  },
  avatarText: {
    color: colors.primary,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  rowBody: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionText: {
    color: colors.text,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
  },
  primaryActionText: {
    color: colors.surface,
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.64,
  },
});
