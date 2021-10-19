import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BorderlessButton, RectButton } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  interpolate,
  useAnimatedReaction,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

import type { SwipeableActionItemRender } from './Swipeable';

const BASE_BG_CIRCLE_SIZE = 128;

const AnimatedBorderlessButton =
  Animated.createAnimatedComponent(BorderlessButton);
const AnimatedRectButton = Animated.createAnimatedComponent(RectButton);

export interface SwipeableActionItemContainerProps {
  gestureX: Animated.SharedValue<number>;
  totalWidth: number;
  order: number;
  position: 'left' | 'right';
  size: number;
  backgroundColor: string;
  canEngage?: boolean;
  engageThreshold?: number;
  didEngage?: Animated.SharedValue<boolean>;
  renderFn: SwipeableActionItemRender;
  renderEngagedFn?: SwipeableActionItemRender;
  onMinWidthChange?(width: number, key: string): void;
  onPress?(): any;
}

export function SwipeableActionItemContainer({
  order,
  size,
  position,
  gestureX,
  backgroundColor,
  canEngage,
  engageThreshold = size,
  didEngage,
  renderFn,
  renderEngagedFn,
  totalWidth,
  onPress,
}: SwipeableActionItemContainerProps) {
  const [selfHeight, setSelfHeight] = useState(1);

  const gestureDeltaThresoldToEngage = totalWidth + engageThreshold;

  const gestureDelta = useDerivedValue(
    () => gestureX.value * (position === 'right' ? -1 : 1)
  );

  const isEngaged = useDerivedValue(() => {
    if (!canEngage) {
      return false;
    }

    return gestureDelta.value > gestureDeltaThresoldToEngage;
  });

  const currentActionsContainerWidth = useDerivedValue(() => {
    const containerSurplus = gestureDelta.value - totalWidth;
    return Math.max(totalWidth, totalWidth + containerSurplus);
  });

  const baseWidthRatio = size / totalWidth;
  const currentWidthRatio = useDerivedValue(() => {
    if (isEngaged.value) {
      return 1;
    }

    return baseWidthRatio;
  });

  // Using `withSpring` directly in `useAnimatedStyle` did not work,
  // so we use it in a `useDerivedValue` here
  const currentWidthRatioWithSpring = useDerivedValue(() =>
    withSpring(currentWidthRatio.value, {
      damping: 10,
      mass: 0.5,
    })
  );

  const currentItemWidth = useDerivedValue(() => {
    return Math.max(
      size,
      currentActionsContainerWidth.value * currentWidthRatio.value
    );
  });

  useAnimatedReaction(
    () => isEngaged.value,
    (_isEngaged) => didEngage && (didEngage.value = _isEngaged)
  );

  const dividerOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        gestureDelta.value,
        [totalWidth / 2, totalWidth],
        [0, 1],
        Extrapolate.CLAMP
      ),
    };
  });

  const itemPositionStyle = useAnimatedStyle(() => {
    const targetOffset = size * order;
    const movingOffset = (targetOffset + currentItemWidth.value - size) * order;

    const displacementInterpolation = interpolate(
      gestureDelta.value,
      [0, totalWidth, currentActionsContainerWidth.value],
      position === 'right'
        ? [size, -targetOffset, -movingOffset]
        : [-size, targetOffset, movingOffset]
    );

    return {
      transform: [{ translateX: displacementInterpolation }],
    };
  });

  const itemWidthStyle = useAnimatedStyle(() => {
    return {
      width:
        currentActionsContainerWidth.value * currentWidthRatioWithSpring.value,
    };
  });

  const engagedCircleTransforms = useAnimatedStyle(() => {
    const circleSize = (() => {
      if (isEngaged.value) {
        return currentItemWidth.value * Math.SQRT2;
      }

      return 0;
    })();

    return {
      transform: [
        { translateX: currentItemWidth.value / 2 - BASE_BG_CIRCLE_SIZE / 2 },
        { translateY: selfHeight / 2 - BASE_BG_CIRCLE_SIZE / 2 },
        {
          scale: withSpring(circleSize / BASE_BG_CIRCLE_SIZE, {
            damping: 25,
            mass: 1,
          }),
        },
      ],
    };
  });

  const engagedViewOpacity = useAnimatedStyle(() => ({
    opacity: withDelay(
      isEngaged.value ? 0 : 300,
      withTiming(isEngaged.value ? 1 : 0, { duration: 100 })
    ),
  }));

  const ButtonComponent =
    Platform.OS === 'android' ? AnimatedRectButton : AnimatedBorderlessButton;

  return (
    <ButtonComponent
      rippleColor="#0000001f"
      onPress={onPress}
      activeOpacity={0.25}
      disallowInterruption={!!onPress}
      style={[
        styles.container,
        itemPositionStyle,
        itemWidthStyle,
        { zIndex: -order },
      ]}
    >
      <Animated.View style={StyleSheet.absoluteFill}>
        {renderFn()}
      </Animated.View>
      {renderEngagedFn && (
        <View style={[styles.engagedViewContainer]}>
          <Animated.View
            renderToHardwareTextureAndroid
            style={[
              styles.circleBackground,
              engagedCircleTransforms,
              { backgroundColor },
            ]}
          />
          <Animated.View style={[StyleSheet.absoluteFill, engagedViewOpacity]}>
            {renderEngagedFn()}
          </Animated.View>
        </View>
      )}
      {order > 0 && (
        <Animated.View
          style={[
            styles.divider,
            position === 'left' && styles.dividerLeft,
            dividerOpacityStyle,
          ]}
        />
      )}
      <View
        style={StyleSheet.absoluteFill}
        onLayout={(event) => setSelfHeight(event.nativeEvent.layout.height)}
      />
    </ButtonComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  divider: {
    position: 'absolute',
    right: 0,
    top: 24,
    bottom: 24,
    width: 1,
    backgroundColor: 'rgba(48, 55, 66, 0.1)',
  },
  dividerLeft: {
    left: 0,
    right: undefined,
  },
  circleBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BASE_BG_CIRCLE_SIZE,
    height: BASE_BG_CIRCLE_SIZE,
    borderRadius: BASE_BG_CIRCLE_SIZE / 2,
  },
  engagedViewContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
