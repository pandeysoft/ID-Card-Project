import QRCode from 'react-native-qrcode-svg';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';

type ProfileQrCodeProps = {
  value: string;
};

export function ProfileQrCode({ value }: ProfileQrCodeProps) {
  return (
    <View style={styles.frame}>
      <QRCode
        value={value}
        size={184}
        color={colors.text}
        backgroundColor={colors.surface}
        quietZone={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    padding: spacing.md,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
});
