import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlan } from '../context/PlanContext';
import { recipeById } from '../data/catalog';
import { AISLE_ORDER, buildShoppingList, formatQty, itemKey } from '../engine/shopping';
import { DayPlan } from '../types';
import { Button, Card } from '../ui/components';
import { Icon } from '../ui/Icon';
import { Palette, spacing } from '../ui/theme';
import { useTheme } from '../ui/ThemeContext';

function isCooking(d: DayPlan): boolean {
  return !d.skipped && !d.leftoverOf && !!d.mainId;
}
function rangeLabel(days: DayPlan[]): string {
  if (days.length === 0) return '';
  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.length === 1 ? fmt(sorted[0].date) : `${fmt(sorted[0].date)} – ${fmt(sorted[sorted.length - 1].date)}`;
}

export function ShoppingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { plan, prefs, checked, setChecked, setShopped } = usePlan();
  const [showShopped, setShowShopped] = useState(false);

  const toShop = plan.filter((d) => isCooking(d) && !d.shopped);
  const shoppedDays = plan.filter((d) => isCooking(d) && d.shopped);

  const grouped = useMemo(
    () => buildShoppingList(plan, prefs.servings, checked),
    [plan, prefs.servings, checked],
  );
  const totalItems = AISLE_ORDER.reduce((n, a) => n + grouped[a].length, 0);
  const checkedCount = AISLE_ORDER.reduce((n, a) => n + grouped[a].filter((i) => i.checked).length, 0);

  function toggle(key: string) {
    setChecked({ ...checked, [key]: !checked[key] });
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(20) }}
    >
      <Text style={styles.eyebrow}>GROCERIES</Text>
      <Text style={styles.h1}>Shopping List</Text>
      {toShop.length > 0 ? (
        <Text style={styles.sub}>
          {toShop.length} meal{toShop.length !== 1 ? 's' : ''} to shop for · {rangeLabel(toShop)} · {checkedCount}/{totalItems} in cart
        </Text>
      ) : (
        <Text style={styles.sub}>Scaled to {prefs.servings} servings</Text>
      )}

      {toShop.length === 0 && (
        <Card style={{ marginTop: spacing(4), alignItems: 'center' }}>
          <Icon name="check" size={28} color={colors.accent} strokeWidth={2.4} />
          <Text style={styles.caughtUp}>You're all set</Text>
          <Text style={styles.caughtUpSub}>
            {shoppedDays.length > 0
              ? 'Everything you have planned is already shopped for. Generate or add meals to build a new list.'
              : 'No meals to shop for yet — add or generate meals on the Plan tab.'}
          </Text>
        </Card>
      )}

      {AISLE_ORDER.map((aisle) => {
        const items = grouped[aisle];
        if (items.length === 0) return null;
        return (
          <View key={aisle} style={{ marginTop: spacing(4) }}>
            <Text style={styles.aisle}>{aisle}</Text>
            <Card style={{ padding: 0 }}>
              {items.map((item, idx) => {
                const key = itemKey(item);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggle(key)}
                    style={[styles.row, idx < items.length - 1 && styles.rowBorder]}
                  >
                    <View style={[styles.checkbox, item.checked && styles.checkboxOn]}>
                      {item.checked && <Icon name="check" size={14} color={colors.onAccent} strokeWidth={3} />}
                    </View>
                    <Text style={[styles.itemText, item.checked && styles.itemChecked]}>
                      {[formatQty(item.qty), item.unit, item.name].filter(Boolean).join(' ')}
                    </Text>
                  </Pressable>
                );
              })}
            </Card>
          </View>
        );
      })}

      {toShop.length > 0 && totalItems > 0 && (
        <View style={{ marginTop: spacing(5) }}>
          <Button
            label={`Mark ${toShop.length} meal${toShop.length !== 1 ? 's' : ''} as shopped`}
            icon="check"
            onPress={() => setShopped(toShop.map((d) => d.date), true)}
          />
        </View>
      )}

      {/* Already shopped — collapsible, so nothing feels lost */}
      {shoppedDays.length > 0 && (
        <View style={{ marginTop: spacing(6) }}>
          <Pressable onPress={() => setShowShopped((s) => !s)} style={styles.shoppedHead}>
            <Text style={styles.shoppedHeadText}>
              {showShopped ? '▾' : '▸'}  Already shopped ({shoppedDays.length})
            </Text>
          </Pressable>
          {showShopped && (
            <Card style={{ padding: 0, marginTop: spacing(2) }}>
              {shoppedDays.map((d, idx) => {
                const main = recipeById(d.mainId);
                return (
                  <View key={d.date} style={[styles.row, idx < shoppedDays.length - 1 && styles.rowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.shoppedDay}>{rangeLabel([d])}</Text>
                      <Text style={styles.shoppedMeal}>{main?.title ?? 'Meal'}</Text>
                    </View>
                    <Pressable onPress={() => setShopped([d.date], false)} hitSlop={8}>
                      <Text style={styles.undo}>Need to buy</Text>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, color: colors.textMuted, marginBottom: 2 },
    h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, color: colors.text },
    sub: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1), lineHeight: 20 },
    caughtUp: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: spacing(2) },
    caughtUpSub: { fontSize: 13, color: colors.textMuted, marginTop: spacing(1), textAlign: 'center', lineHeight: 19 },
    aisle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primaryDark,
      marginBottom: spacing(2),
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing(3) },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: spacing(3),
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
    itemText: { fontSize: 15, color: colors.text, flex: 1 },
    itemChecked: { textDecorationLine: 'line-through', color: colors.textMuted },
    shoppedHead: { paddingVertical: spacing(2) },
    shoppedHeadText: { fontSize: 14, fontWeight: '800', color: colors.textMuted },
    shoppedDay: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
    shoppedMeal: { fontSize: 15, color: colors.text, marginTop: 1 },
    undo: { fontSize: 13, fontWeight: '700', color: colors.primary },
  });
