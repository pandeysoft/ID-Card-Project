import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts';
import { signInWithEmail, signInWithGoogle } from '../services/authService';
import { colors, spacing, typography } from '../theme';

type AuthMethod = 'email' | 'google' | 'demo';

export function AuthScreen() {
  const { enableDevelopmentAuthBypass } = useAuth();
  const [email, setEmail] = useState('');
  const [loadingMethod, setLoadingMethod] = useState<AuthMethod | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const loading = loadingMethod !== null;

  async function handleSignIn() {
    setLoadingMethod('email');
    setErrorMessage(null);
    setSent(false);

    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send sign-in link.',
      );
    } finally {
      setLoadingMethod(null);
    }
  }

  async function handleGoogleSignIn() {
    setLoadingMethod('google');
    setErrorMessage(null);
    setSent(false);

    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to start Google sign-in.',
      );
    } finally {
      setLoadingMethod(null);
    }
  }

  function handleDemoSignIn() {
    setLoadingMethod('demo');
    setErrorMessage(null);
    setSent(false);
    enableDevelopmentAuthBypass();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.card}>
          <Text style={styles.title}>CardIQ</Text>
          <Text style={styles.subtitle}>
            Sign in securely to manage your digital identity and shared profiles.
          </Text>

          <Pressable
            disabled={loading}
            onPress={handleGoogleSignIn}
            style={({ pressed }) => [
              styles.googleButton,
              pressed ? styles.pressed : null,
              loading ? styles.disabledButton : null,
            ]}
          >
            <Text style={styles.googleButtonText}>
              {loadingMethod === 'google' ? 'Opening Google...' : 'Continue with Google'}
            </Text>
          </Pressable>

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!loading}
            inputMode="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedText}
            style={styles.input}
            value={email}
          />

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          {sent ? (
            <Text style={styles.success}>
              Check your inbox and spam folder. Supabase emails can take a few minutes.
            </Text>
          ) : null}

          {__DEV__ ? (
            <>
              <Text style={styles.debugNote}>
                For local testing, check Supabase Dashboard -&gt; Authentication -&gt; Logs.
              </Text>
              <Pressable
                disabled={loading}
                onPress={handleDemoSignIn}
                style={({ pressed }) => [
                  styles.demoButton,
                  pressed ? styles.pressed : null,
                  loading ? styles.disabledButton : null,
                ]}
              >
                <Text style={styles.demoButtonText}>
                  {loadingMethod === 'demo' ? 'Continuing...' : 'Continue as Demo User'}
                </Text>
              </Pressable>
            </>
          ) : null}

          <Pressable
            disabled={loading}
            onPress={handleSignIn}
            style={({ pressed }) => [
              styles.button,
              pressed ? styles.pressed : null,
              loading ? styles.disabledButton : null,
            ]}
          >
            <Text style={styles.buttonText}>
              {loadingMethod === 'email' ? 'Sending...' : 'Continue with Email'}
            </Text>
          </Pressable>

          <Text style={styles.note}>
            We use passwordless email sign-in. Never share links or codes with anyone.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboard: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 4,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.sizes.body,
    lineHeight: 23,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.sizes.body,
    marginTop: spacing.lg,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 52,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 52,
  },
  demoButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 48,
  },
  disabledButton: {
    opacity: 0.72,
  },
  buttonText: {
    color: colors.surface,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  googleButtonText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  demoButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: '800',
  },
  error: {
    color: colors.danger,
    fontSize: typography.sizes.small,
    marginTop: spacing.sm,
  },
  success: {
    color: colors.success,
    fontSize: typography.sizes.small,
    marginTop: spacing.sm,
  },
  debugNote: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  note: {
    color: colors.mutedText,
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
