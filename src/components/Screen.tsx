import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function Screen({ title, subtitle, children }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.sizes.body,
    lineHeight: 23,
    marginBottom: spacing.lg,
  },
});
