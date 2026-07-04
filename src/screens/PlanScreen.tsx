import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlan } from '../context/PlanContext';
import { recipeById } from '../data/catalog';
import { mealActiveMinutes, mealTotalMinutes } from '../engine/planner';
import { canMakeLeftovers, dependentsOf } from '../engine/leftovers';
import { todayISO } from '../engine/history';
import { computeShared, Thread } from '../engine/sharedIngredients';
import { DayPlan, ThreadCategory } from '../types';
import { Button, Card } from '../ui/components';
import { Icon, IconName, recipeIconName } from '../ui/Icon';
import { Palette, radius, spacing } from '../ui/theme';
import { useTheme } from '../ui/ThemeContext';

const CAT_ICON: Record<ThreadCategory, IconName> = {
  protein: 'drumstick',
  seafood: 'fish',
  herb: 'leaf',
  dairy: 'cheese',
  specialty: 'pot',
};

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

function shortDay(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' });
}

export function PlanScreen({ onOpenDay }: { onOpenDay: (date: string) => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {
    plan,
    generateWeek,
    regenerateDay,
    toggleLock,
    toggleSkip,
    swapDays,
    makeLeftovers,
    clearLeftovers,
    markMade,
    addDay,
    maxHorizon,
  } = usePlan();
  const [swapFrom, setSwapFrom] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const shared = useMemo(() => computeShared(plan), [plan]);
  const today = todayISO();

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
        Tap a day for the cook plan. Lock what you love, and cook once to eat twice with Make extra.
      </Text>

      <View style={{ marginVertical: spacing(3) }}>
        <Button label="Regenerate whole week" icon="dice" onPress={generateWeek} variant="secondary" />
      </View>

      {shared.threads.length > 0 && (
        <SharedStrip
          shared={shared}
          highlight={highlight}
          onToggle={(k) => setHighlight((cur) => (cur === k ? null : k))}
          styles={styles}
          colors={colors}
        />
      )}

      {swapFrom && (
        <View style={styles.swapBanner}>
          <Text style={styles.swapText}>Swapping — pick another day to trade with</Text>
          <Pressable onPress={() => setSwapFrom(null)}>
            <Text style={styles.swapCancel}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {plan.map((day) => {
        const source = day.leftoverOf ? plan.find((d) => d.date === day.leftoverOf) : undefined;
        const deps = dependentsOf(plan, day.date);
        const dayTags = shared.dayThreads[day.date] ?? [];
        const dimmed = highlight !== null && !dayTags.some((t) => t.key === highlight);
        return (
          <DayCard
            key={day.date}
            day={day}
            source={source}
            dependents={deps}
            dayTags={dayTags}
            dimmed={dimmed}
            canLog={day.date <= today}
            label={dayLabel(day.date)}
            swapActive={swapFrom === day.date}
            canExtend={canMakeLeftovers(plan, day.date)}
            onOpen={() => onOpenDay(source ? source.date : day.date)}
            onRegenerate={() => regenerateDay(day.date)}
            onLock={() => toggleLock(day.date)}
            onSkip={() => toggleSkip(day.date)}
            onSwap={() => handleSwapPress(day.date)}
            onMakeLeftovers={() => makeLeftovers(day.date)}
            onCookFresh={() => clearLeftovers(day.date)}
            onMade={() => markMade(day.date)}
          />
        );
      })}

      {plan.length < maxHorizon ? (
        <Pressable onPress={addDay} style={styles.addDay}>
          <Icon name="plus" size={16} color={colors.primaryDark} strokeWidth={2} />
          <Text style={styles.addDayText}>Add another day ({plan.length} of {maxHorizon})</Text>
        </Pressable>
      ) : (
        <Text style={styles.horizonNote}>Two weeks planned — the max for now.</Text>
      )}
    </ScrollView>
  );
}

function SharedStrip({
  shared,
  highlight,
  onToggle,
  styles,
  colors,
}: {
  shared: ReturnType<typeof computeShared>;
  highlight: string | null;
  onToggle: (key: string) => void;
  styles: Styles;
  colors: Palette;
}) {
  return (
    <Card style={styles.strip}>
      <View style={styles.stripHead}>
        <Icon name="refresh" size={16} color={colors.primary} strokeWidth={2} />
        <Text style={styles.stripTitle}>Shared across your week</Text>
      </View>
      <View style={styles.stripChips}>
        {shared.threads.map((t) => {
          const c = colors.thread[t.category];
          const on = highlight === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => onToggle(t.key)}
              style={[styles.threadChip, { backgroundColor: c.bg, borderColor: on ? c.fg : 'transparent' }]}
            >
              <Icon name={CAT_ICON[t.category]} size={13} color={c.fg} strokeWidth={2} />
              <Text style={[styles.threadChipText, { color: c.fg }]}>
                {t.label} · {t.count} nights
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.savingsRow}>
        <Text style={styles.savingsAmt}>≈ ${shared.savings}</Text>
        <Text style={styles.savingsLbl}>saved · buy once, use it up</Text>
      </View>
      <Text style={styles.stripHint}>Tap an ingredient to see which nights use it.</Text>
    </Card>
  );
}

function DayCard({
  day,
  source,
  dependents,
  dayTags,
  dimmed,
  canLog,
  label,
  swapActive,
  canExtend,
  onOpen,
  onRegenerate,
  onLock,
  onSkip,
  onSwap,
  onMakeLeftovers,
  onCookFresh,
  onMade,
}: {
  day: DayPlan;
  source?: DayPlan;
  dependents: DayPlan[];
  dayTags: Thread[];
  dimmed: boolean;
  canLog: boolean;
  label: string;
  swapActive: boolean;
  canExtend: boolean;
  onOpen: () => void;
  onRegenerate: () => void;
  onLock: () => void;
  onSkip: () => void;
  onSwap: () => void;
  onMakeLeftovers: () => void;
  onCookFresh: () => void;
  onMade: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isLeftover = !!day.leftoverOf;
  const main = isLeftover ? recipeById(source?.mainId ?? '') : recipeById(day.mainId);
  const total = mealTotalMinutes(day.mainId, day.sideIds);
  const active = mealActiveMinutes(day.mainId, day.sideIds);

  return (
    <Card
      style={{
        marginBottom: spacing(3),
        borderColor: swapActive
          ? colors.primary
          : day.locked
            ? colors.locked
            : isLeftover
              ? colors.accent
              : colors.border,
        borderWidth: swapActive || day.locked || isLeftover ? 2 : 1,
        opacity: day.skipped ? 0.55 : dimmed ? 0.4 : 1,
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.dayLabel}>{label}</Text>
        {day.locked && (
          <View style={styles.badgeRow}>
            <Icon name="lock" size={12} color={colors.primaryDark} strokeWidth={2} />
            <Text style={styles.lockBadge}>Locked</Text>
          </View>
        )}
        {day.shopped && !isLeftover && (
          <View style={styles.badgeRow}>
            <Icon name="check" size={12} color={colors.accent} strokeWidth={2.6} />
            <Text style={styles.leftoverBadge}>Shopped</Text>
          </View>
        )}
        {isLeftover && (
          <View style={styles.badgeRow}>
            <Icon name="refresh" size={12} color={colors.accent} strokeWidth={2} />
            <Text style={styles.leftoverBadge}>Leftovers</Text>
          </View>
        )}
        {dependents.length > 0 && (
          <View style={styles.batchRow}>
            <Icon name="pot" size={12} color={colors.accent} strokeWidth={2} />
            <Text style={styles.batchBadge}>Batch · covers {dependents.map((d) => shortDay(d.date)).join(', ')}</Text>
          </View>
        )}
      </View>

      {day.skipped ? (
        <View style={{ paddingVertical: spacing(2) }}>
          <Text style={styles.skippedText}>No cooking planned</Text>
        </View>
      ) : isLeftover ? (
        <Pressable onPress={onOpen}>
          <View style={styles.mainRow}>
            <View style={styles.thumb}>
              <Icon name={main ? recipeIconName(main) : 'refresh'} size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mainTitle}>{main?.title ?? 'Leftovers'}</Text>
              <Text style={styles.sides}>
                Reheat from {source ? shortDay(source.date) : 'earlier'} · no cooking, no shopping
              </Text>
            </View>
          </View>
        </Pressable>
      ) : main ? (
        <Pressable onPress={onOpen}>
          <View style={styles.mainRow}>
            <View style={styles.thumb}>
              <Icon name={recipeIconName(main)} size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mainTitle}>{main.title}</Text>
              <Text style={styles.sides}>
                {day.sideIds.map((id) => recipeById(id)?.title).filter(Boolean).join(' · ')}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaPill}>{total} min total</Text>
                <Text style={styles.metaPillGhost}>{active} min hands-on</Text>
              </View>
              {dayTags.length > 0 && (
                <View style={styles.tagRow}>
                  {dayTags.map((t) => {
                    const c = colors.thread[t.category];
                    return (
                      <View key={t.key} style={[styles.dayTag, { backgroundColor: c.bg }]}>
                        <View style={[styles.tagDot, { backgroundColor: c.fg }]} />
                        <Text style={[styles.dayTagText, { color: c.fg }]}>{t.label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </Pressable>
      ) : (
        <View style={{ paddingVertical: spacing(2) }}>
          <Text style={styles.skippedText}>No recipe available for your filters.</Text>
        </View>
      )}

      <View style={styles.actions}>
        {isLeftover ? (
          <>
            <Button label="Cook fresh instead" icon="chef" onPress={onCookFresh} variant="ghost" small />
            <Button label="Skip" icon="ban" onPress={onSkip} variant="ghost" small />
          </>
        ) : (
          <>
            <Button
              label={day.locked ? 'Unlock' : 'Lock'}
              icon={day.locked ? 'unlock' : 'lock'}
              onPress={onLock}
              variant="ghost"
              small
            />
            {!day.skipped && !day.locked && (
              <Button label="New" icon="dice" onPress={onRegenerate} variant="ghost" small />
            )}
            {canExtend && (
              <Button label="Make extra" icon="pot" onPress={onMakeLeftovers} variant="ghost" small />
            )}
            {!day.locked && (
              <Button
                label={swapActive ? 'Picking…' : 'Swap'}
                icon="swap"
                onPress={onSwap}
                variant="ghost"
                small
              />
            )}
            {canLog && !day.skipped && (
              <Button label="Made it" icon="check" onPress={onMade} variant="ghost" small />
            )}
            <Button
              label={day.skipped ? 'Add meal' : 'Skip'}
              icon={day.skipped ? 'plus' : 'ban'}
              onPress={onSkip}
              variant="ghost"
              small
            />
          </>
        )}
      </View>
    </Card>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    h1: { fontSize: 26, fontWeight: '800', color: colors.text },
    sub: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1), lineHeight: 20 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
    dayLabel: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    batchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '100%', marginTop: 2 },
    lockBadge: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
    leftoverBadge: { fontSize: 12, fontWeight: '700', color: colors.accent },
    batchBadge: { fontSize: 11, fontWeight: '700', color: colors.accent },
    mainRow: { flexDirection: 'row', marginTop: spacing(2), alignItems: 'flex-start' },
    thumb: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: colors.chipBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing(3),
    },
    mainTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    sides: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1) },
    metaRow: { flexDirection: 'row', marginTop: spacing(2), flexWrap: 'wrap' },
    metaPill: {
      backgroundColor: colors.primary,
      color: colors.onPrimary,
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
      backgroundColor: colors.chipBg,
      borderRadius: radius.sm,
      padding: spacing(3),
      marginBottom: spacing(3),
    },
    swapText: { color: colors.primaryDark, fontWeight: '600', fontSize: 13 },
    swapCancel: { color: colors.primary, fontWeight: '700', fontSize: 13 },
    addDay: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(2),
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing(3),
      marginTop: spacing(1),
    },
    addDayText: { color: colors.primaryDark, fontWeight: '800', fontSize: 14 },
    horizonNote: { textAlign: 'center', color: colors.textMuted, fontSize: 13, marginTop: spacing(2), fontStyle: 'italic' },
    // shared-ingredient strip
    strip: { marginBottom: spacing(4), paddingBottom: spacing(3) },
    stripHead: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginBottom: spacing(3) },
    stripTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
    stripChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    threadChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: spacing(3),
      borderRadius: 999,
      borderWidth: 1.5,
    },
    threadChipText: { fontSize: 12.5, fontWeight: '700' },
    savingsRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flexWrap: 'wrap',
      gap: spacing(2),
      marginTop: spacing(3),
      paddingTop: spacing(3),
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    savingsAmt: { color: colors.money, fontWeight: '900', fontSize: 18 },
    savingsLbl: { color: colors.textMuted, fontSize: 12.5, fontWeight: '600' },
    stripHint: { color: colors.textMuted, fontSize: 11.5, marginTop: spacing(2), fontStyle: 'italic' },
    // per-day reuse tags
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing(2) },
    dayTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 3,
      paddingHorizontal: spacing(2),
      borderRadius: 999,
    },
    tagDot: { width: 7, height: 7, borderRadius: 4 },
    dayTagText: { fontSize: 11.5, fontWeight: '700' },
  });

type Styles = ReturnType<typeof makeStyles>;
