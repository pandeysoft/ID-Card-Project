import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { mockUser } from '../lib/mockData';
import { colors, spacing, typography } from '../theme';

const sections = [
  {
    title: 'Account',
    rows: ['Personal information', 'Email and phone', 'Subscription billing'],
  },
  {
    title: 'Profiles',
    rows: ['Profile visibility', 'Default sharing profile', 'Link management'],
  },
  {
    title: 'Privacy & Sharing',
    rows: ['Share permissions', 'Contact save consent', 'Blocked contacts'],
  },
  {
    title: 'Business Tools',
    rows: ['Team workspace', 'Lead capture fields', 'Export contacts'],
  },
  {
    title: 'App Preferences',
    rows: ['Notifications', 'Appearance', 'Data and storage'],
  },
];

export function SettingsScreen() {
  return (
    <Screen title="Settings" subtitle="Account, plan, privacy, and app preferences will live here.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.planCard}>
          <View style={styles.cardGlow} />
          <View style={styles.planTop}>
            <View>
              <Text style={styles.kicker}>CURRENT PLAN</Text>
              <Text style={styles.planName}>{formatPlan(mockUser.accountPlan)}</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
          <Text style={styles.userName}>{mockUser.displayName}</Text>
          <Text style={styles.userEmail}>{mockUser.email}</Text>
          <View style={styles.planMeta}>
            <Text style={styles.planMetaText}>{formatRole(mockUser.role)}</Text>
            <Text style={styles.planMetaDivider}>·</Text>
            <Text style={styles.planMetaText}>CardIQ workspace</Text>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row) => (
                <SettingsRow key={row} label={row} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function SettingsRow({ label }: { label: string }) {
  return (
    <Pressable onPress={() => undefined} style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{label[0]}</Text>
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
  );
}

function formatPlan(plan: string) {
  return `${plan[0].toUpperCase()}${plan.slice(1)} Plan`;
}

function formatRole(role: string) {
  return `${role[0].toUpperCase()}${role.slice(1)}`;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  planCard: {
    backgroundColor: colors.text,
    borderColor: colors.text,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    padding: spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
    elevation: 5,
  },
  cardGlow: {
    backgroundColor: colors.primary,
    borderRadius: 110,
    height: 180,
    opacity: 0.35,
    position: 'absolute',
    right: -64,
    top: -84,
    width: 180,
  },
  planTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kicker: {
    color: colors.border,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
  },
  planName: {
    color: colors.surface,
    fontSize: typography.sizes.heading,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusDot: {
    backgroundColor: colors.success,
    borderRadius: 3,
    height: 6,
    marginRight: spacing.xs,
    width: 6,
  },
  statusText: {
    color: colors.text,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
  },
  userName: {
    color: colors.surface,
    fontSize: typography.sizes.body,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  userEmail: {
    color: colors.border,
    fontSize: typography.sizes.small,
    marginTop: spacing.xs,
  },
  planMeta: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  planMetaText: {
    color: colors.border,
    fontSize: typography.sizes.caption,
    fontWeight: '700',
  },
  planMetaDivider: {
    color: colors.border,
    marginHorizontal: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.72,
  },
  rowIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 36,
  },
  rowIconText: {
    color: colors.primary,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  rowLabel: {
    color: colors.text,
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: '700',
  },
  chevron: {
    color: colors.mutedText,
    fontSize: typography.sizes.body,
    marginLeft: spacing.sm,
  },
});
