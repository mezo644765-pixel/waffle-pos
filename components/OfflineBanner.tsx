import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useNetwork } from '@/context/NetworkContext';

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  const colors = useColors();
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!isOnline) {
      translateY.value = withTiming(0, { duration: 350 });
      opacity.value = withTiming(1, { duration: 350 });
    } else {
      translateY.value = withTiming(-80, { duration: 350 });
      opacity.value = withTiming(0, { duration: 350 });
    }
  }, [isOnline, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animStyle, { backgroundColor: colors.destructive }]}>
      <View style={styles.inner}>
        <Ionicons name="cloud-offline" size={18} color="#fff" />
        <Text style={styles.text}>
          {'وضع عدم الاتصال — المبيعات محفوظة محلياً وستُزامَن عند الاتصال'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingTop: Platform.OS === 'web' ? 67 : 0,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    flexShrink: 1,
  },
});
