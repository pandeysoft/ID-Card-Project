import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

type PlaceholderPanelProps = {
  title: string;
  body: string;
};

export function PlaceholderPanel({ title, body }: PlaceholderPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.mark} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.xl,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 2,
  },
  mark: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.heading,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.mutedText,
    fontSize: typography.sizes.body,
    lineHeight: 24,
  },
});
