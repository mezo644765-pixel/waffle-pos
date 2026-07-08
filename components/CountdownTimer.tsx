import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 56;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CountdownTimerProps {
  duration?: number;
  orderSummary: string;
  price: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CountdownTimer({
  duration = 5,
  orderSummary,
  price,
  onConfirm,
  onCancel,
}: CountdownTimerProps) {
  const colors = useColors();
  const progress = useSharedValue(1);
  const [displaySeconds, setDisplaySeconds] = React.useState(duration);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    progress.value = withTiming(0, {
      duration: duration * 1000,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) runOnJS(onConfirm)();
    });
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, Math.ceil(duration - elapsed));
      setDisplaySeconds(left);
    }, 100);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(45,27,14,0.88)' }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.summary, { color: colors.mutedForeground }]}>
          {orderSummary}
        </Text>
        <Text style={[styles.priceLabel, { color: colors.primary }]}>
          {price.toFixed(2)} ريال
        </Text>

        <View style={styles.svgWrap}>
          <Svg
            width={RADIUS * 2 + STROKE_WIDTH * 2}
            height={RADIUS * 2 + STROKE_WIDTH * 2}
            style={styles.svg}
          >
            {/* Background ring */}
            <Circle
              cx={RADIUS + STROKE_WIDTH}
              cy={RADIUS + STROKE_WIDTH}
              r={RADIUS}
              stroke={colors.muted}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress ring */}
            <AnimatedCircle
              cx={RADIUS + STROKE_WIDTH}
              cy={RADIUS + STROKE_WIDTH}
              r={RADIUS}
              stroke={colors.primary}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={animatedProps}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RADIUS + STROKE_WIDTH}, ${RADIUS + STROKE_WIDTH}`}
            />
          </Svg>
          <View style={styles.countCenter}>
            <Text style={[styles.countNumber, { color: colors.foreground }]}>
              {displaySeconds}
            </Text>
            <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
              ثانية
            </Text>
          </View>
        </View>

        <Text style={[styles.confirmMsg, { color: colors.foreground }]}>
          سيتم تأكيد البيع تلقائياً...
        </Text>

        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onCancel(); }}
          style={[styles.cancelBtn, { backgroundColor: colors.destructive }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.cancelText, { color: colors.destructiveForeground }]}>
            إلغاء
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    width: 300,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  summary: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  priceLabel: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  svgWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  svg: {},
  countCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countNumber: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    lineHeight: 54,
  },
  countLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  confirmMsg: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
});
