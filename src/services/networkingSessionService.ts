import type { NearbyUser, NetworkingSession, SessionParticipant } from '../types';

const sessions = new Map<string, NetworkingSession>();
const participants = new Map<string, SessionParticipant>();

const mockNearbyUsers: readonly NearbyUser[] = [
  {
    id: 'nearby_maya_reed',
    displayName: 'Maya Reed',
    headline: 'Partnerships Lead at Northstar Labs',
    distanceLabel: 'Nearby',
    lastSeenAt: new Date().toISOString(),
  },
  {
    id: 'nearby_noah_kim',
    displayName: 'Noah Kim',
    headline: 'Operations Director at Fieldstone',
    distanceLabel: 'Same room',
    lastSeenAt: new Date().toISOString(),
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
    ...user,
    lastSeenAt: now,
  }));
}

function getParticipantId(sessionId: string, userId: string) {
  return `${sessionId}_${userId}`;
}
