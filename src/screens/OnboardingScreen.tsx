import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useOnboarding } from '../contexts';
import { colors, spacing, typography } from '../theme';
import type { ProfileType } from '../types';

type ContactMethod = 'email' | 'phone';
type OnboardingScreenProps = {
  onClose?: () => void;
};

const profileTypes: { label: string; value: ProfileType }[] = [
  { label: 'Personal', value: 'personal' },
  { label: 'Professional', value: 'professional' },
  { label: 'Business', value: 'business' },
];

export function OnboardingScreen({ onClose }: OnboardingScreenProps) {
  const { completeOnboarding } = useOnboarding();
  const [stepIndex, setStepIndex] = useState(0);
  const [profileType, setProfileType] = useState<ProfileType>('professional');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');
  const [contactValue, setContactValue] = useState('');
  const isLastStep = stepIndex === 2;

  const step = useMemo(() => {
    if (stepIndex === 1) {
      return {
        title: 'Choose your main profile type',
        body: 'Start with the card you expect to share most often.',
      };
    }

    if (stepIndex === 2) {
      return {
        title: 'Add your first contact method',
        body: 'Keep one reliable way for people to reach you after an introduction.',
      };
    }

    return {
      title: 'Welcome to CardIQ',
      body: 'Set up the basics now. You can refine everything later.',
    };
  }, [stepIndex]);

  async function finishOnboarding() {
    await completeOnboarding();
    onClose?.();
  }

  function handleContinue() {
    if (isLastStep) {
      void finishOnboarding();
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function handleSkip() {
    void finishOnboarding();
  }

  return (
    <Screen title="Onboarding" subtitle="A quick local setup preview for first-time users.">
      <View style={styles.content}>
        <View style={styles.progressRow}>
          {[0, 1, 2].map((step) => (
            <View key={step} style={[styles.progressDot, step <= stepIndex ? styles.activeProgressDot : null]} />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.stepCount}>Step {stepIndex + 1} of 3</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          {stepIndex === 1 ? (
            <View style={styles.optionList}>
              {profileTypes.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setProfileType(option.value)}
                  style={({ pressed }) => [
                    styles.option,
                    profileType === option.value ? styles.activeOption : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={[styles.optionText, profileType === option.value ? styles.activeOptionText : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {stepIndex === 2 ? (
            <View>
              <View style={styles.segmented}>
                {(['email', 'phone'] as ContactMethod[]).map((method) => (
                  <Pressable
                    key={method}
                    onPress={() => setContactMethod(method)}
                    style={({ pressed }) => [
                      styles.segment,
                      contactMethod === method ? styles.activeSegment : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={[styles.segmentText, contactMethod === method ? styles.activeSegmentText : null]}>
                      {method === 'email' ? 'Email' : 'Phone'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={contactValue}
                onChangeText={setContactValue}
                placeholder={contactMethod === 'email' ? 'you@example.com' : '+1 555 0100'}
                placeholderTextColor={colors.mutedText}
                style={styles.input}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={handleSkip} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
            <Text style={styles.secondaryButtonText}>Skip</Text>
          </Pressable>
          <Pressable onPress={handleContinue} style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}>
            <Text style={styles.primaryButtonText}>{isLastStep ? 'Finish' : 'Continue'}</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  progressRow: {
    flexDirection: 'row',
  },
  progressDot: {
    backgroundColor: colors.border,
    borderRadius: 3,
    flex: 1,
    height: 6,
    marginRight: spacing.sm,
  },
  activeProgressDot: {
    backgroundColor: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
  },
  stepCount: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.heading,
    fontWeight: '800',
  },
  body: {
    color: colors.mutedText,
    fontSize: typography.sizes.body,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  optionList: {
    marginTop: spacing.lg,
  },
  option: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  activeOption: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  activeOptionText: {
    color: colors.primary,
  },
  segmented: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  segment: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: spacing.md,
  },
  activeSegment: {
    backgroundColor: colors.text,
  },
  segmentText: {
    color: colors.mutedText,
    fontSize: typography.sizes.small,
    fontWeight: '800',
  },
  activeSegmentText: {
    color: colors.surface,
  },
  input: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '600',
    marginTop: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  actions: {
    flexDirection: 'row',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    minHeight: 52,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
