import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Palette, radius, spacing } from './theme';
import { useTheme } from './ThemeContext';
import { Icon, IconName } from './Icon';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  small,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  small?: boolean;
  icon?: IconName;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.accent
          : 'transparent';
  const fg =
    variant === 'ghost'
      ? colors.primary
      : variant === 'primary'
        ? colors.onPrimary
        : variant === 'secondary'
          ? colors.onAccent
          : '#fff';
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
      {icon && <Icon name={icon} size={small ? 15 : 17} color={fg} strokeWidth={2} />}
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, active && { color: colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

export function Loader() {
  const { colors } = useTheme();
  return (
    <View style={[styles0.loader, { backgroundColor: colors.bg }]}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

const styles0 = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
      flexDirection: 'row',
      gap: spacing(2),
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
  });
