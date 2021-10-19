import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
} from 'react-native-reanimated';

export interface SwipeableActionsContainerProps
  extends React.ComponentProps<typeof Animated.View> {
  position: 'left' | 'right';
  gestureX: Animated.SharedValue<number>;
  children: React.ReactNode;
}

export function SwipeableActionsContainer({
  style,
  position,
  children,
  gestureX,
  ...props
}: SwipeableActionsContainerProps) {
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

  return (
    <Animated.View
      collapsable={false}
      animatedProps={animatedProps}
      style={[
        styles.base,
        position === 'left' && styles.positionLeft,
        position === 'right' && styles.positionRight,
        opacityStyle,
        style,
      ]}
      {...props}
    >
      {children}
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
