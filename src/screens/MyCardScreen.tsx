import { useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileQrCode } from '../components/ProfileQrCode';
import { useProfiles } from '../contexts';
import { mockBusinessProfile } from '../lib/mockData';
import { useEditProfileNavigation } from '../navigation/EditProfileNavigation';
import { generateVCardFromProfile, shareVCardFile } from '../services/vcardService';
import { spacing } from '../theme';
import type { Profile, ProfileType } from '../types';

const profileLabels: Record<ProfileType, string> = {
  personal: 'Personal',
  professional: 'Professional',
  acquaintance: 'Acquaintance',
  business: 'Business',
};

type CardSide = 'profile' | 'qr';
type RowIcon =
  | 'phone'
  | 'mail'
  | 'pin'
  | 'web'
  | 'instagram'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'calendar';

export function MyCardScreen() {
  const { openEditProfile } = useEditProfileNavigation();
  const {
    activeProfile,
    activeProfileId,
    loading: profilesLoading,
    profiles,
    selectProfile: selectActiveProfile,
  } = useProfiles();
  const [cardSide, setCardSide] = useState<CardSide>('profile');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const profileUrl = getProfileUrl(activeProfile);

  function selectProfile(profileId: string) {
    selectActiveProfile(profileId);
    setSelectorOpen(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {cardSide === 'profile' ? (
            <ProfileFront
              profile={activeProfile}
              profiles={profiles}
              activeProfileId={activeProfileId}
              loading={profilesLoading}
              selectorOpen={selectorOpen}
              onToggleSelector={() => setSelectorOpen((open) => !open)}
              onSelectProfile={selectProfile}
              onEdit={() => openEditProfile(activeProfile.id)}
              onFlip={() => setCardSide('qr')}
            />
          ) : (
            <QrBack
              profile={activeProfile}
              profileUrl={profileUrl}
              onFlip={() => setCardSide('profile')}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileFront({
  profile,
  profiles,
  activeProfileId,
  loading,
  selectorOpen,
  onToggleSelector,
  onSelectProfile,
  onEdit,
  onFlip,
}: {
  profile: Profile;
  profiles: Profile[];
  activeProfileId: string;
  loading: boolean;
  selectorOpen: boolean;
  onToggleSelector: () => void;
  onSelectProfile: (profileId: string) => void;
  onEdit: () => void;
  onFlip: () => void;
}) {
  const socials = getSocialRows(profile);

  return (
    <>
      <View style={styles.softOrbTop} />
      <View style={styles.softOrbBottom} />
      <Pressable onPress={onEdit} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
        <Text style={styles.editButtonText}>Edit</Text>
      </Pressable>
      <Pressable onPress={onFlip} style={({ pressed }) => [styles.qrButton, pressed && styles.pressed]}>
        <GridIcon />
      </Pressable>

      <View style={styles.avatar}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
        )}
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.name}>{profile.name}</Text>
        <View style={styles.verifiedBadge}>
          <CheckIcon />
        </View>
      </View>
      <Text style={styles.title}>{getProfileTitle(profile)}</Text>
      <Text numberOfLines={3} style={styles.bio}>
        {profile.bio}
      </Text>

      {socials.length > 0 ? (
        <View style={styles.socialMiniRow}>
          {socials.slice(0, 4).map((row) => (
            <View key={`${row.value}-${row.icon}`} style={styles.socialMiniIcon}>
              <MethodIcon name={row.icon} compact />
            </View>
          ))}
        </View>
      ) : null}

      <ProfileSelector
        profile={profile}
        profiles={profiles}
        activeProfileId={activeProfileId}
        loading={loading}
        open={selectorOpen}
        onToggle={onToggleSelector}
        onSelect={onSelectProfile}
      />

      <View style={styles.divider} />

      <Section title="CONTACT">
        {getContactRows(profile).map((row) => (
          <InfoRow key={row.label} icon={row.icon} value={row.value} action={row.action} />
        ))}
      </Section>

      <Section title="SOCIALS">
        {socials.map((row) => (
          <InfoRow key={`${row.icon}-${row.value}`} icon={row.icon} value={row.value} action="external" />
        ))}
      </Section>
    </>
  );
}

function QrBack({ profile, profileUrl, onFlip }: { profile: Profile; profileUrl: string; onFlip: () => void }) {
  const [sharingVCard, setSharingVCard] = useState(false);
  const [vcardError, setVCardError] = useState<string | null>(null);

  async function handleShareVCard() {
    setSharingVCard(true);
    setVCardError(null);

    try {
      await shareVCardFile(profile.name, generateVCardFromProfile(profile));
    } catch (error) {
      setVCardError(error instanceof Error ? error.message : 'Unable to share vCard.');
    } finally {
      setSharingVCard(false);
    }
  }

  return (
    <>
      <View style={styles.softOrbTop} />
      <Pressable onPress={onFlip} style={({ pressed }) => [styles.backPill, pressed && styles.pressed]}>
        <ChevronIcon direction="left" />
        <Text style={styles.backPillText}>Profile</Text>
      </Pressable>

      <Text style={styles.qrHeading}>Sharing Center</Text>
      <Text style={styles.qrSubheading}>Scan to share this profile.</Text>

      <View style={styles.qrFrame}>
        <ProfileQrCode value={profileUrl} />
      </View>

      <Text style={styles.qrName}>{profile.name}</Text>
      <Text numberOfLines={1} style={styles.profileUrl}>
        {profileUrl}
      </Text>

      <View style={styles.actions}>
        <Pressable onPress={() => copyProfileUrl(profileUrl)} style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}>
          <Text style={styles.secondaryActionText}>Copy Link</Text>
        </Pressable>
        <Pressable
          onPress={() => Share.share({ message: profileUrl, url: profileUrl })}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
        >
          <Text style={styles.primaryActionText}>Share Profile</Text>
        </Pressable>
      </View>

      {vcardError ? <Text style={styles.vcardError}>{vcardError}</Text> : null}
      <Pressable
        disabled={sharingVCard}
        onPress={handleShareVCard}
        style={({ pressed }) => [styles.flipAction, pressed && styles.pressed, sharingVCard && styles.disabled]}
      >
        <Text style={styles.flipActionText}>{sharingVCard ? 'Preparing vCard...' : 'Save vCard'}</Text>
      </Pressable>

      <Pressable onPress={onFlip} style={({ pressed }) => [styles.flipAction, pressed && styles.pressed]}>
        <Text style={styles.flipActionText}>Flip to Profile</Text>
      </Pressable>
    </>
  );
}

function ProfileSelector({
  profile,
  profiles,
  activeProfileId,
  loading,
  open,
  onToggle,
  onSelect,
}: {
  profile: Profile;
  profiles: Profile[];
  activeProfileId: string;
  loading: boolean;
  open: boolean;
  onToggle: () => void;
  onSelect: (profileId: string) => void;
}) {
  return (
    <View style={styles.selectorWrap}>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.selector, pressed && styles.pressed]}>
        <View style={styles.selectorIcon}>
          <MethodIcon name="web" compact />
        </View>
        <Text style={styles.selectorText}>{loading ? 'Loading Profile' : `${profileLabels[profile.type]} Profile`}</Text>
        <ChevronIcon direction={open ? 'up' : 'down'} />
      </Pressable>

      {open && !loading ? (
        <View style={styles.selectorMenu}>
          {profiles.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={({ pressed }) => [
                styles.selectorOption,
                item.id === activeProfileId && styles.selectorOptionActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.selectorOptionText}>{profileLabels[item.type]} Profile</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ icon, value, action }: { icon: RowIcon; value: string; action?: 'message' | 'external' }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <MethodIcon name={icon} />
      </View>
      <Text numberOfLines={1} style={styles.rowValue}>
        {value}
      </Text>
      <View style={styles.rowAction}>{action === 'message' ? <Text style={styles.messageActionText}>wa</Text> : <ExternalIcon />}</View>
    </View>
  );
}

function MethodIcon({ name, compact = false }: { name: RowIcon; compact?: boolean }) {
  const textStyle = compact ? styles.compactBrandText : styles.brandText;

  if (name === 'phone') return <View style={styles.phoneIcon} />;
  if (name === 'mail') return <View style={styles.mailIcon}><View style={styles.mailFlapLeft} /><View style={styles.mailFlapRight} /></View>;
  if (name === 'pin') return <View style={styles.pinIcon}><View style={styles.pinDot} /></View>;
  if (name === 'web') return <View style={styles.webIcon}><View style={styles.webLine} /></View>;
  if (name === 'instagram') return <View style={styles.instagramIcon}><View style={styles.instagramDot} /></View>;
  if (name === 'youtube') return <View style={styles.youtubeIcon}><View style={styles.playTriangle} /></View>;
  if (name === 'calendar') return <View style={styles.calendarIcon}><View style={styles.calendarTop} /></View>;
  if (name === 'facebook') return <Text style={textStyle}>f</Text>;
  if (name === 'x') return <Text style={textStyle}>X</Text>;
  if (name === 'linkedin') return <Text style={textStyle}>in</Text>;
  return <Text style={textStyle}>tt</Text>;
}

function GridIcon() {
  return (
    <View style={styles.gridIcon}>
      <View style={styles.gridDot} />
      <View style={styles.gridDot} />
      <View style={styles.gridDot} />
      <View style={styles.gridDot} />
    </View>
  );
}

function CheckIcon() {
  return (
    <View style={styles.checkIcon}>
      <View style={styles.checkShort} />
      <View style={styles.checkLong} />
    </View>
  );
}

function ChevronIcon({ direction }: { direction: 'right' | 'down' | 'up' | 'left' }) {
  const rotate =
    direction === 'right' ? '-90deg' : direction === 'up' ? '180deg' : direction === 'left' ? '90deg' : '0deg';

  return (
    <View style={[styles.chevronIcon, { transform: [{ rotate }] }]}>
      <View style={[styles.chevronLine, styles.chevronLeftLine]} />
      <View style={[styles.chevronLine, styles.chevronRightLine]} />
    </View>
  );
}

function ExternalIcon() {
  return (
    <View style={styles.externalIcon}>
      <View style={styles.externalStem} />
      <View style={styles.externalHead} />
    </View>
  );
}

function getContactRows(profile: Profile) {
  const rows: Array<{ icon: RowIcon; label: string; value: string; action?: 'message' | 'external' } | null> = [
    profile.phone ? { icon: 'phone', label: 'Phone', value: profile.phone, action: 'message' } : null,
    profile.email ? { icon: 'mail', label: 'Email', value: profile.email, action: 'external' } : null,
    profile.location ? { icon: 'pin', label: 'Location', value: profile.location, action: 'external' } : null,
  ];

  if (profile.type === 'business' && mockBusinessProfile.websiteUrl) {
    rows.push({ icon: 'web', label: 'Website', value: formatLinkValue(mockBusinessProfile.websiteUrl), action: 'external' });
  }

  return rows.filter((row): row is { icon: RowIcon; label: string; value: string; action?: 'message' | 'external' } => row !== null);
}

function getSocialRows(profile: Profile) {
  if (profile.links.length === 0) {
    return [
      { icon: 'instagram' as const, value: '@cardiq' },
      { icon: 'facebook' as const, value: 'CardIQ' },
      { icon: 'x' as const, value: '@cardiq' },
      { icon: 'linkedin' as const, value: 'CardIQ' },
    ];
  }

  return profile.links.map((link) => ({
    icon: getLinkIcon(link.label),
    value: formatLinkValue(link.url),
  }));
}

function getLinkIcon(label: string): RowIcon {
  const lower = label.toLowerCase();
  if (lower.includes('instagram')) return 'instagram';
  if (lower.includes('facebook')) return 'facebook';
  if (lower.includes('linkedin')) return 'linkedin';
  if (lower.includes('youtube')) return 'youtube';
  if (lower.includes('tiktok')) return 'tiktok';
  if (lower.includes('twitter') || lower === 'x') return 'x';
  if (lower.includes('calendar') || lower.includes('demo')) return 'calendar';
  return 'web';
}

function formatLinkValue(url: string) {
  return url.replace('mailto:', '').replace('https://', '').replace('http://', '').replace('www.', '');
}

function copyProfileUrl(profileUrl: string) {
  const clipboard = (globalThis as {
    navigator?: { clipboard?: { writeText?: (text: string) => Promise<void> } };
  }).navigator?.clipboard;

  void clipboard?.writeText?.(profileUrl);
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getProfileTitle(profile: Profile) {
  if (profile.company) {
    return `${profile.headline} at ${profile.company}`;
  }

  if (profile.type === 'business') {
    return `${mockBusinessProfile.jobTitle} at ${mockBusinessProfile.companyName}`;
  }

  return profile.headline;
}

function getProfileUrl(profile: Profile) {
  return `https://cardiq.app/u/${profile.publicSlug}`;
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAFC',
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 72,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderColor: 'rgba(203,213,225,0.72)',
    borderRadius: 30,
    borderWidth: 1,
    maxWidth: 460,
    overflow: 'hidden',
    paddingBottom: spacing.lg,
    paddingHorizontal: 22,
    paddingTop: 26,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.16,
    shadowRadius: 34,
    width: '100%',
    elevation: 5,
  },
  softOrbTop: {
    backgroundColor: 'rgba(99,102,241,0.105)',
    borderRadius: 92,
    height: 158,
    position: 'absolute',
    right: -54,
    top: -60,
    width: 158,
  },
  softOrbBottom: {
    backgroundColor: 'rgba(59,130,246,0.075)',
    borderRadius: 88,
    bottom: -70,
    height: 150,
    left: -66,
    position: 'absolute',
    width: 150,
  },
  qrButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(238,242,255,0.94)',
    borderColor: '#E0E7FF',
    borderRadius: 14,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 38,
    zIndex: 2,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(238,242,255,0.94)',
    borderColor: '#E0E7FF',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    left: spacing.md,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    position: 'absolute',
    top: spacing.md,
    zIndex: 2,
  },
  editButtonText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '800',
  },
  gridIcon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    height: 15,
    width: 15,
  },
  gridDot: {
    backgroundColor: '#6366F1',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  avatar: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#EEF2FF',
    borderColor: '#FFFFFF',
    borderRadius: 54,
    borderWidth: 4,
    height: 108,
    justifyContent: 'center',
    marginTop: spacing.xs,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    width: 108,
    elevation: 3,
  },
  avatarText: {
    color: '#6366F1',
    fontSize: 31,
    fontWeight: '800',
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  nameRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    marginTop: 18,
  },
  name: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 29,
    textAlign: 'center',
  },
  verifiedBadge: {
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 18,
  },
  checkIcon: {
    height: 10,
    width: 10,
  },
  checkShort: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 2,
    left: 1,
    position: 'absolute',
    top: 5,
    transform: [{ rotate: '45deg' }],
    width: 5,
  },
  checkLong: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 2,
    left: 4,
    position: 'absolute',
    top: 4,
    transform: [{ rotate: '-45deg' }],
    width: 8,
  },
  title: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  bio: {
    alignSelf: 'center',
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 312,
    textAlign: 'center',
  },
  socialMiniRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 14,
  },
  socialMiniIcon: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  selectorWrap: {
    marginTop: 18,
  },
  selector: {
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    borderColor: '#E2E8F0',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 46,
    paddingHorizontal: spacing.sm,
  },
  selectorIcon: {
    alignItems: 'center',
    backgroundColor: '#E8EDFF',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  selectorText: {
    color: '#172033',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  selectorMenu: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 15,
    borderWidth: 1,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  selectorOption: {
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  selectorOptionActive: {
    backgroundColor: '#F1F5FF',
  },
  selectorOptionText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    backgroundColor: '#E2E8F0',
    height: 1,
    marginTop: 18,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    color: '#8A9AAF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 7,
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#F6F8FC',
    borderColor: '#EDF2F7',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
  },
  rowIcon: {
    alignItems: 'center',
    backgroundColor: '#E8EDFF',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 32,
  },
  rowValue: {
    color: '#1E293B',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  rowAction: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 28,
  },
  messageActionText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '900',
  },
  brandText: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '900',
  },
  compactBrandText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
  },
  phoneIcon: {
    backgroundColor: '#4F46E5',
    borderRadius: 4,
    height: 16,
    transform: [{ rotate: '-24deg' }],
    width: 8,
  },
  mailIcon: {
    borderColor: '#4F46E5',
    borderRadius: 2,
    borderWidth: 2,
    height: 12,
    width: 17,
  },
  mailFlapLeft: {
    backgroundColor: '#4F46E5',
    height: 2,
    left: 1,
    position: 'absolute',
    top: 4,
    transform: [{ rotate: '30deg' }],
    width: 8,
  },
  mailFlapRight: {
    backgroundColor: '#4F46E5',
    height: 2,
    position: 'absolute',
    right: 1,
    top: 4,
    transform: [{ rotate: '-30deg' }],
    width: 8,
  },
  pinIcon: {
    alignItems: 'center',
    borderColor: '#4F46E5',
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    width: 16,
  },
  pinDot: {
    backgroundColor: '#4F46E5',
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  webIcon: {
    borderColor: '#4F46E5',
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  webLine: {
    backgroundColor: '#4F46E5',
    height: 2,
    width: 12,
  },
  instagramIcon: {
    borderColor: '#6366F1',
    borderRadius: 5,
    borderWidth: 2,
    height: 17,
    width: 17,
  },
  instagramDot: {
    backgroundColor: '#6366F1',
    borderRadius: 2,
    height: 4,
    position: 'absolute',
    right: 2,
    top: 2,
    width: 4,
  },
  youtubeIcon: {
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 5,
    height: 14,
    justifyContent: 'center',
    width: 18,
  },
  playTriangle: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 4,
    borderLeftColor: '#FFFFFF',
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderTopWidth: 4,
    height: 0,
    width: 0,
  },
  calendarIcon: {
    borderColor: '#4F46E5',
    borderRadius: 4,
    borderWidth: 2,
    height: 16,
    overflow: 'hidden',
    width: 16,
  },
  calendarTop: {
    backgroundColor: '#4F46E5',
    height: 4,
    width: 16,
  },
  chevronIcon: {
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  chevronLine: {
    backgroundColor: '#94A3B8',
    borderRadius: 1,
    height: 2,
    position: 'absolute',
    top: 8,
    width: 8,
  },
  chevronLeftLine: {
    left: 2,
    transform: [{ rotate: '45deg' }],
  },
  chevronRightLine: {
    right: 2,
    transform: [{ rotate: '-45deg' }],
  },
  externalIcon: {
    height: 15,
    width: 15,
  },
  externalStem: {
    backgroundColor: '#94A3B8',
    height: 2,
    position: 'absolute',
    right: 3,
    top: 6,
    transform: [{ rotate: '-45deg' }],
    width: 11,
  },
  externalHead: {
    borderRightColor: '#94A3B8',
    borderRightWidth: 2,
    borderTopColor: '#94A3B8',
    borderTopWidth: 2,
    height: 7,
    position: 'absolute',
    right: 2,
    top: 2,
    width: 7,
  },
  backPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  backPillText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  qrHeading: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  qrSubheading: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  qrFrame: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  qrName: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  profileUrl: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  secondaryActionText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  flipAction: {
    alignItems: 'center',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 44,
  },
  flipActionText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.64,
  },
  vcardError: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
