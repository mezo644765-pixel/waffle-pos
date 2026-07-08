import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrdersContext';
import { useNetwork } from '@/context/NetworkContext';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, gasUrl } = useAuth();
  const { isWorking, endShift, shifts } = useOrders();
  const { isOnline } = useNetwork();
  const [endingShift, setEndingShift] = useState(false);

  const activeShift = shifts.find((s) => s.userId === user?.id && s.isActive);
  const shiftDuration = activeShift
    ? Math.floor((Date.now() - new Date(activeShift.startTime).getTime()) / 60000)
    : 0;

  const handleEndShift = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('إنهاء الوردية', 'هل تريد إنهاء الوردية الآن؟', [
      { text: 'تراجع', style: 'cancel' },
      {
        text: 'إنهاء',
        style: 'destructive',
        onPress: async () => {
          setEndingShift(true);
          await endShift();
          setEndingShift(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: logout },
    ]);
  };

  const padTop = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const padBottom = insets.bottom + (Platform.OS === 'web' ? 84 : 88);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#8B4513', '#C8873A']}
        style={[styles.headerGrad, { paddingTop: padTop + 20 }]}
      >
        <View style={styles.avatarRing}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: padBottom }]}
      >
        {/* Shift status */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={isWorking ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={isWorking ? colors.online : colors.mutedForeground}
            />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {isWorking ? 'وردية نشطة' : 'لا توجد وردية'}
            </Text>
          </View>
          {isWorking && activeShift && (
            <>
              <Text style={[styles.shiftTime, { color: colors.mutedForeground }]}>
                بدأت: {new Date(activeShift.startTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={[styles.shiftDuration, { color: colors.primary }]}>
                مدة الوردية: {shiftDuration} دقيقة
              </Text>
              <TouchableOpacity
                onPress={handleEndShift}
                disabled={endingShift}
                style={[styles.endShiftBtn, { borderColor: colors.destructive }]}
                activeOpacity={0.85}
              >
                <Ionicons name="stop-circle-outline" size={18} color={colors.destructive} />
                <Text style={[styles.endShiftText, { color: colors.destructive }]}>
                  {endingShift ? 'جاري الإنهاء...' : 'إنهاء الوردية'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Network status */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={isOnline ? 'wifi' : 'cloud-offline-outline'}
              size={18}
              color={isOnline ? colors.online : colors.destructive}
            />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {isOnline ? 'متصل بالإنترنت' : 'غير متصل'}
            </Text>
          </View>
          {!isOnline && (
            <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>
              المبيعات محفوظة محلياً وستُزامَن عند الاتصال
            </Text>
          )}
        </View>

        {/* System info */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="link-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>رابط النظام</Text>
          </View>
          <Text
            style={[styles.gasUrl, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {gasUrl || 'غير مُعيَّن'}
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.secondary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: { alignItems: 'center', paddingBottom: 28, gap: 6 },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 36, fontFamily: 'Inter_700Bold', color: '#fff' },
  userName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  userEmail: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)' },
  content: { padding: 16, gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'right' },
  shiftTime: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  shiftDuration: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'right' },
  endShiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-end',
  },
  endShiftText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  cardHint: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  gasUrl: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'left' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
