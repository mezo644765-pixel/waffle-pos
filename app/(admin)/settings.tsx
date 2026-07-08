import React, { useState } from 'react';
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
import { useAuth } from '@/context/AuthContext';

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function AdminSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gasUrl, setGasUrl, logout } = useAuth();

  const [gasInput, setGasInput] = useState(gasUrl);
  const [savingGas, setSavingGas] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [addingUser, setAddingUser] = useState(false);

  const handleSaveGas = async () => {
    const trimmed = gasInput.trim();
    if (!trimmed.startsWith('https://')) {
      Alert.alert('تنبيه', 'الرابط يجب أن يبدأ بـ https://');
      return;
    }
    setSavingGas(true);
    try {
      await setGasUrl(trimmed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('تم', 'تم حفظ رابط النظام');
    } finally {
      setSavingGas(false);
    }
  };

  const handleAddUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول');
      return;
    }
    if (!gasUrl) {
      Alert.alert('تنبيه', 'يرجى ضبط رابط النظام أولاً');
      return;
    }
    setAddingUser(true);
    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addUser',
          user: {
            id: genId(),
            name: newName.trim(),
            email: newEmail.trim(),
            password: newPassword.trim(),
            role: newRole,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('تم إضافة الموظف', `تمت إضافة ${newName} بنجاح`);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('user');
      } else {
        throw new Error(data.error ?? 'فشل الإضافة');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ';
      Alert.alert('خطأ', msg);
    } finally {
      setAddingUser(false);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل خروج المدير؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: logout },
    ]);
  };

  const padTop = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const padBottom = insets.bottom + (Platform.OS === 'web' ? 84 : 88);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#6B3A2A', '#8B4513']}
        style={[styles.header, { paddingTop: padTop + 16 }]}
      >
        <Text style={styles.headerTitle}>الإعدادات</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: padBottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* GAS URL */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="link-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>رابط Google Apps Script</Text>
          </View>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
            <TextInput
              value={gasInput}
              onChangeText={setGasInput}
              placeholder="https://script.google.com/macros/s/..."
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              style={[styles.textInput, { color: colors.foreground, fontSize: 11 }]}
              textAlign="left"
            />
          </View>
          <TouchableOpacity
            onPress={handleSaveGas}
            disabled={savingGas}
            style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: savingGas ? 0.7 : 1 }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>
              {savingGas ? 'جاري الحفظ...' : 'حفظ الرابط'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add user */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-add-outline" size={20} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>إضافة موظف جديد</Text>
          </View>

          <Field label="الاسم الكامل" colors={colors}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="محمد عبدالله"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground }]}
              textAlign="right"
            />
          </Field>
          <Field label="البريد الإلكتروني" colors={colors}>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="employee@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.textInput, { color: colors.foreground }]}
              textAlign="right"
            />
          </Field>
          <Field label="كلمة المرور" colors={colors}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              style={[styles.textInput, { color: colors.foreground }]}
              textAlign="right"
            />
          </Field>

          {/* Role selector */}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>الصلاحية</Text>
          <View style={styles.roleRow}>
            {(['user', 'admin'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setNewRole(r)}
                style={[
                  styles.roleBtn,
                  { borderColor: newRole === r ? colors.accent : colors.border },
                  newRole === r && { backgroundColor: colors.accent + '22' },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={r === 'admin' ? 'shield-checkmark-outline' : 'person-outline'}
                  size={16}
                  color={newRole === r ? colors.accent : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.roleText,
                    { color: newRole === r ? colors.accent : colors.foreground },
                  ]}
                >
                  {r === 'admin' ? 'مدير' : 'موظف'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleAddUser}
            disabled={addingUser}
            style={[styles.actionBtn, { backgroundColor: colors.accent, opacity: addingUser ? 0.7 : 1 }]}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>
              {addingUser ? 'جاري الإضافة...' : 'إضافة الموظف'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.secondary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>تسجيل خروج المدير</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colors: Record<string, any>;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff', textAlign: 'right' },
  scroll: { padding: 16, gap: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', flex: 1, textAlign: 'right' },
  fieldWrap: { gap: 5 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  textInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', height: 50 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
  },
  roleText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  actionBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
  },
  logoutText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
