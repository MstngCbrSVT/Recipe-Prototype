import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from './theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  small,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  small?: boolean;
}) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.accent
          : 'transparent';
  const fg = variant === 'ghost' ? colors.primary : '#fff';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed ? 0.8 : 1 },
        small && styles.buttonSmall,
        variant === 'ghost' && styles.buttonGhost,
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }, small && { fontSize: 13 }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Loader() {
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing(4),
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: { paddingVertical: spacing(2), paddingHorizontal: spacing(3) },
  buttonGhost: { borderWidth: 1, borderColor: colors.primary },
  buttonText: { fontWeight: '700', fontSize: 15 },
  chip: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: 999,
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing(2),
    marginBottom: spacing(2),
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
