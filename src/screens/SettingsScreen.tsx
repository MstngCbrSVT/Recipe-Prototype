import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePlan } from '../context/PlanContext';
import { DEFAULT_SPOONACULAR_KEY } from '../config';
import {
  Allergen,
  Cuisine,
  DietTag,
  Goal,
  LeftoversPref,
  Preferences,
  Protein,
  servingsFor,
  SideType,
} from '../types';
import { ThemeMode } from '../storage';
import { Button, Card, Chip } from '../ui/components';
import { Palette, spacing } from '../ui/theme';
import { useTheme } from '../ui/ThemeContext';

const DIETS: DietTag[] = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'high-protein', 'low-carb'];
const ALLERGENS: Allergen[] = ['gluten', 'dairy', 'eggs', 'peanuts', 'treenuts', 'soy', 'shellfish', 'fish'];
const SIDE_TYPES: SideType[] = ['vegetable', 'fruit', 'bread', 'starch', 'salad', 'dairy'];
const PROTEINS: Protein[] = ['chicken', 'beef', 'pork', 'fish', 'seafood', 'vegetarian'];
const CUISINES: Cuisine[] = ['Italian', 'Mexican', 'American', 'Asian', 'Mediterranean', 'Indian', 'Comfort', 'BBQ'];
const TIME_OPTS: { v: number; label: string }[] = [
  { v: 25, label: 'Quick ≤25m' }, { v: 40, label: 'Standard ≤40m' }, { v: 999, label: 'Any' },
];
const GOAL_OPTS: { v: Goal; label: string }[] = [
  { v: 'save', label: 'Save money' }, { v: 'time', label: 'Save time' },
  { v: 'healthy', label: 'Eat healthier' }, { v: 'variety', label: 'More variety' },
];
const LEFTOVER_OPTS: { v: LeftoversPref; label: string }[] = [
  { v: 'yes', label: 'Yes' }, { v: 'some', label: 'Sometimes' }, { v: 'no', label: 'No' },
];
const THEME_MODES: { mode: ThemeMode; label: string }[] = [
  { mode: 'auto', label: '📱 Auto' },
  { mode: 'light', label: '☀️ Garden (light)' },
  { mode: 'dark', label: '🌙 Midnight (dark)' },
];

export function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { prefs, setPrefs, recipeStatus, refreshRecipes } = usePlan();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apiKey, setApiKey] = useState(prefs.spoonacularApiKey ?? DEFAULT_SPOONACULAR_KEY);

  function update(patch: Partial<Preferences>) {
    setPrefs({ ...prefs, ...patch });
  }
  function setHousehold(adults: number, kids: number) {
    update({ adults, kids, servings: servingsFor(adults, kids) });
  }
  function toggleIn<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(20) }}
    >
      <Text style={styles.h1}>Preferences</Text>
      <Text style={styles.sub}>Everything from the intro lives here — change any of it anytime.</Text>

      {/* Appearance */}
      <Card style={{ marginTop: spacing(4) }}>
        <Text style={styles.label}>Appearance</Text>
        <View style={styles.chipWrap}>
          {THEME_MODES.map((t) => (
            <Chip key={t.mode} label={t.label} active={mode === t.mode} onPress={() => setMode(t.mode)} />
          ))}
        </View>
        <Text style={styles.hint}>Auto follows your phone's light/dark setting.</Text>
      </Card>

      {/* Household + week */}
      <Card style={{ marginTop: spacing(4) }}>
        <Text style={styles.label}>Adults</Text>
        <Stepper value={prefs.adults} min={1} max={8} onChange={(v) => setHousehold(v, prefs.kids)} />
        <Text style={[styles.label, { marginTop: spacing(4) }]}>Kids</Text>
        <Stepper value={prefs.kids} min={0} max={8} onChange={(v) => setHousehold(prefs.adults, v)} />
        <Text style={styles.hint}>
          {servingsFor(prefs.adults, prefs.kids)} servings — scales recipes and your shopping list.
        </Text>

        <Text style={[styles.label, { marginTop: spacing(4) }]}>Dinners this week</Text>
        <Stepper value={prefs.dinnersPerWeek} min={1} max={7} onChange={(v) => update({ dinnersPerWeek: v })} />

        <Text style={[styles.label, { marginTop: spacing(4) }]}>Sides per meal</Text>
        <Stepper value={prefs.sidesPerMeal} min={1} max={3} onChange={(v) => update({ sidesPerMeal: v })} />

        <Text style={[styles.label, { marginTop: spacing(4) }]}>Weeknight cooking time</Text>
        <View style={styles.chipWrap}>
          {TIME_OPTS.map((o) => (
            <Chip key={o.v} label={o.label} active={prefs.maxWeeknightMinutes === o.v} onPress={() => update({ maxWeeknightMinutes: o.v })} />
          ))}
        </View>
      </Card>

      {/* Cuisines */}
      <Card style={{ marginTop: spacing(4) }}>
        <Text style={styles.label}>Cuisines you like</Text>
        <View style={styles.chipWrap}>
          {CUISINES.map((c) => (
            <Chip key={c} label={c} active={prefs.cuisines.includes(c)} onPress={() => update({ cuisines: toggleIn(prefs.cuisines, c) })} />
          ))}
        </View>
      </Card>

      {/* Allergies */}
      <Card style={{ marginTop: spacing(4) }}>
        <Text style={styles.label}>⚠️ Any allergies? We'll never suggest these.</Text>
        <View style={styles.chipWrap}>
          {ALLERGENS.map((a) => (
            <Chip key={a} label={a} active={prefs.avoidAllergens.includes(a)} onPress={() => update({ avoidAllergens: toggleIn(prefs.avoidAllergens, a) })} />
          ))}
        </View>
      </Card>

      {/* Advanced */}
      <View style={{ marginTop: spacing(4) }}>
        <Button label={showAdvanced ? '▲ Hide advanced options' : '▼ Advanced options'} onPress={() => setShowAdvanced((s) => !s)} variant="ghost" />
      </View>

      {showAdvanced && (
        <>
          <Card style={{ marginTop: spacing(3) }}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.chipWrap}>
              {GOAL_OPTS.map((o) => (
                <Chip key={o.v} label={o.label} active={prefs.goal === o.v} onPress={() => update({ goal: o.v })} />
              ))}
            </View>
          </Card>

          <Card style={{ marginTop: spacing(3) }}>
            <Text style={styles.label}>Leftovers for lunches</Text>
            <View style={styles.chipWrap}>
              {LEFTOVER_OPTS.map((o) => (
                <Chip key={o.v} label={o.label} active={prefs.leftoversPref === o.v} onPress={() => update({ leftoversPref: o.v })} />
              ))}
            </View>
          </Card>

          <Card style={{ marginTop: spacing(3) }}>
            <Text style={styles.label}>Diet style</Text>
            <View style={styles.chipWrap}>
              {DIETS.map((d) => (
                <Chip key={d} label={d} active={prefs.diet.includes(d)} onPress={() => update({ diet: toggleIn(prefs.diet, d) })} />
              ))}
            </View>
          </Card>

          <Card style={{ marginTop: spacing(3) }}>
            <Text style={styles.label}>Side types to avoid</Text>
            <View style={styles.chipWrap}>
              {SIDE_TYPES.map((s) => (
                <Chip key={s} label={s} active={prefs.avoidSideTypes.includes(s)} onPress={() => update({ avoidSideTypes: toggleIn(prefs.avoidSideTypes, s) })} />
              ))}
            </View>
          </Card>

          <Card style={{ marginTop: spacing(3) }}>
            <Text style={styles.label}>Proteins to skip</Text>
            <View style={styles.chipWrap}>
              {PROTEINS.map((p) => (
                <Chip key={p} label={p} active={prefs.dislikedProteins.includes(p)} onPress={() => update({ dislikedProteins: toggleIn(prefs.dislikedProteins, p) })} />
              ))}
            </View>
          </Card>

          <Card style={{ marginTop: spacing(3) }}>
            <Text style={styles.label}>🔑 Spoonacular (free tier)</Text>
            <Text style={styles.hint}>
              Optional. Paste your key and load live recipes — they're merged with the built-in
              library and cached, so a single fetch (2 API calls) covers all your planning. You can
              also preconfigure it in .env.local (see README) to auto-load. Leave blank to use the
              built-in recipes only.
            </Text>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="your Spoonacular key"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={colors.textMuted}
            />
            <Button
              label={recipeStatus.loading ? '⏳ Loading…' : '⬇️ Save key & load recipes'}
              small
              onPress={async () => {
                update({ spoonacularApiKey: apiKey.trim() || undefined });
                await refreshRecipes(apiKey.trim());
              }}
            />
            {recipeStatus.message && (
              <Text style={styles.status}>
                {recipeStatus.externalCount > 0 ? `✅ ${recipeStatus.externalCount} live recipes loaded. ` : ''}
                {recipeStatus.message}
              </Text>
            )}
          </Card>

          <View style={{ marginTop: spacing(4) }}>
            <Button label="↻ Redo the intro" variant="ghost" onPress={() => update({ onboarded: false })} />
          </View>
        </>
      )}

      <Text style={styles.footer}>Changes reflow your unlocked days instantly. Locked meals stay put.</Text>
    </ScrollView>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.stepper}>
      <Button label="–" small variant="secondary" onPress={() => onChange(Math.max(min, value - 1))} />
      <Text style={styles.stepperValue}>{value}</Text>
      <Button label="+" small variant="secondary" onPress={() => onChange(Math.min(max, value + 1))} />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    h1: { fontSize: 26, fontWeight: '800', color: colors.text },
    sub: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1), lineHeight: 20 },
    label: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing(2) },
    hint: { fontSize: 13, color: colors.textMuted, marginTop: spacing(2), lineHeight: 18 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
    stepper: { flexDirection: 'row', alignItems: 'center' },
    stepperValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginHorizontal: spacing(5),
      minWidth: 28,
      textAlign: 'center',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: spacing(3),
      fontSize: 15,
      color: colors.text,
      marginBottom: spacing(3),
      marginTop: spacing(2),
    },
    status: { fontSize: 13, color: colors.accent, marginTop: spacing(3), fontWeight: '600', lineHeight: 18 },
    footer: { fontSize: 13, color: colors.textMuted, marginTop: spacing(6), textAlign: 'center', fontStyle: 'italic' },
  });
