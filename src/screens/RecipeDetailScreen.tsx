import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlan } from '../context/PlanContext';
import { Recipe } from '../types';
import { recipeById } from '../data/catalog';
import { findVideos } from '../data/influencers';
import { buildTimeline } from '../engine/timeline';
import { mealActiveMinutes } from '../engine/planner';
import { Button, Card } from '../ui/components';
import { colors, radius, spacing } from '../ui/theme';

export function RecipeDetailScreen({ date, onClose }: { date: string; onClose: () => void }) {
  const { plan, prefs } = usePlan();
  const day = plan.find((d) => d.date === date);

  if (!day || !day.mainId) {
    return (
      <View style={styles.container}>
        <Header onClose={onClose} />
        <Text style={{ padding: spacing(4), color: colors.textMuted }}>No meal for this day.</Text>
      </View>
    );
  }

  const recipes = [day.mainId, ...day.sideIds]
    .map((id) => recipeById(id))
    .filter((r): r is Recipe => !!r);
  const { entries, totalMinutes } = buildTimeline(day.mainId, day.sideIds);
  const active = mealActiveMinutes(day.mainId, day.sideIds);

  return (
    <View style={styles.container}>
      <Header onClose={onClose} />
      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(20) }}>
        {/* Whole-meal summary */}
        <Card style={{ marginBottom: spacing(4), backgroundColor: colors.primary }}>
          <Text style={styles.summaryTitle}>The whole meal</Text>
          <Text style={styles.summaryTime}>{totalMinutes} min</Text>
          <Text style={styles.summarySub}>
            start-to-table · {active} min hands-on · serves {prefs.servings}
          </Text>
        </Card>

        {/* Coordinated timeline — the differentiator */}
        <Text style={styles.sectionTitle}>🕑 Cook it all together</Text>
        <Text style={styles.sectionSub}>
          One timeline for every dish so it all finishes at once.
        </Text>
        <Card style={{ marginTop: spacing(2), marginBottom: spacing(4) }}>
          {entries.map((e, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={styles.timeCol}>
                <Text style={styles.timeText}>{e.atMin === 0 ? 'Now' : `+${e.atMin}m`}</Text>
              </View>
              <View style={dotStyle(e.active)} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stepText}>{e.text}</Text>
                <Text style={styles.stepRecipe}>
                  {e.emoji} {e.recipeTitle}
                  {!e.active ? ' · hands-off' : ''}
                </Text>
              </View>
            </View>
          ))}
          <View style={styles.timelineRow}>
            <View style={styles.timeCol}>
              <Text style={[styles.timeText, { color: colors.accent }]}>+{totalMinutes}m</Text>
            </View>
            <View style={dotStyle(true)} />
            <Text style={[styles.stepText, { fontWeight: '800', color: colors.accent }]}>
              🍽️ Serve — everything's ready
            </Text>
          </View>
        </Card>

        {/* Per-recipe detail */}
        <Text style={styles.sectionTitle}>📋 Recipes</Text>
        {recipes.map((r) => (
          <Card key={r.id} style={{ marginTop: spacing(3) }}>
            <View style={styles.recipeHeader}>
              <Text style={{ fontSize: 30, marginRight: spacing(2) }}>{r.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.recipeTitle}>{r.title}</Text>
                <Text style={styles.recipeMeta}>
                  {r.cuisine} · {r.totalMinutes} min
                  {r.role === 'side' && r.sideType ? ` · ${r.sideType}` : ''}
                </Text>
              </View>
            </View>

            {r.source?.creator && (
              <Pressable
                onPress={() => r.source?.videoUrl && Linking.openURL(r.source.videoUrl)}
                style={styles.creatorPill}
              >
                <Text style={styles.creatorText}>▶️ Inspired by {r.source.creator} — watch</Text>
              </Pressable>
            )}

            <Text style={styles.subHead}>Ingredients</Text>
            {r.ingredients.map((ing, i) => (
              <Text key={i} style={styles.ingredient}>
                • {formatQty(ing.qty)} {ing.unit} {ing.name}
              </Text>
            ))}

            <Text style={styles.subHead}>Steps</Text>
            {r.steps.map((s, i) => (
              <Text key={i} style={styles.ingredient}>
                {i + 1}. {s.text} <Text style={styles.stepDur}>({s.durationMin}m)</Text>
              </Text>
            ))}
          </Card>
        ))}

        {/* Influencer videos — deep-link to a pro's take on the main dish */}
        {recipes[0] && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing(5) }]}>
              ▶️ Watch a pro make it
            </Text>
            <Text style={styles.sectionSub}>
              Similar recipes from food creators — opens YouTube.
            </Text>
            {findVideos(recipes[0]).map((v, i) => (
              <Pressable key={i} onPress={() => Linking.openURL(v.searchUrl)}>
                <Card style={{ marginTop: spacing(2), flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, marginRight: spacing(3) }}>▶️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.videoCreator}>{v.creator}</Text>
                    <Text style={styles.videoQuery}>“{v.query}”</Text>
                  </View>
                  <Text style={styles.videoGo}>Search ›</Text>
                </Card>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.header}>
      <Button label="✕ Close" onPress={onClose} variant="ghost" small />
    </View>
  );
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function dotStyle(active: boolean) {
  return {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: spacing(3),
    backgroundColor: active ? colors.primary : colors.textMuted,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: spacing(12),
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(2),
    flexDirection: 'row',
  },
  summaryTitle: { color: '#fff', fontSize: 14, fontWeight: '600', opacity: 0.9 },
  summaryTime: { color: '#fff', fontSize: 44, fontWeight: '900', marginTop: spacing(1) },
  summarySub: { color: '#fff', fontSize: 13, opacity: 0.9 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  sectionSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing(3) },
  timeCol: { width: 48 },
  timeText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  stepText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  stepRecipe: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  recipeHeader: { flexDirection: 'row', alignItems: 'center' },
  recipeTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  recipeMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  subHead: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: spacing(3),
    marginBottom: spacing(1),
  },
  ingredient: { fontSize: 14, color: colors.text, lineHeight: 22 },
  stepDur: { color: colors.textMuted, fontSize: 12 },
  creatorPill: {
    backgroundColor: '#FDECE6',
    borderRadius: radius.sm,
    padding: spacing(2),
    marginTop: spacing(2),
  },
  creatorText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  videoCreator: { fontSize: 15, fontWeight: '700', color: colors.text },
  videoQuery: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  videoGo: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
