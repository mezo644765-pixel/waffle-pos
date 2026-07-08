import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { usePrices } from '@/context/PricesContext';

const FRACTIONS = [
  { label: '١/٤', value: 0.25 },
  { label: '١/٢', value: 0.5 },
  { label: '٣/٤', value: 0.75 },
  { label: 'كامل', value: 1 },
];

export default function PricesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prices, isLoading, updatePrices, refreshPrices } = usePrices();

  const [waffleInput, setWaffleInput] = useState(String(prices.waffleBasePrice));
  const [pancakeInput, setPancakeInput] = useState(String(prices.pancakePrice));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setWaffleInput(String(prices.waffleBasePrice));
    setPancakeInput(String(prices.pancakePrice));
  }, [prices.waffleBasePrice, prices.pancakePrice]);

  const handleSave = async () => {
    const waffle = parseFloat(waffleInput);
    const pancake = parseFloat(pancakeInput);
    if (isNaN(waffle) || waffle <= 0 || isNaN(pancake) || pancake <= 0) {
      Alert.alert('تنبيه', 'يرجى إدخال أسعار صحيحة');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      await updatePrices(waffle, pancake);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('تم الحفظ', 'تم تحديث الأسعار بنجاح. سيحصل الموظفون على التحديث تلقائياً.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل الحفظ';
      Alert.alert('خطأ', msg);
    } finally {
      setSaving(false);
    }
  };

  const padTop = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const padBottom = insets.bottom + (Platform.OS === 'web' ? 84 : 88);
  const waffleVal = parseFloat(waffleInput) || 0;
  const pancakeVal = parseFloat(pancakeInput) || 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#6B3A2A', '#8B4513']}
        style={[styles.header, { paddingTop: padTop + 16 }]}
      >
        <Text style={styles.headerTitle}>إدارة الأسعار</Text>
        <Text style={styles.headerSub}>الإصدار الحالي: v{prices.version}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: padBottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Waffle pricing */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="grid-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>سعر الوافل</Text>
          </View>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            السعر الأساسي (الكامل) - ريال
          </Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
            <TextInput
              value={waffleInput}
              onChangeText={setWaffleInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground }]}
              textAlign="right"
            />
            <Text style={[styles.currency, { color: colors.mutedForeground }]}>ريال</Text>
          </View>

          {/* Fraction preview */}
          <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>معاينة الكسور:</Text>
          <View style={styles.fractionPreview}>
            {FRACTIONS.map((f) => (
              <View
                key={f.value}
                style={[styles.fractionChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              >
                <Text style={[styles.fractionChipLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                <Text style={[styles.fractionChipPrice, { color: colors.primary }]}>
                  {Math.round(waffleVal * f.value * 100) / 100} ر
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pancake pricing */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="ellipse-outline" size={20} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>سعر البنكيك</Text>
          </View>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            السعر لكل قطعة - ريال
          </Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
            <TextInput
              value={pancakeInput}
              onChangeText={setPancakeInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground }]}
              textAlign="right"
            />
            <Text style={[styles.currency, { color: colors.mutedForeground }]}>ريال/قطعة</Text>
          </View>
          <View style={[styles.fractionChip, { backgroundColor: colors.secondary, borderColor: colors.border, alignSelf: 'flex-start' }]}>
            <Text style={[styles.fractionChipLabel, { color: colors.mutedForeground }]}>5 قطع</Text>
            <Text style={[styles.fractionChipPrice, { color: colors.accent }]}>
              {Math.round(pancakeVal * 5 * 100) / 100} ر
            </Text>
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || isLoading}
          style={[
            styles.saveBtn,
            { backgroundColor: colors.accent },
            (saving || isLoading) && { opacity: 0.6 },
          ]}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done-outline" size={22} color="#fff" />
          <Text style={[styles.saveBtnText, { color: '#fff' }]}>
            {saving ? 'جاري الحفظ...' : 'حفظ الأسعار'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.versionHint, { color: colors.mutedForeground }]}>
          آخر تحديث: {new Date(prices.updatedAt).toLocaleString('ar-SA')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff', textAlign: 'right' },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', textAlign: 'right', marginTop: 4 },
  scroll: { padding: 16, gap: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', flex: 1, textAlign: 'right' },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 8,
  },
  textInput: { flex: 1, fontSize: 20, fontFamily: 'Inter_700Bold', height: 52 },
  currency: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  previewLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 4 },
  fractionPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fractionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  fractionChipLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  fractionChipPrice: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    marginTop: 4,
  },
  saveBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  versionHint: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
