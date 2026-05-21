import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../contexts';
import {
  extractBusinessCardFromImage,
  type ExtractedBusinessCard,
} from '../services/businessCardOcrService';
import { createContact } from '../services/contactService';
import { colors, spacing, typography } from '../theme';
import type { SavedContact } from '../types';
import type { RootStackParamList } from '../types/navigation';

type ScanMode = 'menu' | 'qr' | 'businessCard';

export function ScanScreen() {
  const { isDevelopmentAuthBypass, user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const cameraRef = useRef<CameraView>(null);
  const [mode, setMode] = useState<ScanMode>('menu');
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedValue, setScannedValue] = useState<string | null>(null);
  const [capturedCardUri, setCapturedCardUri] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [extractedCard, setExtractedCard] = useState<ExtractedBusinessCard | null>(null);
  const [extractingCard, setExtractingCard] = useState(false);
  const [savingCardContact, setSavingCardContact] = useState(false);
  const [savedCardContact, setSavedCardContact] = useState<SavedContact | null>(null);
  const [cardSaveMessage, setCardSaveMessage] = useState<string | null>(null);

  async function openQrScanner() {
    setMode('qr');
    setScannedValue(null);

    if (!permission?.granted) {
      await requestPermission();
    }
  }

  async function openBusinessCardScanner() {
    setMode('businessCard');
    setCapturedCardUri(null);
    setCaptureError(null);
    setExtractedCard(null);
    setSavedCardContact(null);
    setCardSaveMessage(null);

    if (!permission?.granted) {
      await requestPermission();
    }
  }

  async function captureBusinessCard() {
    setCaptureError(null);

    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });

      if (!photo?.uri) {
        throw new Error('Unable to capture photo.');
      }

      setCapturedCardUri(photo.uri);
      setExtractedCard(null);
      setSavedCardContact(null);
      setCardSaveMessage(null);
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Unable to capture photo.');
    }
  }

  async function extractCapturedBusinessCard() {
    if (!capturedCardUri) {
      return;
    }

    setExtractingCard(true);
    setCaptureError(null);
    setCardSaveMessage(null);

    try {
      // TODO: Replace this beta-disabled call with real OCR provider extraction.
      setExtractedCard(await extractBusinessCardFromImage(capturedCardUri));
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Unable to extract contact.');
    } finally {
      setExtractingCard(false);
    }
  }

  function retakeBusinessCard() {
    setCapturedCardUri(null);
    setExtractedCard(null);
    setSavedCardContact(null);
    setCaptureError(null);
    setCardSaveMessage(null);
  }

  async function saveExtractedBusinessCard() {
    if (!extractedCard) {
      return;
    }

    setSavingCardContact(true);
    setCaptureError(null);
    setCardSaveMessage(null);

    try {
      const contact =
        user && !isDevelopmentAuthBypass
          ? await createContact({
              userId: user.id,
              name: extractedCard.name,
              headline: [extractedCard.title, extractedCard.company].filter(Boolean).join(' at '),
              email: extractedCard.emails[0],
              phone: extractedCard.phones[0],
              location: extractedCard.address,
              notes: 'Source: business_card_scan',
              tags: ['business_card_scan'],
            })
          : createLocalBusinessCardContact(extractedCard);

      setSavedCardContact(contact);
      setCardSaveMessage(`Saved ${contact.snapshot.name}.`);
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Unable to save contact.');
    } finally {
      setSavingCardContact(false);
    }
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    setScannedValue((current) => {
      if (current) {
        return current;
      }

      const publicSlug = getCardIqPublicSlug(result.data);

      if (publicSlug) {
        navigation.navigate('PublicProfile', { publicSlug, devPreview: false });
      }

      return result.data;
    });
  }

  if (mode === 'qr') {
    return (
      <Screen title="Scan QR" subtitle="Point your camera at a CardIQ QR code.">
        <View style={styles.scannerCard}>
          {permission?.granted ? (
            <CameraView
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scannedValue ? undefined : handleBarcodeScanned}
              style={styles.camera}
            />
          ) : (
            <View style={styles.permissionState}>
              <Text style={styles.emptyTitle}>Camera permission needed</Text>
              <Text style={styles.emptyCopy}>Allow camera access to scan QR codes.</Text>
              <Pressable onPress={requestPermission} style={({ pressed }) => [styles.permissionButton, pressed ? styles.pressed : null]}>
                <Text style={styles.permissionButtonText}>Allow Camera</Text>
              </Pressable>
            </View>
          )}
        </View>

        {scannedValue ? (
          <View style={styles.resultCard}>
            <Text style={styles.sectionTitle}>Scanned value</Text>
            <Text style={styles.resultText}>{scannedValue}</Text>
            <Pressable onPress={() => setScannedValue(null)} style={({ pressed }) => [styles.permissionButton, pressed ? styles.pressed : null]}>
              <Text style={styles.permissionButtonText}>Scan Again</Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable onPress={() => setMode('menu')} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </Screen>
    );
  }

  if (mode === 'businessCard') {
    return (
      <Screen title="Scan Card" subtitle="Capture a physical business card for later processing.">
        <View style={styles.scannerCard}>
          {capturedCardUri ? (
            <Image source={{ uri: capturedCardUri }} style={styles.previewImage} />
          ) : permission?.granted ? (
            <CameraView ref={cameraRef} style={styles.camera} />
          ) : (
            <View style={styles.permissionState}>
              <Text style={styles.emptyTitle}>Camera permission needed</Text>
              <Text style={styles.emptyCopy}>Allow camera access to capture business cards.</Text>
              <Pressable onPress={requestPermission} style={({ pressed }) => [styles.permissionButton, pressed ? styles.pressed : null]}>
                <Text style={styles.permissionButtonText}>Allow Camera</Text>
              </Pressable>
            </View>
          )}
        </View>

        {extractingCard ? <Text style={styles.loadingText}>Checking OCR availability...</Text> : null}
        {captureError ? <Text style={styles.errorText}>{captureError}</Text> : null}

        {extractedCard ? (
          <View style={styles.resultCard}>
            <Text style={styles.sectionTitle}>Review contact</Text>
            <ReviewRow label="Name" value={extractedCard.name} />
            <ReviewRow label="Title" value={extractedCard.title} />
            <ReviewRow label="Company" value={extractedCard.company} />
            <ReviewRow label="Email" value={extractedCard.emails[0] ?? ''} />
            <ReviewRow label="Phone" value={extractedCard.phones[0] ?? ''} />
            <ReviewRow label="Website" value={extractedCard.websites[0] ?? ''} />
          </View>
        ) : null}

        {cardSaveMessage ? <Text style={styles.successText}>{cardSaveMessage}</Text> : null}

        {capturedCardUri ? (
          <View style={styles.captureActions}>
            <Pressable onPress={retakeBusinessCard} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </Pressable>
            <Pressable
              disabled={extractingCard}
              onPress={extractedCard ? saveExtractedBusinessCard : extractCapturedBusinessCard}
              style={({ pressed }) => [styles.permissionButton, pressed ? styles.pressed : null, extractingCard || savingCardContact ? styles.disabled : null]}
            >
              <Text style={styles.permissionButtonText}>{savingCardContact ? 'Saving...' : extractedCard ? 'Save Contact' : 'Use Photo'}</Text>
            </Pressable>
          </View>
        ) : permission?.granted ? (
          <Pressable onPress={captureBusinessCard} style={({ pressed }) => [styles.permissionButton, pressed ? styles.pressed : null]}>
            <Text style={styles.permissionButtonText}>Capture Card</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={() => setMode('menu')} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title="Scan" subtitle="Capture a new connection quickly when scanning is enabled.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <Text style={styles.kicker}>QUICK CAPTURE</Text>
          <Text style={styles.heroTitle}>Turn introductions into saved contacts.</Text>
          <Text style={styles.heroCopy}>
            Choose how you want to capture the next person you meet.
          </Text>
        </View>

        <View style={styles.actions}>
          <ActionCard
            icon="QR"
            title="Scan QR Code"
            copy="Open a CardIQ profile instantly from a digital card."
            onPress={openQrScanner}
            primary
          />
          <ActionCard
            icon="ID"
            title="Scan Physical Business Card"
            copy="Capture printed card details for review before saving."
            onPress={openBusinessCardScanner}
          />
        </View>

        <View style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent scans</Text>
            <Text style={styles.sectionCount}>0</Text>
          </View>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>+</Text>
            </View>
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptyCopy}>
              Your latest QR and card captures will appear here.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function createLocalBusinessCardContact(card: ExtractedBusinessCard): SavedContact {
  const now = new Date().toISOString();

  return {
    id: `local-business-card-${now}`,
    userId: 'development-demo-user',
    snapshot: {
      id: `snapshot-business-card-${now}`,
      profileId: `business-card-${now}`,
      type: 'professional',
      name: card.name,
      headline: [card.title, card.company].filter(Boolean).join(' at '),
      bio: '',
      email: card.emails[0],
      phone: card.phones[0],
      location: card.address,
      links: card.websites.map((website, index) => ({
        id: `local-business-card-link-${index}`,
        profileId: `business-card-${now}`,
        label: 'Website',
        url: website,
        order: index,
        createdAt: now,
        updatedAt: now,
      })),
      capturedAt: now,
    },
    notes: 'Source: business_card_scan',
    tags: ['business_card_scan'],
    createdAt: now,
    updatedAt: now,
  };
}

function ActionCard({
  icon,
  onPress,
  title,
  copy,
  primary,
}: {
  icon: string;
  onPress?: () => void;
  title: string;
  copy: string;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        primary ? styles.primaryActionCard : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={[styles.actionIcon, primary ? styles.primaryActionIcon : null]}>
        <Text style={[styles.actionIconText, primary ? styles.primaryActionIconText : null]}>
          {icon}
        </Text>
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionTitle, primary ? styles.primaryActionTitle : null]}>
          {title}
        </Text>
        <Text style={[styles.actionCopy, primary ? styles.primaryActionCopy : null]}>
          {copy}
        </Text>
      </View>
      <Text style={[styles.chevron, primary ? styles.primaryChevron : null]}>{'>'}</Text>
    </Pressable>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.reviewValue}>{value || '-'}</Text>
    </View>
  );
}

function getCardIqPublicSlug(value: string): string | null {
  try {
    const url = new URL(value);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (url.hostname === 'cardiq.app' && pathParts[0] === 'u' && pathParts[1]) {
      return decodeURIComponent(pathParts[1]);
    }
  } catch {
    return null;
  }

  return null;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 4,
  },
  heroGlow: {
    backgroundColor: colors.primarySoft,
    borderRadius: 96,
    height: 160,
    position: 'absolute',
    right: -56,
    top: -72,
    width: 160,
  },
  kicker: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
  },
  heroTitle: {
    color: colors.text,
    fontSize: typography.sizes.heading,
    fontWeight: '800',
    lineHeight: 30,
    marginTop: spacing.md,
  },
  heroCopy: {
    color: colors.mutedText,
    fontSize: typography.sizes.body,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.md,
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 112,
    padding: spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  primaryActionCard: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  actionIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 56,
  },
  primaryActionIcon: {
    backgroundColor: colors.surface,
  },
  actionIconText: {
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  primaryActionIconText: {
    color: colors.text,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  primaryActionTitle: {
    color: colors.surface,
  },
  actionCopy: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  primaryActionCopy: {
    color: colors.border,
  },
  chevron: {
    color: colors.mutedText,
    fontSize: typography.sizes.body,
    marginLeft: spacing.sm,
  },
  primaryChevron: {
    color: colors.surface,
  },
  recentCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  recentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sectionCount: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emptyIconText: {
    color: colors.primary,
    fontSize: typography.sizes.heading,
    fontWeight: '800',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  emptyCopy: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  scannerCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    height: 360,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  previewImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  permissionState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  permissionButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  permissionButtonText: {
    color: colors.surface,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  resultText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  captureActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  loadingText: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  successText: {
    color: colors.success,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  reviewRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
  },
  reviewLabel: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reviewValue: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  disabled: {
    opacity: 0.64,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 44,
  },
  backButtonText: {
    color: colors.text,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
});
