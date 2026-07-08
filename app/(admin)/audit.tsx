import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { OrderCard } from '@/components/OrderCard';
import type { Order } from '@/context/OrdersContext';

type Filter = 'all' | 'cancelled';

export default function AuditScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gasUrl } = useAuth();
  const { isOnline } = useNetwork();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!gasUrl || !isOnline) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${gasUrl}?action=getOrders`);
      const data = await res.json();
      if (data.success) {
        const sorted = (data.orders as Order[]).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        setOrders(sorted);
        setFetched(true);
      } else {
        setError(data.error ?? 'خطأ في تحميل السجلات');
      }
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [gasUrl, isOnline]);

  React.useEffect(() => {
    fetchOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = orders.filter((o) => {
    if (filter === 'cancelled' && !o.isCancelled) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        o.userName.toLowerCase().includes(q) ||
        o.productType.toLowerCase().includes(q) ||
        (o.notes && o.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const padTop = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const padBottom = insets.bottom + (Platform.OS === 'web' ? 84 : 88);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#6B3A2A', '#8B4513']}
        style={[styles.header, { paddingTop: padTop + 16 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>سجل المبيعات</Text>
          {loading && <ActivityIndicator color="rgba(255,255,255,0.7)" size="small" />}
        </View>

        {/* Filter buttons */}
        <View style={styles.filterRow}>
          {(['all', 'cancelled'] as Filter[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterBtn,
                filter === f && { backgroundColor: 'rgba(255,255,255,0.25)' },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? '#fff' : 'rgba(255,255,255,0.6)' },
                ]}
              >
                {f === 'all' ? 'الكل' : 'الملغى فقط'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="بحث باسم الموظف أو المنتج..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={[styles.searchInput, { color: '#fff' }]}
            textAlign="right"
          />
        </View>
      </LinearGradient>

      {error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          <TouchableOpacity
            onPress={fetchOrders}
            style={[styles.retryBtn, { borderColor: colors.destructive }]}
          >
            <Text style={[styles.retryText, { color: colors.destructive }]}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} showEmployee />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: padBottom },
          filtered.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchOrders}
            tintColor={colors.primary}
          />
        }
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          fetched ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {filter === 'cancelled' ? 'لا توجد مبيعات ملغاة' : 'لا توجد سجلات'}
              </Text>
            </View>
          ) : !isOnline ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                يتطلب اتصال بالإنترنت
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    padding: 3,
  },
  filterBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', height: 32 },
  errorWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 16 },
  errorText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  retryBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  retryText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  list: { padding: 16, gap: 0 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', gap: 10, padding: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
});
