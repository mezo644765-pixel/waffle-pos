import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
}

export function StatCard({ label, value, icon, accentColor }: StatCardProps) {
  const colors = useColors();
  const accent = accentColor ?? colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon} size={22} color={accent} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    minWidth: 100,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
