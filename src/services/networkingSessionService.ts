import type { NearbyUser, NetworkingSession, SessionParticipant } from '../types';
import type { Database } from '../types/database';

type NetworkingSessionRow = Database['public']['Tables']['networking_sessions']['Row'];
type SessionParticipantRow = Database['public']['Tables']['session_participants']['Row'];
type NearbyUserRow = Database['public']['Tables']['nearby_users']['Row'];

const sessions = new Map<NetworkingSessionRow['id'], NetworkingSession>();
const participants = new Map<SessionParticipantRow['id'], SessionParticipant>();

const mockNearbyUsers: readonly NearbyUserRow[] = [
  {
    id: 'nearby_maya_reed',
    display_name: 'Maya Reed',
    headline: 'Partnerships Lead at Northstar Labs',
    distance_label: 'Nearby',
    last_seen_at: new Date().toISOString(),
  },
  {
    id: 'nearby_noah_kim',
    display_name: 'Noah Kim',
    headline: 'Operations Director at Fieldstone',
    distance_label: 'Same room',
    last_seen_at: new Date().toISOString(),
  },
];

export async function createNetworkingSession(hostUserId: string): Promise<NetworkingSession> {
  const now = new Date().toISOString();
  const session: NetworkingSession = {
    id: `session_${Date.now()}`,
    hostUserId,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  sessions.set(session.id, session);
  await joinNetworkingSession(session.id, hostUserId);

  return session;
}

export async function joinNetworkingSession(
  sessionId: string,
  userId: string,
): Promise<SessionParticipant> {
  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error('Networking session not found.');
  }

  if (session.status !== 'active') {
    throw new Error('Networking session is not active.');
  }

  const participantId = getParticipantId(sessionId, userId);
  const existingParticipant = participants.get(participantId);

  if (existingParticipant && !existingParticipant.leftAt) {
    return existingParticipant;
  }

  const participant: SessionParticipant = {
    id: participantId,
    sessionId,
    userId,
    joinedAt: new Date().toISOString(),
  };

  participants.set(participantId, participant);
  return participant;
}

export async function leaveNetworkingSession(sessionId: string, userId: string): Promise<void> {
  const participantId = getParticipantId(sessionId, userId);
  const participant = participants.get(participantId);

  if (!participant) {
    return;
  }

  participants.set(participantId, {
    ...participant,
    leftAt: new Date().toISOString(),
  });
}

export async function getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
  return Array.from(participants.values()).filter(
    (participant) => participant.sessionId === sessionId && !participant.leftAt,
  );
}

export async function discoverNearbyUsers(): Promise<NearbyUser[]> {
  const now = new Date().toISOString();

  return mockNearbyUsers.map((user) => ({
    id: user.id,
    displayName: user.display_name,
    headline: user.headline ?? undefined,
    distanceLabel: user.distance_label ?? undefined,
    lastSeenAt: now,
  }));
}

function getParticipantId(sessionId: string, userId: string) {
  return `${sessionId}_${userId}`;
}
