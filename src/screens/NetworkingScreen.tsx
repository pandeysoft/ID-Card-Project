import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import {
  createNetworkingSession,
  discoverNearbyUsers,
  getSessionParticipants,
  joinNetworkingSession,
} from '../services/networkingSessionService';
import { colors, spacing, typography } from '../theme';
import type { NearbyUser, NetworkingSession, SessionParticipant } from '../types';

const localUserId = 'local-networking-user';

type NetworkingScreenProps = {
  onClose?: () => void;
};

export function NetworkingScreen({ onClose }: NetworkingScreenProps) {
  const [session, setSession] = useState<NetworkingSession | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [joinSessionId, setJoinSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void refreshNearbyUsers();
  }, []);

  async function refreshNearbyUsers() {
    setErrorMessage(null);

    try {
      setNearbyUsers(await discoverNearbyUsers());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to discover nearby users.');
    }
  }

  async function refreshParticipants(sessionId: string) {
    setParticipants(await getSessionParticipants(sessionId));
  }

  async function handleStartSession() {
    setLoading(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const nextSession = await createNetworkingSession(localUserId);
      setSession(nextSession);
      await refreshParticipants(nextSession.id);
      setMessage('Networking session started.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to start networking session.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinSession() {
    const sessionId = joinSessionId.trim();

    if (!sessionId) {
      setErrorMessage('Enter a session ID to join.');
      return;
    }

    setLoading(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      await joinNetworkingSession(sessionId, localUserId);
      setSession({
        id: sessionId,
        hostUserId: 'unknown-host',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await refreshParticipants(sessionId);
      setMessage('Joined session.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to join session.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="Networking" subtitle="Mock nearby networking session tools for local preview.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {onClose ? (
          <Pressable onPress={onClose} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}>
            <Text style={styles.backButtonText}>Back to settings</Text>
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>
          <Pressable
            disabled={loading}
            onPress={handleStartSession}
            style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null, loading ? styles.disabled : null]}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Working...' : 'Start Networking Session'}</Text>
          </Pressable>
          {session ? <Text style={styles.sessionId}>Session ID: {session.id}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join Session</Text>
          <TextInput
            value={joinSessionId}
            onChangeText={setJoinSessionId}
            placeholder="Enter session ID"
            placeholderTextColor={colors.mutedText}
            style={styles.input}
          />
          <Pressable
            disabled={loading}
            onPress={handleJoinSession}
            style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null, loading ? styles.disabled : null]}
          >
            <Text style={styles.secondaryButtonText}>Join Session</Text>
          </Pressable>
        </View>

        {message ? <Text style={styles.success}>{message}</Text> : null}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Users</Text>
            <Pressable onPress={refreshNearbyUsers} style={({ pressed }) => (pressed ? styles.pressed : null)}>
              <Text style={styles.refreshText}>Refresh</Text>
            </Pressable>
          </View>
          {nearbyUsers.map((user) => (
            <View key={user.id} style={styles.row}>
              <Text style={styles.name}>{user.displayName}</Text>
              <Text style={styles.meta}>{user.headline ?? 'No headline'}</Text>
              <Text style={styles.meta}>{user.distanceLabel ?? 'Nearby'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Participants</Text>
          {participants.length === 0 ? <Text style={styles.empty}>No active participants yet.</Text> : null}
          {participants.map((participant) => (
            <View key={participant.id} style={styles.row}>
              <Text style={styles.name}>{participant.userId}</Text>
              <Text style={styles.meta}>Joined {formatTime(participant.joinedAt)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
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
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 46,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  input: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '600',
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  sessionId: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  row: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  meta: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  empty: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '700',
  },
  refreshText: {
    color: colors.primary,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  success: {
    color: colors.success,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginBottom: spacing.md,
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
