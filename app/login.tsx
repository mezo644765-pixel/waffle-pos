import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, setGasUrl, gasUrl } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gasInput, setGasInput] = useState(gasUrl);
  const [showSetup, setShowSetup] = useState(!gasUrl);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      Alert.alert('خطأ في الدخول', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGas = async () => {
    const trimmed = gasInput.trim();
    if (!trimmed.startsWith('https://')) {
      Alert.alert('تنبيه', 'يرجى إدخال رابط صحيح يبدأ بـ https://');
      return;
    }
    await setGasUrl(trimmed);
    setShowSetup(false);
    Alert.alert('تم الحفظ', 'تم حفظ رابط النظام بنجاح');
  };

  return (
    <LinearGradient
      colors={['#FFF8F0', '#F5E6D3', '#EDD9C0']}
      style={styles.flex}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 24),
              paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 40),
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={[styles.logoRing, { backgroundColor: colors.primary }]}>
              <Ionicons name="restaurant" size={44} color="#fff" />
            </View>
            <Text style={[styles.appName, { color: colors.coffee }]}>وافل الجو</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              نظام إدارة المبيعات
            </Text>
          </View>

          {/* Login card */}
          <View
            style={[
              styles.card,
              { backgroundColor: 'rgba(255,255,255,0.90)', borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              تسجيل الدخول
            </Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                البريد الإلكتروني
              </Text>
              <View
                style={[
                  styles.inputRow,
                  { borderColor: colors.border, backgroundColor: colors.input },
                ]}
              >
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.textInput, { color: colors.foreground }]}
                  textAlign="right"
                />
                <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                كلمة المرور
              </Text>
              <View
                style={[
                  styles.inputRow,
                  { borderColor: colors.border, backgroundColor: colors.input },
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  style={[styles.textInput, { color: colors.foreground }]}
                  textAlign="right"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.loginBtnText, { color: colors.primaryForeground }]}>
                  دخول
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Setup toggle */}
          <TouchableOpacity
            onPress={() => setShowSetup((v) => !v)}
            style={styles.setupToggle}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showSetup ? 'settings' : 'settings-outline'}
              size={14}
              color={colors.mutedForeground}
            />
            <Text style={[styles.setupToggleText, { color: colors.mutedForeground }]}>
              {showSetup ? 'إخفاء إعدادات النظام' : 'إعداد رابط النظام'}
            </Text>
          </TouchableOpacity>

          {showSetup && (
            <View
              style={[
                styles.setupCard,
                { backgroundColor: 'rgba(255,255,255,0.75)', borderColor: colors.border },
              ]}
            >
              <Text style={[styles.setupTitle, { color: colors.foreground }]}>
                رابط Google Apps Script
              </Text>
              <Text style={[styles.setupHint, { color: colors.mutedForeground }]}>
                انسخ رابط الـ Web App من Google Apps Script وألصقه هنا
              </Text>
              <View
                style={[
                  styles.inputRow,
                  { borderColor: colors.border, backgroundColor: colors.input },
                ]}
              >
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
                style={[styles.saveBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.saveBtnText, { color: colors.accentForeground }]}>
                  حفظ الرابط
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 16,
    alignItems: 'center',
  },
  hero: { alignItems: 'center', gap: 10, marginBottom: 8 },
  logoRing: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C8873A',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 14,
  },
  appName: { fontSize: 36, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  tagline: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'right' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    height: 52,
  },
  loginBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginBtnText: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  setupToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  setupToggleText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  setupCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  setupTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'right' },
  setupHint: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  saveBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
