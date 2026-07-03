import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlan } from '../context/PlanContext';
import { AISLE_ORDER, buildShoppingList, itemKey } from '../engine/shopping';
import { Card } from '../ui/components';
import { Icon } from '../ui/Icon';
import { Palette, spacing } from '../ui/theme';
import { useTheme } from '../ui/ThemeContext';

export function ShoppingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { plan, prefs, checked, setChecked } = usePlan();

  const grouped = useMemo(
    () => buildShoppingList(plan, prefs.servings, checked),
    [plan, prefs.servings, checked],
  );

  const totalItems = AISLE_ORDER.reduce((n, a) => n + grouped[a].length, 0);
  const checkedCount = AISLE_ORDER.reduce(
    (n, a) => n + grouped[a].filter((i) => i.checked).length,
    0,
  );

  function toggle(key: string) {
    setChecked({ ...checked, [key]: !checked[key] });
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(20) }}
    >
      <Text style={styles.h1}>Shopping List</Text>
      <Text style={styles.sub}>
        Auto-built from your week · scaled to {prefs.servings} servings · {checkedCount}/{totalItems} in cart
      </Text>

      {totalItems === 0 && (
        <Card style={{ marginTop: spacing(4) }}>
          <Text style={{ color: colors.textMuted }}>
            Nothing to buy — every day is skipped. Add a meal on the Plan tab.
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
                    style={[
                      styles.row,
                      idx < items.length - 1 && styles.rowBorder,
                    ]}
                  >
                    <View style={[styles.checkbox, item.checked && styles.checkboxOn]}>
                      {item.checked && <Icon name="check" size={14} color={colors.onAccent} strokeWidth={3} />}
                    </View>
                    <Text style={[styles.itemText, item.checked && styles.itemChecked]}>
                      {formatQty(item.qty)} {item.unit} {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </Card>
          </View>
        );
      })}
    </ScrollView>
  );
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    h1: { fontSize: 26, fontWeight: '800', color: colors.text },
    sub: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1) },
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
    check: { color: colors.onAccent, fontWeight: '900', fontSize: 14 },
    itemText: { fontSize: 15, color: colors.text, flex: 1 },
    itemChecked: { textDecorationLine: 'line-through', color: colors.textMuted },
  });
