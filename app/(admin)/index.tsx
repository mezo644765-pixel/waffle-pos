import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { usePolling } from '@/hooks/usePolling';
import { StatCard } from '@/components/StatCard';
import { OrderCard } from '@/components/OrderCard';
import type { Order } from '@/context/OrdersContext';

type Period = 'today' | 'week' | 'month';

interface Stats {
  revenue: number;
  count: number;
  topProduct: string | null;
  leastProduct: string | null;
}

interface ActiveShift {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  isActive: boolean;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'الأسبوع' },
  { key: 'month', label: 'الشهر' },
];

export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gasUrl } = useAuth();
  const { isOnline } = useNetwork();

  const [period, setPeriod] = useState<Period>('today');
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeShifts, setActiveShifts] = useState<ActiveShift[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lastTimestamp, setLastTimestamp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    if (!gasUrl || !isOnline) return;
    setLoading(true);
    setError('');
    try {
      const [statsRes, shiftsRes, ordersRes] = await Promise.all([
        fetch(`${gasUrl}?action=getStats&period=${period}`),
        fetch(`${gasUrl}?action=getActiveShifts`),
        fetch(`${gasUrl}?action=getOrders&lastTimestamp=${encodeURIComponent(lastTimestamp)}`),
      ]);
      const [statsData, shiftsData, ordersData] = await Promise.all([
        statsRes.json(),
        shiftsRes.json(),
        ordersRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (shiftsData.success) setActiveShifts(shiftsData.shifts);
      if (ordersData.success && ordersData.orders.length > 0) {
        const incoming = ordersData.orders as Order[];
        setRecentOrders((prev) => {
          const ids = new Set(prev.map((o) => o.id));
          const newOnes = incoming.filter((o) => !ids.has(o.id));
          return [...newOnes, ...prev].slice(0, 50);
        });
        // Track the max server-side timestamp to avoid skipping late-synced orders
        const maxTs = incoming.reduce(
          (m, o) => (o.timestamp > m ? o.timestamp : m),
          lastTimestamp,
        );
        setLastTimestamp(maxTs);
      }
    } catch {
      setError('تعذّر تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Smart polling every 30 seconds
  usePolling(fetchAll, 30_000, isOnline && !!gasUrl);

  // Re-fetch when period changes
  React.useEffect(() => {
    if (gasUrl && isOnline) fetchAll();
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const productName = (key: string | null) => {
    if (!key) return '—';
    return key === 'waffle' ? 'وافل' : 'بنكيك';
  };

  const padTop = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const padBottom = insets.bottom + (Platform.OS === 'web' ? 84 : 88);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#6B3A2A', '#8B4513']}
        style={[styles.header, { paddingTop: padTop + 16 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
          {loading && <ActivityIndicator color="rgba(255,255,255,0.7)" size="small" />}
        </View>

        {/* Period filter */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[
                styles.periodBtn,
                period === p.key && { backgroundColor: 'rgba(255,255,255,0.25)' },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: period === p.key ? '#fff' : 'rgba(255,255,255,0.6)' },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: padBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : null}

        {/* Stats cards */}
        <View style={styles.statsGrid}>
          <StatCard
            label="الإيرادات (ريال)"
            value={stats ? stats.revenue.toFixed(2) : '—'}
            icon="cash-outline"
            accentColor={colors.primary}
          />
          <StatCard
            label="عدد المبيعات"
            value={stats?.count ?? '—'}
            icon="receipt-outline"
            accentColor={colors.accent}
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            label="الأكثر مبيعاً"
            value={productName(stats?.topProduct ?? null)}
            icon="trending-up-outline"
            accentColor={colors.online}
          />
          <StatCard
            label="الأقل مبيعاً"
            value={productName(stats?.leastProduct ?? null)}
            icon="trending-down-outline"
            accentColor={colors.mutedForeground}
          />
        </View>

        {/* Active workers */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            من يعمل الآن ({activeShifts.length})
          </Text>
          {activeShifts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                لا يوجد موظفون نشطون حالياً
              </Text>
            </View>
          ) : (
            activeShifts.map((shift) => (
              <View
                key={shift.id}
                style={[styles.workerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.workerDot, { backgroundColor: colors.online }]} />
                <View style={styles.workerInfo}>
                  <Text style={[styles.workerName, { color: colors.foreground }]}>
                    {shift.userName}
                  </Text>
                  <Text style={[styles.workerTime, { color: colors.mutedForeground }]}>
                    منذ {new Date(shift.startTime).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Ionicons name="radio-button-on" size={16} color={colors.online} />
              </View>
            ))
          )}
        </View>

        {/* Recent orders */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            آخر المبيعات
          </Text>
          {recentOrders.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {isOnline ? 'لا توجد مبيعات بعد' : 'يتطلب اتصال بالإنترنت'}
              </Text>
            </View>
          ) : (
            recentOrders.slice(0, 10).map((order) => (
              <OrderCard key={order.id} order={order} showEmployee />
            ))
          )}
        </View>

        <Text style={[styles.pollingHint, { color: colors.mutedForeground }]}>
          يتجدد تلقائياً كل 30 ثانية
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 4,
  },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  periodText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  scroll: { padding: 16, gap: 12 },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  errorText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', textAlign: 'right' },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  workerDot: { width: 10, height: 10, borderRadius: 5 },
  workerInfo: { flex: 1, gap: 2 },
  workerName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'right' },
  workerTime: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  pollingHint: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 4 },
});
