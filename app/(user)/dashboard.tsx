import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useOrders } from '@/context/OrdersContext';
import { usePrices } from '@/context/PricesContext';
import { OrderCard } from '@/components/OrderCard';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todayOrders, cancelOrder } = useOrders();
  const { refreshPrices } = usePrices();
  const [refreshing, setRefreshing] = useState(false);

  const activeOrders = todayOrders.filter((o) => !o.isCancelled);
  const cancelledCount = todayOrders.filter((o) => o.isCancelled).length;
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPrices();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancel = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('إلغاء البيع', 'هل تريد إلغاء هذا البيع؟', [
      { text: 'تراجع', style: 'cancel' },
      {
        text: 'إلغاء البيع',
        style: 'destructive',
        onPress: async () => {
          await cancelOrder(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const padTop = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const padBottom = insets.bottom + (Platform.OS === 'web' ? 84 : 88);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      <LinearGradient
        colors={['#C8873A', '#D4A87A']}
        style={[styles.header, { paddingTop: padTop + 16 }]}
      >
        <Text style={styles.headerTitle}>مبيعاتي اليوم</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalRevenue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>إجمالي الريال</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>مبيعات</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, cancelledCount > 0 && { color: '#FFD0D0' }]}>
              {cancelledCount}
            </Text>
            <Text style={styles.statLabel}>ملغى</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={todayOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onCancel={!item.isCancelled ? handleCancel : undefined}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: padBottom },
          todayOrders.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={todayOrders.length > 0}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد مبيعات اليوم</Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              ابدأ الوردية لتسجيل مبيعاتك
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    textAlign: 'right',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)' },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  list: { padding: 16, gap: 0 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', gap: 10, padding: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyHint: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
