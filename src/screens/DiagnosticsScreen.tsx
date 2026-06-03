import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import {
  getDiagnosticsSnapshot,
  type DiagnosticCheck,
  type DiagnosticStatus,
  type DiagnosticsSnapshot,
} from '../services/diagnosticsService';
import { colors, spacing, typography } from '../theme';

const checklistStorageKey = 'cardiq_beta_smoke_checklist';
const checklistItems = [
  'Auth sign-in works',
  'Session persists after restart',
  'Onboarding persists',
  'Create profile',
  'Edit profile',
  'Toggle public/private',
  'Hide/show profile link',
  'Public preview matches expected',
  'Avatar upload works',
  'Public QR opens public profile',
  'Private QR shows unavailable',
  'Save public profile as contact',
  'Contact links persist',
  'Create lead',
  'Update lead status',
  'OCR shows coming soon',
] as const;

type ChecklistItem = (typeof checklistItems)[number];
type ChecklistState = Partial<Record<ChecklistItem, DiagnosticStatus>>;
const checklistStatuses: DiagnosticStatus[] = ['PASS', 'FAIL', 'UNKNOWN'];

export function DiagnosticsScreen() {
  const [snapshot, setSnapshot] = useState<DiagnosticsSnapshot | null>(null);
  const [checklist, setChecklist] = useState<ChecklistState>({});
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!__DEV__) {
      return;
    }

    setLoading(true);
    try {
      setSnapshot(await getDiagnosticsSnapshot());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    void loadChecklist();
  }, []);

  async function loadChecklist() {
    if (!__DEV__) {
      return;
    }

    try {
      const value = await SecureStore.getItemAsync(checklistStorageKey);
      const parsed = value ? JSON.parse(value) : {};
      setChecklist(isChecklistState(parsed) ? parsed : {});
    } catch {
      setChecklist({});
    }
  }

  async function setChecklistStatus(item: ChecklistItem, status: DiagnosticStatus) {
    const next = { ...checklist, [item]: status };
    setChecklist(next);

    try {
      await SecureStore.setItemAsync(checklistStorageKey, JSON.stringify(next));
    } catch {
      // Local persistence is best-effort for dev diagnostics.
    }
  }

  if (!__DEV__) {
    return (
      <Screen title="Diagnostics" subtitle="Developer diagnostics are unavailable in this build.">
        <StatusRow label="Visibility" status="FAIL" />
      </Screen>
    );
  }

  return (
    <Screen title="Diagnostics" subtitle="Backend health for development builds.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <InfoRow label="App version" value={snapshot?.appVersion ?? 'UNKNOWN'} />
          <InfoRow label="Environment" value={snapshot?.environment ?? 'UNKNOWN'} />
          <StatusRow label="Supabase URL configured" status={snapshot?.supabaseUrlConfigured ?? 'UNKNOWN'} />
          <InfoRow label="Supabase URL" value={snapshot?.supabaseUrl ?? 'UNKNOWN'} />
        </View>

        <View style={styles.panel}>
          {(snapshot?.checks ?? []).map((check) => (
            <StatusRow key={check.label} label={check.label} status={check.status} value={check.value} />
          ))}
          {!snapshot ? <StatusRow label="Diagnostics loaded" status="UNKNOWN" value={loading ? 'Loading' : undefined} /> : null}
        </View>

        <Text style={styles.sectionTitle}>Beta Smoke Checklist</Text>
        <View style={styles.panel}>
          {checklistItems.map((item) => (
            <ChecklistRow
              key={item}
              label={item}
              status={checklist[item] ?? 'UNKNOWN'}
              onChange={(status) => void setChecklistStatus(item, status)}
            />
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]} onPress={refresh}>
          <Text style={styles.buttonText}>{loading ? 'Running...' : 'Run Checks'}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function StatusRow({ label, status, value }: DiagnosticCheck) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.statusWrap}>
        <Text style={[styles.status, getStatusStyle(status)]}>{status}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </View>
    </View>
  );
}

function ChecklistRow({
  label,
  onChange,
  status,
}: {
  label: string;
  onChange: (status: DiagnosticStatus) => void;
  status: DiagnosticStatus;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.checklistLabel}>{label}</Text>
      <View style={styles.segment}>
        {checklistStatuses.map((option) => (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={({ pressed }) => [
              styles.segmentButton,
              status === option ? styles.segmentButtonActive : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={[styles.segmentText, status === option ? getStatusStyle(option) : null]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function isChecklistState(value: unknown): value is ChecklistState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.values(value).every((status) =>
    checklistStatuses.includes(status as DiagnosticStatus),
  );
}

function getStatusStyle(status: DiagnosticStatus) {
  if (status === 'PASS') {
    return styles.pass;
  }
  if (status === 'FAIL') {
    return styles.fail;
  }
  return styles.unknown;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: typography.sizes.small,
    marginTop: spacing.xs,
  },
  statusWrap: {
    marginTop: spacing.xs,
  },
  status: {
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  checklistLabel: {
    color: colors.text,
    fontSize: typography.sizes.small,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
  },
  segmentButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    marginRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  segmentButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  segmentText: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
  },
  pass: {
    color: colors.success,
  },
  fail: {
    color: colors.danger,
  },
  unknown: {
    color: colors.warning,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: spacing.md,
  },
  buttonText: {
    color: colors.surface,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
