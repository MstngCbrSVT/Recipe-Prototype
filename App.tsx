import React, { useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { PlanProvider, usePlan } from './src/context/PlanContext';
import { PlanScreen } from './src/screens/PlanScreen';
import { ShoppingScreen } from './src/screens/ShoppingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { RecipeDetailScreen } from './src/screens/RecipeDetailScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { Loader } from './src/ui/components';
import { Icon, IconName } from './src/ui/Icon';
import { Palette, spacing } from './src/ui/theme';
import { ThemeProvider, useTheme } from './src/ui/ThemeContext';

type Tab = 'plan' | 'shopping' | 'history' | 'settings';

const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'plan', label: 'Plan', icon: 'calendar' },
  { key: 'shopping', label: 'Shop', icon: 'cart' },
  { key: 'history', label: 'History', icon: 'clock' },
  { key: 'settings', label: 'Prefs', icon: 'sliders' },
];

function Shell() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { ready, prefs } = usePlan();
  const [tab, setTab] = useState<Tab>('plan');
  const [openDate, setOpenDate] = useState<string | null>(null);

  if (!ready) return <Loader />;

  // First launch → the intro flow. Completing/skipping it sets onboarded = true.
  if (!prefs.onboarded) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <OnboardingScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.brandBar}>
        <Icon name="sprout" size={20} color={colors.primary} />
        <Text style={styles.brand}>MealMate</Text>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'plan' && <PlanScreen onOpenDay={setOpenDate} />}
        {tab === 'shopping' && <ShoppingScreen />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Icon name={t.icon} size={23} color={tab === t.key ? colors.primary : colors.textMuted} strokeWidth={1.9} />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={openDate !== null} animationType="slide" presentationStyle="fullScreen">
        {openDate && <RecipeDetailScreen date={openDate} onClose={() => setOpenDate(null)} />}
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PlanProvider>
        <Shell />
      </PlanProvider>
    </ThemeProvider>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    brandBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(2),
      paddingHorizontal: spacing(4),
      paddingTop: spacing(2),
      paddingBottom: spacing(2),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    brand: { fontSize: 20, fontWeight: '900', color: colors.primary },
    tabBar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
      paddingBottom: spacing(2),
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: spacing(3) },
    tabIcon: { fontSize: 22, opacity: 0.5 },
    tabLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
    tabActive: { opacity: 1, color: colors.primary },
  });
