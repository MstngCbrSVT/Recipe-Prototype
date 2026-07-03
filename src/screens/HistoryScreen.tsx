import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlan } from '../context/PlanContext';
import { recipeById } from '../data/catalog';
import { HistoryEntry, Rating } from '../types';
import { Card } from '../ui/components';
import { Icon } from '../ui/Icon';
import { Palette, spacing } from '../ui/theme';
import { useTheme } from '../ui/ThemeContext';

function dateLabel(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function HistoryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { history, rateMeal } = usePlan();

  const entries = useMemo(
    () => [...history].sort((a, b) => b.date.localeCompare(a.date)),
    [history],
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(20) }}
    >
      <Text style={styles.h1}>Cook History</Text>
      <Text style={styles.sub}>
        Rate what you made — loved meals come back around sooner, disliked ones stay away.
      </Text>

      {entries.length === 0 ? (
        <Card style={{ marginTop: spacing(4), alignItems: 'center' }}>
          <Icon name="clock" size={28} color={colors.textMuted} strokeWidth={1.8} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySub}>
            Meals move here after their day passes. Tap “Made it” on today's meal in the Plan to log
            it now.
          </Text>
        </Card>
      ) : (
        entries.map((e) => <HistoryRow key={e.date} entry={e} onRate={rateMeal} styles={styles} colors={colors} />)
      )}
    </ScrollView>
  );
}

function HistoryRow({
  entry,
  onRate,
  styles,
  colors,
}: {
  entry: HistoryEntry;
  onRate: (date: string, rating: Rating) => void;
  styles: Styles;
  colors: Palette;
}) {
  const sides = entry.sideIds.map((id) => recipeById(id)?.title).filter(Boolean).join(' · ');
  const up = entry.rating === 'up';
  const down = entry.rating === 'down';
  return (
    <Card style={{ marginTop: spacing(3), flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.date}>{dateLabel(entry.date)}</Text>
        <Text style={styles.title}>{entry.title}</Text>
        {sides ? <Text style={styles.sides}>{sides}</Text> : null}
      </View>
      <Pressable
        onPress={() => onRate(entry.date, 'up')}
        style={[styles.rateBtn, up && { backgroundColor: colors.accent, borderColor: colors.accent }]}
        hitSlop={6}
      >
        <Icon name="thumbUp" size={18} color={up ? colors.onAccent : colors.textMuted} strokeWidth={1.9} />
      </Pressable>
      <Pressable
        onPress={() => onRate(entry.date, 'down')}
        style={[styles.rateBtn, down && { backgroundColor: colors.danger, borderColor: colors.danger }]}
        hitSlop={6}
      >
        <Icon name="thumbDown" size={18} color={down ? '#fff' : colors.textMuted} strokeWidth={1.9} />
      </Pressable>
    </Card>
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    h1: { fontSize: 26, fontWeight: '800', color: colors.text },
    sub: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1), lineHeight: 20 },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: spacing(2) },
    emptySub: { fontSize: 13, color: colors.textMuted, marginTop: spacing(1), textAlign: 'center', lineHeight: 19 },
    date: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
    title: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 1 },
    sides: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
    rateBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing(2),
    },
  });
