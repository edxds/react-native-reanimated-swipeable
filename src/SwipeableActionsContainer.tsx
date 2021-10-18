import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';

export interface SwipeableActionsContainerProps
  extends React.ComponentProps<typeof Animated.View> {
  position: 'left' | 'right';
  children: React.ReactNode;
  gestureX: Animated.SharedValue<number>;
  onSizeChange?(size: number): void;
}

export function SwipeableActionsContainer({
  style,
  position,
  children,
  gestureX,
  onSizeChange,
  ...props
}: SwipeableActionsContainerProps) {
  const containerRef = useRef<View>(null);

  const [childrenWidth, setChildrenWidth] = useState(0);

  const animatedProps = useAnimatedProps<ViewProps>(() => {
    const shouldShow =
      position === 'right' ? gestureX.value < 0 : gestureX.value > 0;

    return { pointerEvents: shouldShow ? 'auto' : 'none' };
  });

  const opacityStyle = useAnimatedStyle(() => {
    const shouldShow =
      position === 'right' ? gestureX.value < 0 : gestureX.value > 0;

    return { opacity: shouldShow ? 1 : 0 };
  });

  const parentDisplacement = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          gestureX.value,
          position === 'right' ? [-childrenWidth, 0] : [0, childrenWidth],
          position === 'right' ? [0, childrenWidth] : [-childrenWidth, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  useEffect(() => {
    requestAnimationFrame(() => {
      containerRef.current?.measure((_, __, width) => {
        setChildrenWidth(width);
        onSizeChange?.(width);
      });
    });
  }, [children, onSizeChange]);

  return (
    <Animated.View
      collapsable={false}
      animatedProps={animatedProps}
      style={[styles.base, parentDisplacement, opacityStyle, style]}
      {...props}
    >
      <View
        ref={containerRef}
        collapsable={false}
        style={[
          position === 'left' && styles.positionLeft,
          position === 'right' && styles.positionRight,
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
  },
  positionLeft: {
    overflow: 'visible',
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  positionRight: {
    overflow: 'visible',
    flexDirection: 'row-reverse',
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
  },
  divider: {
    width: 1,
    marginVertical: 24,
    backgroundColor: 'rgba(48, 55, 66, 0.1)',
  },
});
