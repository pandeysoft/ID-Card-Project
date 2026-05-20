import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useEditProfileNavigation } from '../navigation/EditProfileNavigation';
import { colors, spacing, typography } from '../theme';

type ScanMode = 'menu' | 'qr';

export function ScanScreen() {
  const { openPublicProfilePreview } = useEditProfileNavigation();
  const [mode, setMode] = useState<ScanMode>('menu');
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedValue, setScannedValue] = useState<string | null>(null);

  async function openQrScanner() {
    setMode('qr');
    setScannedValue(null);

    if (!permission?.granted) {
      await requestPermission();
    }
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    setScannedValue((current) => {
      if (current) {
        return current;
      }

      const publicSlug = getCardIqPublicSlug(result.data);

      if (publicSlug) {
        openPublicProfilePreview(publicSlug);
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
