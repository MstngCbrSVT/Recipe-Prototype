import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlan } from '../context/PlanContext';
import { Allergen, Cuisine, DietTag, Goal, LeftoversPref, servingsFor } from '../types';
import { Button } from '../ui/components';
import { Icon, IconName } from '../ui/Icon';
import { Palette, radius, spacing } from '../ui/theme';
import { useTheme } from '../ui/ThemeContext';

interface Opt<T> {
  v: T;
  icon: IconName;
  label: string;
  desc: string;
}
const GOALS: Opt<Goal>[] = [
  { v: 'save', icon: 'wallet', label: 'Save money', desc: 'Reuse ingredients, waste less' },
  { v: 'time', icon: 'clock', label: 'Save time', desc: 'Fast, low-effort dinners' },
  { v: 'healthy', icon: 'leaf', label: 'Eat healthier', desc: 'Balanced, veg-forward meals' },
  { v: 'variety', icon: 'sparkle', label: 'More variety', desc: 'Mix up cuisines and proteins' },
];
const TIMES: Opt<number>[] = [
  { v: 25, icon: 'bolt', label: 'Quick', desc: '25 minutes or less' },
  { v: 40, icon: 'clock', label: 'Standard', desc: 'Up to about 40 minutes' },
  { v: 999, icon: 'chef', label: 'I like to cook', desc: "Time isn't a constraint" },
];
const LEFTOVERS: Opt<LeftoversPref>[] = [
  { v: 'yes', icon: 'box', label: 'Yes, love leftovers', desc: 'Batch-cook and reuse' },
  { v: 'some', icon: 'layers', label: 'Sometimes', desc: 'A night or two' },
  { v: 'no', icon: 'utensils', label: 'No, fresh each night', desc: 'Cook every day' },
];
const CUISINES: Cuisine[] = ['Italian', 'Mexican', 'American', 'Asian', 'Mediterranean', 'Indian', 'Comfort', 'BBQ'];
const ALLERGENS: { v: Allergen; l: string }[] = [
  { v: 'gluten', l: 'gluten' }, { v: 'dairy', l: 'dairy' }, { v: 'eggs', l: 'eggs' },
  { v: 'peanuts', l: 'peanuts' }, { v: 'treenuts', l: 'tree nuts' }, { v: 'soy', l: 'soy' },
  { v: 'shellfish', l: 'shellfish' }, { v: 'fish', l: 'fish' },
];
const DIETS: DietTag[] = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'high-protein', 'low-carb'];

const STEP_COUNT = 7;

export function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { prefs, setPrefs } = usePlan();

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'steps' | 'building' | 'done'>('steps');

  const [goal, setGoal] = useState<Goal | undefined>(undefined);
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [diets, setDiets] = useState<DietTag[]>([]);
  const [maxTime, setMaxTime] = useState<number | undefined>(undefined);
  const [leftovers, setLeftovers] = useState<LeftoversPref | undefined>(undefined);
  const [dinners, setDinners] = useState(5);

  function toggle<T>(list: T[], set: (v: T[]) => void, value: T) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }
  function advance() {
    setStep((s) => Math.min(STEP_COUNT - 1, s + 1));
  }
  function pickSingle<T>(set: (v: T) => void, value: T) {
    set(value);
    setTimeout(advance, 220);
  }

  function finishFlow() {
    setPhase('building');
    setTimeout(() => setPhase('done'), 1300);
  }
  function apply() {
    setPrefs({
      ...prefs,
      goal,
      adults,
      kids,
      servings: servingsFor(adults, kids),
      cuisines,
      avoidAllergens: allergens,
      diet: diets,
      maxWeeknightMinutes: maxTime ?? 999,
      leftoversPref: leftovers ?? 'some',
      dinnersPerWeek: dinners,
      onboarded: true,
    });
  }
  function skip() {
    setPrefs({ ...prefs, onboarded: true });
  }

  if (phase !== 'steps') {
    return <BuildingDone phase={phase} onSee={apply} styles={styles} colors={colors}
      recap={{ goal, adults, kids, cuisines, allergens, diets, maxTime, leftovers, dinners }} />;
  }

  return (
    <View style={styles.root}>
      {/* header */}
      <View style={styles.brand}>
        <Icon name="sprout" size={18} color={colors.primary} />
        <Text style={styles.brandText}>MealMate</Text>
      </View>
      <View style={styles.topRow}>
        <Pressable onPress={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} hitSlop={8}>
          <Text style={[styles.chevron, step === 0 && { opacity: 0 }]}>‹</Text>
        </Pressable>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(step / STEP_COUNT) * 100}%` }]} />
        </View>
        <Pressable onPress={skip} hitSlop={8}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>
      <View style={styles.reassure}>
        <Icon name="sliders" size={14} color={colors.textMuted} strokeWidth={2} />
        <Text style={styles.reassureText}>Change any of this later in Prefs</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(6) }}>
        <Text style={styles.kicker}>Step {step + 1} of {STEP_COUNT}</Text>

        {step === 0 && (
          <Question title="What are you hoping for?" sub="We'll tune your plan around it — you can change it anytime." styles={styles}>
            {GOALS.map((o) => (
              <OptionCard key={o.v} opt={o} selected={goal === o.v} onPress={() => pickSingle(setGoal, o.v)} styles={styles} colors={colors} />
            ))}
          </Question>
        )}

        {step === 1 && (
          <Question title="Who are you cooking for?" sub="This sizes your portions and shopping list." styles={styles}>
            <Counter icon="user" label="Adults" sub="full portions" value={adults} min={1} max={8} onChange={setAdults} styles={styles} colors={colors} />
            <Counter icon="child" label="Kids" sub="smaller portions" value={kids} min={0} max={8} onChange={setKids} styles={styles} colors={colors} />
          </Question>
        )}

        {step === 2 && (
          <Question title="Which cuisines do you love?" sub="Pick a few and we'll lean toward them. Skip to be surprised." styles={styles}>
            <View style={styles.chipWrap}>
              {CUISINES.map((c) => (
                <Chip key={c} label={c} on={cuisines.includes(c)} onPress={() => toggle(cuisines, setCuisines, c)} styles={styles} />
              ))}
            </View>
          </Question>
        )}

        {step === 3 && (
          <Question title="Anything we should avoid?" sub="Safety first — we'll never suggest your allergens." styles={styles}>
            <Text style={styles.groupLab}>Allergies</Text>
            <View style={styles.chipWrap}>
              {ALLERGENS.map((a) => (
                <Chip key={a.v} label={a.l} on={allergens.includes(a.v)} onPress={() => toggle(allergens, setAllergens, a.v)} styles={styles} />
              ))}
            </View>
            <Text style={styles.groupLab}>Diet (optional)</Text>
            <View style={styles.chipWrap}>
              {DIETS.map((d) => (
                <Chip key={d} label={d} on={diets.includes(d)} onPress={() => toggle(diets, setDiets, d)} styles={styles} />
              ))}
            </View>
          </Question>
        )}

        {step === 4 && (
          <Question title="How much time on a weeknight?" sub="We'll keep dinners within reach." styles={styles}>
            {TIMES.map((o) => (
              <OptionCard key={o.v} opt={o} selected={maxTime === o.v} onPress={() => pickSingle(setMaxTime, o.v)} styles={styles} colors={colors} />
            ))}
          </Question>
        )}

        {step === 5 && (
          <Question title="Want leftovers for lunches?" sub="We can cook once and cover the next day." styles={styles}>
            {LEFTOVERS.map((o) => (
              <OptionCard key={o.v} opt={o} selected={leftovers === o.v} onPress={() => pickSingle(setLeftovers, o.v)} styles={styles} colors={colors} />
            ))}
          </Question>
        )}

        {step === 6 && (
          <Question title="How many dinners this week?" sub="You can always add or skip nights later." styles={styles}>
            <Counter icon="calendar" label="Dinners" sub="nights we'll plan for" value={dinners} min={1} max={7} onChange={setDinners} styles={styles} colors={colors} />
          </Question>
        )}
      </ScrollView>

      {/* footer */}
      <View style={styles.footer}>
        {step === 0 || step === 4 || step === 5 ? (
          <Text style={styles.tapHint}>Tap an option to continue</Text>
        ) : step === 6 ? (
          <Button label="Build my week" onPress={finishFlow} />
        ) : (
          <Button label="Continue" onPress={advance} />
        )}
      </View>
    </View>
  );
}

function Question({ title, sub, children, styles }: { title: string; sub: string; children: React.ReactNode; styles: Styles }) {
  return (
    <View>
      <Text style={styles.qTitle}>{title}</Text>
      <Text style={styles.qSub}>{sub}</Text>
      {children}
    </View>
  );
}

function OptionCard<T>({ opt, selected, onPress, styles, colors }: { opt: Opt<T>; selected: boolean; onPress: () => void; styles: Styles; colors: Palette }) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.cardOn]}>
      <View style={[styles.tile, selected && styles.tileOn]}>
        <Icon name={opt.icon} size={22} color={selected ? colors.onPrimary : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardLab}>{opt.label}</Text>
        <Text style={styles.cardDesc}>{opt.desc}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected && <Icon name="check" size={13} color={colors.onPrimary} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

function Counter({ icon, label, sub, value, min, max, onChange, styles, colors }: { icon: IconName; label: string; sub: string; value: number; min: number; max: number; onChange: (v: number) => void; styles: Styles; colors: Palette }) {
  return (
    <View style={styles.counter}>
      <View style={styles.counterWho}>
        <View style={styles.tile}><Icon name={icon} size={22} color={colors.primary} /></View>
        <View>
          <Text style={styles.cardLab}>{label}</Text>
          <Text style={styles.cardDesc}>{sub}</Text>
        </View>
      </View>
      <View style={styles.stepper}>
        <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={styles.rnd}><Text style={styles.rndText}>–</Text></Pressable>
        <Text style={styles.num}>{value}</Text>
        <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={styles.rnd}><Text style={styles.rndText}>+</Text></Pressable>
      </View>
    </View>
  );
}

function Chip({ label, on, onPress, styles }: { label: string; on: boolean; onPress: () => void; styles: Styles }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function BuildingDone({ phase, onSee, recap, styles, colors }: {
  phase: 'building' | 'done';
  onSee: () => void;
  styles: Styles;
  colors: Palette;
  recap: { goal?: Goal; adults: number; kids: number; cuisines: Cuisine[]; allergens: Allergen[]; diets: DietTag[]; maxTime?: number; leftovers?: LeftoversPref; dinners: number };
}) {
  if (phase === 'building') {
    return (
      <View style={styles.center}>
        <Spinner colors={colors} />
        <Text style={styles.buildTitle}>Building your week…</Text>
        <Text style={styles.qSub}>Matching recipes to your taste, time, and household.</Text>
      </View>
    );
  }
  const servings = servingsFor(recap.adults, recap.kids);
  const avoiding = [...recap.allergens, ...recap.diets];
  const rows: [string, string][] = [
    ['Goal', { save: 'Save money', time: 'Save time', healthy: 'Eat healthier', variety: 'More variety' }[recap.goal ?? 'variety'] ?? '—'],
    ['Cooking for', `${recap.adults} adult${recap.adults !== 1 ? 's' : ''}${recap.kids ? ` · ${recap.kids} kid${recap.kids !== 1 ? 's' : ''}` : ''} (${servings} servings)`],
    ['Cuisines', recap.cuisines.length ? recap.cuisines.slice(0, 3).join(', ') + (recap.cuisines.length > 3 ? '…' : '') : 'A little of everything'],
    ['Avoiding', avoiding.length ? avoiding.join(', ') : 'Nothing'],
    ['Weeknights', { 25: 'Quick (≤25 min)', 40: 'Standard (≤40 min)', 999: 'No time limit' }[recap.maxTime ?? 999] ?? 'Standard'],
    ['Leftovers', { yes: 'Yes — batch cook', some: 'Sometimes', no: 'Fresh each night' }[recap.leftovers ?? 'some']],
    ['Dinners', `${recap.dinners} this week`],
  ];
  return (
    <ScrollView contentContainerStyle={styles.center}>
      <View style={styles.badge}><Icon name="check" size={30} color={colors.onPrimary} strokeWidth={2.4} /></View>
      <Text style={styles.buildTitle}>You're all set</Text>
      <Text style={styles.qSub}>Here's what we'll plan around:</Text>
      <View style={styles.recap}>
        {rows.map(([k, v]) => (
          <View key={k} style={styles.recapRow}>
            <Text style={styles.recapK}>{k}</Text>
            <Text style={styles.recapV}>{v}</Text>
          </View>
        ))}
      </View>
      <View style={styles.noteRow}>
        <Icon name="sliders" size={13} color={colors.textMuted} strokeWidth={2} />
        <Text style={styles.note}>Nothing here is locked in — edit any of it anytime in Prefs.</Text>
      </View>
      <View style={{ width: '100%', marginTop: spacing(4) }}>
        <Button label="See my week →" onPress={onSee} />
      </View>
    </ScrollView>
  );
}

function Spinner({ colors }: { colors: Palette }) {
  // Simple static ring; RN Animated would add noise for a ~1s beat.
  return (
    <View style={{
      width: 44, height: 44, borderRadius: 22, borderWidth: 4,
      borderColor: colors.border, borderTopColor: colors.primary, marginBottom: spacing(3),
    }} />
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: spacing(12) },
    brandText: { color: colors.primary, fontWeight: '900', fontSize: 15 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), paddingHorizontal: spacing(4), paddingTop: spacing(3) },
    chevron: { fontSize: 28, color: colors.textMuted, paddingHorizontal: spacing(1) },
    track: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 99, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 99 },
    skip: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
    reassure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: spacing(2) },
    reassureText: { color: colors.textMuted, fontSize: 11.5, fontWeight: '600' },
    kicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: colors.primaryDark },
    qTitle: { fontSize: 25, fontWeight: '800', color: colors.text, marginTop: spacing(2), marginBottom: spacing(1) },
    qSub: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: spacing(5) },
    card: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: spacing(3), marginBottom: spacing(3) },
    cardOn: { borderColor: colors.primary, backgroundColor: colors.chipBg },
    tile: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' },
    tileOn: { backgroundColor: colors.primary },
    cardLab: { fontSize: 16, fontWeight: '700', color: colors.text },
    cardDesc: { fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: spacing(3), marginBottom: spacing(3) },
    counterWho: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
    rnd: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    rndText: { fontSize: 22, fontWeight: '800', color: colors.primary, lineHeight: 24 },
    num: { minWidth: 24, textAlign: 'center', fontSize: 20, fontWeight: '800', color: colors.text },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    chip: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingVertical: spacing(2), paddingHorizontal: spacing(3) },
    chipOn: { borderColor: colors.primary, backgroundColor: colors.chipBg },
    chipText: { color: colors.text, fontSize: 14, fontWeight: '700' },
    chipTextOn: { color: colors.primaryDark },
    groupLab: { fontSize: 12.5, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing(4), marginBottom: spacing(2) },
    footer: { padding: spacing(4), borderTopWidth: 1, borderTopColor: colors.border },
    tapHint: { textAlign: 'center', fontSize: 12.5, color: colors.textMuted, paddingVertical: spacing(2) },
    center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(6) },
    buildTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: spacing(2), textAlign: 'center' },
    badge: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing(2) },
    recap: { width: '100%', backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, paddingHorizontal: spacing(4), marginTop: spacing(4) },
    recapRow: { flexDirection: 'row', gap: spacing(3), paddingVertical: spacing(3), borderBottomWidth: 1, borderBottomColor: colors.border },
    recapK: { color: colors.textMuted, width: 110, fontWeight: '600', fontSize: 14 },
    recapV: { fontWeight: '700', fontSize: 14, color: colors.text, flex: 1 },
    noteRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing(3) },
    note: { fontSize: 12.5, color: colors.textMuted },
  });
