import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlan } from '../context/PlanContext';
import { RECIPE_BY_ID } from '../data/recipes';
import { mealActiveMinutes, mealTotalMinutes } from '../engine/planner';
import { DayPlan } from '../types';
import { Button, Card } from '../ui/components';
import { colors, radius, spacing } from '../ui/theme';

function dayLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (diff === 0) return `Today · ${date}`;
  if (diff === 1) return `Tomorrow · ${date}`;
  return `${weekday} · ${date}`;
}

export function PlanScreen({ onOpenDay }: { onOpenDay: (date: string) => void }) {
  const { plan, generateWeek, regenerateDay, toggleLock, toggleSkip, swapDays } = usePlan();
  const [swapFrom, setSwapFrom] = useState<string | null>(null);

  function handleSwapPress(date: string) {
    if (swapFrom === null) {
      setSwapFrom(date);
    } else if (swapFrom === date) {
      setSwapFrom(null);
    } else {
      swapDays(swapFrom, date);
      setSwapFrom(null);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(20) }}
    >
      <Text style={styles.h1}>This Week's Dinners</Text>
      <Text style={styles.sub}>
        Tap a day for the step-by-step cook plan. Lock 🔒 the ones you love so they stick.
      </Text>

      <View style={{ marginVertical: spacing(3) }}>
        <Button label="🎲 Regenerate whole week" onPress={generateWeek} variant="secondary" />
      </View>

      {swapFrom && (
        <View style={styles.swapBanner}>
          <Text style={styles.swapText}>Swapping — pick another day to trade with</Text>
          <Pressable onPress={() => setSwapFrom(null)}>
            <Text style={styles.swapCancel}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {plan.map((day) => (
        <DayCard
          key={day.date}
          day={day}
          label={dayLabel(day.date)}
          swapActive={swapFrom === day.date}
          onOpen={() => onOpenDay(day.date)}
          onRegenerate={() => regenerateDay(day.date)}
          onLock={() => toggleLock(day.date)}
          onSkip={() => toggleSkip(day.date)}
          onSwap={() => handleSwapPress(day.date)}
        />
      ))}
    </ScrollView>
  );
}

function DayCard({
  day,
  label,
  swapActive,
  onOpen,
  onRegenerate,
  onLock,
  onSkip,
  onSwap,
}: {
  day: DayPlan;
  label: string;
  swapActive: boolean;
  onOpen: () => void;
  onRegenerate: () => void;
  onLock: () => void;
  onSkip: () => void;
  onSwap: () => void;
}) {
  const main = RECIPE_BY_ID[day.mainId];
  const total = mealTotalMinutes(day.mainId, day.sideIds);
  const active = mealActiveMinutes(day.mainId, day.sideIds);

  return (
    <Card
      style={{
        marginBottom: spacing(3),
        borderColor: swapActive ? colors.primary : day.locked ? colors.locked : colors.border,
        borderWidth: swapActive || day.locked ? 2 : 1,
        opacity: day.skipped ? 0.55 : 1,
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.dayLabel}>{label}</Text>
        {day.locked && <Text style={styles.lockBadge}>🔒 Locked</Text>}
      </View>

      {day.skipped || !main ? (
        <View style={{ paddingVertical: spacing(2) }}>
          <Text style={styles.skippedText}>🍽️ No cooking planned</Text>
        </View>
      ) : (
        <Pressable onPress={onOpen}>
          <View style={styles.mainRow}>
            <Text style={styles.mainEmoji}>{main.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.mainTitle}>{main.title}</Text>
              <Text style={styles.sides}>
                {day.sideIds.map((id) => RECIPE_BY_ID[id]?.title).filter(Boolean).join(' · ')}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaPill}>⏱️ {total} min total</Text>
                <Text style={styles.metaPillGhost}>🙌 {active} min hands-on</Text>
              </View>
            </View>
          </View>
        </Pressable>
      )}

      <View style={styles.actions}>
        <Button label={day.locked ? '🔓 Unlock' : '🔒 Lock'} onPress={onLock} variant="ghost" small />
        {!day.skipped && !day.locked && (
          <Button label="🎲 New" onPress={onRegenerate} variant="ghost" small />
        )}
        {!day.locked && (
          <Button label={swapActive ? '↔️ Picking…' : '↔️ Swap'} onPress={onSwap} variant="ghost" small />
        )}
        <Button label={day.skipped ? '↩️ Add meal' : '🚫 Skip'} onPress={onSkip} variant="ghost" small />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1), lineHeight: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayLabel: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  lockBadge: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  mainRow: { flexDirection: 'row', marginTop: spacing(2), alignItems: 'flex-start' },
  mainEmoji: { fontSize: 40, marginRight: spacing(3) },
  mainTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sides: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1) },
  metaRow: { flexDirection: 'row', marginTop: spacing(2), flexWrap: 'wrap' },
  metaPill: {
    backgroundColor: colors.primary,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 3,
    paddingHorizontal: spacing(2),
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginRight: spacing(2),
  },
  metaPillGhost: {
    backgroundColor: colors.chipBg,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 3,
    paddingHorizontal: spacing(2),
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginTop: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing(3),
  },
  skippedText: { fontSize: 15, color: colors.textMuted, fontStyle: 'italic' },
  swapBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FDECE6',
    borderRadius: radius.sm,
    padding: spacing(3),
    marginBottom: spacing(3),
  },
  swapText: { color: colors.primaryDark, fontWeight: '600', fontSize: 13 },
  swapCancel: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
