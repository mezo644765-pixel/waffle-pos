import React, { useMemo, useState } from 'react';
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
import { useOrders } from '@/context/OrdersContext';
import { usePrices } from '@/context/PricesContext';
import { useAuth } from '@/context/AuthContext';
import { CountdownTimer } from '@/components/CountdownTimer';
import { OfflineBanner } from '@/components/OfflineBanner';

type Product = 'waffle' | 'pancake';
const FRACTIONS: { label: string; value: number }[] = [
  { label: '١/٤', value: 0.25 },
  { label: '١/٢', value: 0.5 },
  { label: '٣/٤', value: 0.75 },
  { label: 'كامل', value: 1 },
];

export default function SalesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { prices } = usePrices();
  const { isWorking, startShift, addOrder } = useOrders();

  const [product, setProduct] = useState<Product | null>(null);
  const [fraction, setFraction] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [showCountdown, setShowCountdown] = useState(false);
  const [startingShift, setStartingShift] = useState(false);
  const [isSelling, setIsSelling] = useState(false);

  const computedPrice = useMemo(() => {
    if (!product) return 0;
    if (product === 'waffle') return Math.round(prices.waffleBasePrice * fraction * 100) / 100;
    return prices.pancakePrice * quantity;
  }, [product, fraction, quantity, prices]);

  const orderSummary = useMemo(() => {
    if (!product) return '';
    if (product === 'waffle') {
      const f = FRACTIONS.find((f) => f.value === fraction);
      return `وافل ${f?.label ?? ''}`;
    }
    return `بنكيك × ${quantity}`;
  }, [product, fraction, quantity]);

  const handleStartShift = async () => {
    setStartingShift(true);
    try {
      await startShift();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('خطأ', 'تعذّر بدء الوردية');
    } finally {
      setStartingShift(false);
    }
  };

  const handleSellPress = () => {
    if (!product) {
      Alert.alert('تنبيه', 'اختر المنتج أولاً');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCountdown(true);
  };

  const handleConfirm = async () => {
    setShowCountdown(false);
    setIsSelling(true);
    try {
      await addOrder({
        productType: product!,
        fraction: product === 'waffle' ? fraction : undefined,
        quantity: product === 'pancake' ? quantity : undefined,
        basePrice: product === 'waffle' ? prices.waffleBasePrice : prices.pancakePrice,
        totalPrice: computedPrice,
        notes: notes.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProduct(null);
      setFraction(1);
      setQuantity(1);
      setNotes('');
    } catch {
      Alert.alert('خطأ', 'تعذّر حفظ البيع');
    } finally {
      setIsSelling(false);
    }
  };

  const padBottom = insets.bottom + (Platform.OS === 'web' ? 84 : 88);
  const padTop = insets.top + (Platform.OS === 'web' ? 67 : 16);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      {/* Header */}
      <LinearGradient
        colors={['#C8873A', '#E8A240']}
        style={[styles.header, { paddingTop: padTop, paddingBottom: 20 }]}
      >
        <Text style={styles.greeting}>مرحباً، {user?.name}</Text>
        <Text style={styles.headerSub}>
          {isWorking ? 'وردية نشطة' : 'وضع التصفح'}
        </Text>
      </LinearGradient>

      {!isWorking ? (
        /* Browse mode */
        <View style={[styles.browseWrap, { paddingBottom: padBottom }]}>
          <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="pricetag-outline" size={32} color={colors.primary} />
            <Text style={[styles.priceCardTitle, { color: colors.foreground }]}>قائمة الأسعار</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.priceItem, { color: colors.foreground }]}>وافل كامل</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>{prices.waffleBasePrice} ريال</Text>
            </View>
            {FRACTIONS.filter((f) => f.value < 1).map((f) => (
              <View key={f.value} style={styles.priceRow}>
                <Text style={[styles.priceItem, { color: colors.foreground }]}>وافل {f.label}</Text>
                <Text style={[styles.priceValue, { color: colors.mutedForeground }]}>
                  {Math.round(prices.waffleBasePrice * f.value)} ريال
                </Text>
              </View>
            ))}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.priceRow}>
              <Text style={[styles.priceItem, { color: colors.foreground }]}>بنكيك (القطعة)</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>{prices.pancakePrice} ريال</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleStartShift}
            disabled={startingShift}
            style={[styles.startShiftBtn, { backgroundColor: colors.primary, opacity: startingShift ? 0.7 : 1 }]}
            activeOpacity={0.85}
          >
            <Ionicons name="play-circle-outline" size={24} color="#fff" />
            <Text style={[styles.startShiftText, { color: '#fff' }]}>
              {startingShift ? 'جاري البدء...' : 'بدء الوردية'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Sales terminal */
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.terminal, { paddingBottom: padBottom }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Product selector */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>اختر المنتج</Text>
          <View style={styles.productRow}>
            <TouchableOpacity
              onPress={() => { setProduct('waffle'); Haptics.selectionAsync(); }}
              style={[
                styles.productBtn,
                { borderColor: product === 'waffle' ? colors.primary : colors.border },
                product === 'waffle' && { backgroundColor: colors.primary + '18' },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name="grid-outline"
                size={28}
                color={product === 'waffle' ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.productLabel,
                  { color: product === 'waffle' ? colors.primary : colors.foreground },
                ]}
              >
                وافل
              </Text>
              <Text style={[styles.productPrice, { color: colors.mutedForeground }]}>
                {prices.waffleBasePrice} ريال
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setProduct('pancake'); Haptics.selectionAsync(); }}
              style={[
                styles.productBtn,
                { borderColor: product === 'pancake' ? colors.primary : colors.border },
                product === 'pancake' && { backgroundColor: colors.primary + '18' },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name="ellipse-outline"
                size={28}
                color={product === 'pancake' ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.productLabel,
                  { color: product === 'pancake' ? colors.primary : colors.foreground },
                ]}
              >
                بنكيك
              </Text>
              <Text style={[styles.productPrice, { color: colors.mutedForeground }]}>
                {prices.pancakePrice}/قطعة
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fraction selector for waffle */}
          {product === 'waffle' && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>الكمية</Text>
              <View style={styles.fractionGrid}>
                {FRACTIONS.map((f) => (
                  <TouchableOpacity
                    key={f.value}
                    onPress={() => { setFraction(f.value); Haptics.selectionAsync(); }}
                    style={[
                      styles.fractionBtn,
                      { borderColor: fraction === f.value ? colors.primary : colors.border },
                      fraction === f.value && { backgroundColor: colors.primary },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.fractionLabel,
                        { color: fraction === f.value ? '#fff' : colors.foreground },
                      ]}
                    >
                      {f.label}
                    </Text>
                    <Text
                      style={[
                        styles.fractionPrice,
                        { color: fraction === f.value ? 'rgba(255,255,255,0.8)' : colors.mutedForeground },
                      ]}
                    >
                      {Math.round(prices.waffleBasePrice * f.value)} ر
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Quantity selector for pancake */}
          {product === 'pancake' && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>العدد</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  onPress={() => { if (quantity > 1) { setQuantity((q) => q - 1); Haptics.selectionAsync(); } }}
                  style={[styles.qtyBtn, { backgroundColor: colors.secondary }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="remove" size={22} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.qtyNum, { color: colors.foreground }]}>{quantity}</Text>
                <TouchableOpacity
                  onPress={() => { setQuantity((q) => q + 1); Haptics.selectionAsync(); }}
                  style={[styles.qtyBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Notes */}
          {product && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ملاحظات (اختياري)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="أضف ملاحظة للطلب..."
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.notesInput,
                  { borderColor: colors.border, backgroundColor: colors.input, color: colors.foreground },
                ]}
                textAlign="right"
                multiline
                numberOfLines={2}
              />

              {/* Price display */}
              <View style={[styles.priceDisplay, { backgroundColor: colors.cream, borderColor: colors.waffle }]}>
                <Text style={[styles.priceDisplayLabel, { color: colors.mutedForeground }]}>
                  إجمالي السعر
                </Text>
                <Text style={[styles.priceDisplayValue, { color: colors.primary }]}>
                  {computedPrice.toFixed(2)} ريال
                </Text>
              </View>
            </>
          )}

          {/* Sell button */}
          <TouchableOpacity
            onPress={handleSellPress}
            disabled={!product || isSelling || showCountdown}
            style={[
              styles.sellBtn,
              { backgroundColor: colors.primary },
              (!product || isSelling) && { opacity: 0.45 },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            <Text style={styles.sellBtnText}>بيع</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* 5-second countdown overlay */}
      {showCountdown && (
        <CountdownTimer
          duration={5}
          orderSummary={orderSummary}
          price={computedPrice}
          onConfirm={handleConfirm}
          onCancel={() => setShowCountdown(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    textAlign: 'right',
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
    marginTop: 2,
  },
  browseWrap: {
    flex: 1,
    padding: 20,
    gap: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  priceCardTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceItem: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  priceValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  divider: { height: 1, marginVertical: 4 },
  startShiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#C8873A',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  startShiftText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  terminal: { padding: 20, gap: 14 },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'right' },
  productRow: { flexDirection: 'row', gap: 12 },
  productBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  productLabel: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  productPrice: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  fractionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fractionBtn: {
    width: '47%',
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  fractionLabel: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  fractionPrice: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  qtyBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum: { fontSize: 36, fontFamily: 'Inter_700Bold', minWidth: 60, textAlign: 'center' },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  priceDisplay: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  priceDisplayLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  priceDisplayValue: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 60,
    borderRadius: 18,
    marginTop: 4,
    shadowColor: '#C8873A',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  sellBtnText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
});
