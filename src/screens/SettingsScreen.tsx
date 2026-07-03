import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePlan } from '../context/PlanContext';
import { Allergen, DietTag, Preferences, Protein, SideType } from '../types';
import { Button, Card, Chip } from '../ui/components';
import { colors, spacing } from '../ui/theme';

const DIETS: DietTag[] = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'high-protein', 'low-carb'];
const ALLERGENS: Allergen[] = ['gluten', 'dairy', 'eggs', 'peanuts', 'treenuts', 'soy', 'shellfish', 'fish'];
const SIDE_TYPES: SideType[] = ['vegetable', 'fruit', 'bread', 'starch', 'salad', 'dairy'];
const PROTEINS: Protein[] = ['chicken', 'beef', 'pork', 'fish', 'seafood', 'vegetarian'];

export function SettingsScreen() {
  const { prefs, setPrefs, recipeStatus, refreshRecipes } = usePlan();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apiKey, setApiKey] = useState(prefs.spoonacularApiKey ?? '');

  function update(patch: Partial<Preferences>) {
    setPrefs({ ...prefs, ...patch });
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
      <Text style={styles.sub}>
        The essentials are up top. Everything else is optional — the app works great on defaults.
      </Text>

      {/* --- The two things that matter most --- */}
      <Card style={{ marginTop: spacing(4) }}>
        <Text style={styles.label}>How many dinners this week?</Text>
        <Stepper
          value={prefs.dinnersPerWeek}
          min={1}
          max={7}
          onChange={(v) => update({ dinnersPerWeek: v })}
        />

        <Text style={[styles.label, { marginTop: spacing(4) }]}>Cooking for how many?</Text>
        <Stepper
          value={prefs.servings}
          min={1}
          max={10}
          onChange={(v) => update({ servings: v })}
        />

        <Text style={[styles.label, { marginTop: spacing(4) }]}>Sides per meal</Text>
        <Stepper
          value={prefs.sidesPerMeal}
          min={1}
          max={3}
          onChange={(v) => update({ sidesPerMeal: v })}
        />
      </Card>

      {/* Allergies get their own gentle callout — safety, not setup */}
      <Card style={{ marginTop: spacing(4) }}>
        <Text style={styles.label}>⚠️ Any allergies? We'll never suggest these.</Text>
        <View style={styles.chipWrap}>
          {ALLERGENS.map((a) => (
            <Chip
              key={a}
              label={a}
              active={prefs.avoidAllergens.includes(a)}
              onPress={() => update({ avoidAllergens: toggleIn(prefs.avoidAllergens, a) })}
            />
          ))}
        </View>
      </Card>

      {/* --- Advanced, hidden by default (progressive disclosure) --- */}
      <View style={{ marginTop: spacing(4) }}>
        <Button
          label={showAdvanced ? '▲ Hide advanced options' : '▼ Advanced options'}
          onPress={() => setShowAdvanced((s) => !s)}
          variant="ghost"
        />
      </View>

      {showAdvanced && (
        <>
          <Card style={{ marginTop: spacing(3) }}>
            <Text style={styles.label}>Diet style</Text>
            <View style={styles.chipWrap}>
              {DIETS.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  active={prefs.diet.includes(d)}
                  onPress={() => update({ diet: toggleIn(prefs.diet, d) })}
                />
              ))}
            </View>
          </Card>

          <Card style={{ marginTop: spacing(3) }}>
            <Text style={styles.label}>Side types to avoid</Text>
            <View style={styles.chipWrap}>
              {SIDE_TYPES.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={prefs.avoidSideTypes.includes(s)}
                  onPress={() => update({ avoidSideTypes: toggleIn(prefs.avoidSideTypes, s) })}
                />
              ))}
            </View>
          </Card>

          <Card style={{ marginTop: spacing(3) }}>
            <Text style={styles.label}>Proteins to skip</Text>
            <View style={styles.chipWrap}>
              {PROTEINS.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  active={prefs.dislikedProteins.includes(p)}
                  onPress={() => update({ dislikedProteins: toggleIn(prefs.dislikedProteins, p) })}
                />
              ))}
            </View>
          </Card>

          <Card style={{ marginTop: spacing(3) }}>
            <Text style={styles.label}>🔑 Spoonacular (free tier)</Text>
            <Text style={styles.hint}>
              Optional. Paste your key and load live recipes — they're merged with the built-in
              library and cached, so a single fetch (2 API calls) covers all your planning. Leave
              blank to use the built-in recipes only.
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
                {recipeStatus.externalCount > 0
                  ? `✅ ${recipeStatus.externalCount} live recipes loaded. `
                  : ''}
                {recipeStatus.message}
              </Text>
            )}
          </Card>
        </>
      )}

      <Text style={styles.footer}>
        Changes reflow your unlocked days instantly. Locked meals stay put.
      </Text>
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
  return (
    <View style={styles.stepper}>
      <Button label="–" small variant="secondary" onPress={() => onChange(Math.max(min, value - 1))} />
      <Text style={styles.stepperValue}>{value}</Text>
      <Button label="+" small variant="secondary" onPress={() => onChange(Math.min(max, value + 1))} />
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: spacing(1), lineHeight: 20 },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing(2) },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing(2), lineHeight: 18 },
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
  },
  status: {
    fontSize: 13,
    color: colors.accent,
    marginTop: spacing(3),
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing(6),
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
