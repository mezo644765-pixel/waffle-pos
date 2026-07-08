import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Order } from '@/context/OrdersContext';

interface OrderCardProps {
  order: Order;
  onCancel?: (id: string) => void;
  showEmployee?: boolean;
}

function fractionLabel(fraction: number | undefined) {
  if (fraction === 0.25) return '١/٤';
  if (fraction === 0.5) return '١/٢';
  if (fraction === 0.75) return '٣/٤';
  return 'كامل';
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export function OrderCard({ order, onCancel, showEmployee }: OrderCardProps) {
  const colors = useColors();

  const productName =
    order.productType === 'waffle'
      ? `وافل ${fractionLabel(order.fraction)}`
      : `بنكيك × ${order.quantity ?? 1}`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        order.isCancelled && { borderColor: colors.destructive, opacity: 0.65 },
      ]}
    >
      {order.isCancelled && (
        <View
          style={[styles.cancelledBadge, { backgroundColor: colors.destructive }]}
        >
          <Text style={[styles.cancelledText, { color: colors.destructiveForeground }]}>
            ملغى
          </Text>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.info}>
          <Text
            style={[
              styles.product,
              { color: colors.foreground },
              order.isCancelled && styles.strikethrough,
            ]}
          >
            {productName}
          </Text>
          {showEmployee && (
            <Text style={[styles.employee, { color: colors.mutedForeground }]}>
              {order.userName}
            </Text>
          )}
          {order.notes ? (
            <Text style={[styles.notes, { color: colors.mutedForeground }]}>
              {order.notes}
            </Text>
          ) : null}
        </View>

        <View style={styles.right}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {order.totalPrice.toFixed(2)}
          </Text>
          <Text style={[styles.currency, { color: colors.mutedForeground }]}>ريال</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatTime(order.timestamp)}
          </Text>
          {!order.isSynced && !order.isCancelled && (
            <Ionicons name="cloud-offline-outline" size={12} color={colors.mutedForeground} />
          )}
        </View>
      </View>

      {onCancel && !order.isCancelled && (
        <TouchableOpacity
          onPress={() => onCancel(order.id)}
          style={[styles.cancelBtn, { borderColor: colors.destructive }]}
          activeOpacity={0.75}
        >
          <Ionicons name="close-circle-outline" size={14} color={colors.destructive} />
          <Text style={[styles.cancelBtnText, { color: colors.destructive }]}>إلغاء</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 8,
    overflow: 'hidden',
  },
  cancelledBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomRightRadius: 10,
    zIndex: 1,
  },
  cancelledText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  info: { flex: 1, gap: 3 },
  product: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'right',
  },
  employee: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
  },
  notes: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
    minWidth: 70,
    marginLeft: 12,
  },
  price: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  currency: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  time: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
